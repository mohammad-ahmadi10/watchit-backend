const router = require('express').Router();
const User = require("../models/user");
const Verify = require("../models/verify");
const path = require("path");
const fs = require("fs");
const {validate , ValidationError} = require("express-validation");
const registerValidate = require("../utils/validation").registerValidate;
const nodemailer = require("nodemailer");


const bcrypt = require('bcryptjs');
const JWT = require("jsonwebtoken");
const verify = require("../utils/middleware/verifyToken");
const verifyRefreshToken = require("../utils/middleware/VerifyRefreshToken");
const {refreshTokenName , refreshTokenTime,
       accessTokenName ,  tokenTime, baseURL
}  = require("../utils/consts");


const validateErrorMessage = (err, req, res, next)  => {
    const errorMessg = err.details.body[0].message;
    if (err instanceof ValidationError) { 
      return res.status(err.statusCode).json(errorMessg)
    }
}

const transporter = nodemailer.createTransport({
      host:process.env.HOST,
      auth:{
          user:process.env.USER,
          pass:process.env.PASSWORD
      }
})


router 
.post("/register" , /* validate(registerValidate, {}, {}) , */    async ( req , res) =>{
    const {username , email , password } = req.body;
    // check if the user is already in the database
    const emailExist = await User.findOne({email})
    if(emailExist) return res.status(400).json("Email already exists");
    
    const usernameExist = await User.findOne({username});
    if(usernameExist) return res.status(400).json("username already exists");
    
    try {
        // hash the password
        const salt = await bcrypt.genSalt(15);
        const hashedPass = await bcrypt.hash(password , salt);
        const newUser = await User.create({
            username,
            email,
            password : hashedPass,
            refreshtoken:[]
        })

        // send email
        const emailToken = JWT.sign({_id:newUser._id} , process.env.EMAILTOKEN , {
            expiresIn: "86400s" // one day
        })
        await Verify.create({
            verifyNumber:emailToken,
            userID:newUser._id
        })

        const url = `http:/192.168.188.52:8200/auth/confirmation/${emailToken}`
        const options = 
            {
                from:process.env.USER,
                to:newUser.email,
                subject:'Confirm Email',
                html:`Please click it to confirm your email: <a href=${url}>confirm</a><br>`
        }
        
        await transporter.sendMail(options)
        res.json({user: newUser._id, mssg:"please confirm your Email!"});
        
    } catch (error) {
        res.json(error).status(400);
    }
})

.get("/confirmation/?:id" , async (req, res) =>{
     const id = req.params.id 

     if(typeof id === 'undefined') return res.status(400).json({mssg:"no user with this token is found!"})
     try {
         const rs = await JWT.verify(id, process.env.EMAILTOKEN);
         const user = await User.findOne({"_id":rs._id})
         if(user.active) return res.status(403).send("your Email is already confirmed!<br> "+
                                                        "go to Login page! <a href='http://192.168.188.52:3000/login'>Login</a> ")     
        await User.updateOne({id} , {
            $set:{"active":true}
        })
        await Verify.deleteOne({userID:id})
        res.status(200).send("Confirmation was sucessfull! go to Login page! <a href='http://192.168.188.52:3000/login'>Login</a>")

     } catch (error) {
         res.status(400).send("invalid TOKEN")
     }
     
     
 })

.post("/login" /* , validate(loginValidate , {}, {}) */ , async (req , res) =>{
    const {emailusername , password , isEmail } = req.body; 
    // check if the user is already in the database    
    const user = isEmail ? 
              await User.findOne({email:emailusername})
            : await User.findOne({username:emailusername})
        
        if(!user) return res.status(403).json("Email or Username or Password is wrong");
        if(!user.active) return res.status(403).json({mssg:"please confirm your email"})
        
        // password compare
        const validPass = await bcrypt.compare(password , user.password);
        if(!validPass) return res.status(403).json("Emial or username or Password is wrong");
        
        
        // CREATE and assign a token & refreshToken
        const accessToken = JWT.sign({_id:user._id} , process.env.ACCESSTOKEN , {
            expiresIn: "900s"
        })
        const refreshtoken = await JWT.sign({_id:user._id} , process.env.REFRESHTOKEN , {
            expiresIn: "90d"
        })    
        const response = {
            user:{id:user._id , username:user.username, email:user.email},
            logedIn: true
        }
        
    await User.updateOne({email:emailusername} , {
        $push: {"refreshToken":[refreshtoken]}
    })
               


    res.status(200).cookie(refreshTokenName , refreshtoken , 
    {   sameSite:'strict' , 
        httpOnly:true , 
        path:"/",
        expires:new Date(new Date().getTime() + refreshTokenTime)
    })
    res.status(200).cookie(accessTokenName , accessToken , 
    {   sameSite:'strict' , 
        httpOnly:true , 
        path:"/",
        expires:new Date(new Date().getTime() + tokenTime),
    })
    .json(response)
})


.post("/device/login", async (req,res) =>{
    const {emailusername , password , isEmail } = req.body; 

    const user = isEmail ? 
              await User.findOne({email:emailusername})
            : await User.findOne({username:emailusername})
        if(!user) return res.status(403).json("Email or Username or Password is wrong");
        
        // password compare
        const validPass = await bcrypt.compare(password , user.password);
        if(!validPass) return res.status(403).json("Emial or username or Password is wrong");
        
        
        // CREATE and assign a token & refreshToken
        const accessToken = JWT.sign({_id:user._id} , process.env.ACCESSTOKEN , {
        })
        const refreshtoken = await JWT.sign({_id:user._id} , process.env.REFRESHTOKEN , {
            expiresIn: "90d"
        })    
        const response = {
            user:{id:user._id , username:user.username, email:user.email},
            logedIn: true
        }
        
        await User.updateOne({email:emailusername} , {
            $push: {"refreshToken":[refreshtoken]}
        })

    res.json({user:response, token:accessToken})
  })

.get("/logout" , verify(process.env.ACCESSTOKEN) , async (req , res) =>{
    
    const id = req.data._id;
    const user = await User.findOne({id})
    if(user.refreshToken.length <=0)return res.json({mssg:"user is already logged out"})
    await User.updateOne({"_id" : id} , {
        $set: {"refreshToken":[]}
    })

    res.status(200).cookie(refreshTokenName , "" , 
        {   sameSite:'strict' , 
            httpOnly:true , 
            path:"/",
            expires:new Date(new Date().getTime())
        })
        res.status(200).cookie(accessTokenName , "" , 
        {   sameSite:'strict' , 
            httpOnly:true , 
            path:"/",
            expires:new Date(new Date().getTime() ),
        })
        .json({mssg:"successfully logout"})

})

.get("/refresh" , verifyRefreshToken(process.env.REFRESHTOKEN) ,  async(req , res) =>{
    
    const refreshtoken = req.refreshToken;

    const id = req.data._id;
    const user =  await User.findOne({id});
    if(!user.refreshToken.includes(refreshtoken))
        res.status(403).json({message: "Invalid refresh Token"})

    try {
        const {_id} = JWT.verify(refreshtoken , process.env.REFRESHTOKEN);
        
        const accessToken = await JWT.sign(
            {_id},
            process.env.ACCESSTOKEN,
            {expiresIn:"900s"}
        )
        res.status(200).cookie( accessTokenName , accessToken , 
        {   sameSite:'strict' , 
            httpOnly:true , 
            path:"/",
            expires:new Date(new Date().getTime() + tokenTime),
        }).json({messgae:"Token is refreshed"})




    } catch (error) {
        res.status(403).json({message:"Invalid token"})
    }
})

.get("/me", verify(process.env.ACCESSTOKEN) , async (req, res) =>{
    const userID = req.data._id;

    const user = await User.findOne({"_id":userID})
    const modifiedUser = {id:user._id, username:user.username,email:user.email,date:user.data, avatar:user.avatar}
    
    res.json({modifiedUser})
})

.get("/avatar",  verify(process.env.ACCESSTOKEN) , async (req, res) =>{
    const id = req.data._id

    const folderpath =  path.join(baseURL , id);
    try {
        const files = fs.readdirSync(folderpath, {withFileTypes:true});
        if( files.length !== 0){
            const fileNames = files
            .filter(dirent=>dirent.isFile())
            .map(dirent =>dirent.name);
            const stream = fs.createReadStream(path.join(folderpath , fileNames[0]))
            stream.pipe(res);
        }else{
            return res.status(400).json({mssg:"no avatar is found"})
        }
    } catch (error) {
        return res.status(400).json({mssg:"no avatar is found"})
        
    }
   
})

.post("/resetconfirm", async(req, res )=>{
    const email = req.body.email;
    const user = await User.findOne({email})
    if(user === null) return res.status(400).json({mssg:"no user is found"});

    // send email
    const emailToken = JWT.sign({_id:user._id} , process.env.EMAILTOKEN , {
        expiresIn: "86400s" // one day
    })
    await Verify.deleteMany({userID:user._id})
    await Verify.create({
        verifyNumber:emailToken,
        userID:user._id
    })
    

    const url = `http://localhost:3000/reset-password/${emailToken}`
    const options = 
        {   
            from:process.env.USER,
            to:email,
            subject:'Reset password',
            html:`Please click it to reset your password: <a href=${url}>Reset my Password</a><br>`
        }
        
    await transporter.sendMail(options)
    res.json({user: user._id, mssg:"please check your Email!"});
})

.post("/resetpassword", async(req, res) =>{
    const {newPassword, id} = req.body;
    if(typeof id === "undefined") return res.status(400).json({mssg:"wrong token"})
    try {
        const rs = JWT.verify(id, process.env.EMAILTOKEN);

        // hash the password
        const salt = await bcrypt.genSalt(15);
        const hashedPass = await bcrypt.hash(newPassword , salt);

        await User.updateOne({"_id":rs._id},{
            $set:{"password":hashedPass}
        })
        await Verify.deleteOne({userID:rs.userID})        
       res.status(200).send("password was secussfully reseted! please go to login Page  <a href='http://192.168.188.52:3000/login'>Login</a>")
    } catch (error) {
        res.status(400).send("invalid TOKEN")
    }

})





module.exports = router;
