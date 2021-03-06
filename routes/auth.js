const router = require('express').Router();
const User = require("../models/user");
const Verify = require("../models/verify");
const Video = require("../models/video")
const Like = require("../models/like")
const Comment = require("../models/comment")
const View = require("../models/view");
const Playlist = require("../models/playlist")
const History = require("../models/history");


const path = require("path");
const fs = require("fs");
const {validate , ValidationError} = require("express-validation");
const registerValidate = require("../utils/validation").registerValidate;
const nodemailer = require("nodemailer");


const bcrypt = require('bcryptjs');
const JWT = require("jsonwebtoken");
const verify = require("../utils/middleware/verifyToken");
const verifyRefreshToken = require("../utils/middleware/VerifyRefreshToken");
const {baseURL}  = require("../utils/consts");



const transporter = nodemailer.createTransport({
      host:process.env.HOST,
      auth:{
          user:process.env.EMAILUSER,
          pass:process.env.PASSWORD
      }
})



router 
.post("/register" ,   async ( req , res) =>{
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

        const url = `${process.env.APIIP}/auth/confirmation/${emailToken}`
        const options = 
            {
                from:process.env.EMAILUSER,
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

.post("/rmMe", verify(process.env.ACCESSTOKEN) , async(req,res)=>{
    const {username} = req.body;
    const userID = req.data._id;

    const user = await User.deleteOne({"_id":userID, username:username})
    if(!user) return res.status(400).json({mssg:"no user is found!"})

    await Like.deleteMany({userID})
    await History.deleteMany({userID})
    await Comment.deleteMany({userID})
    await Playlist.deleteMany({userID})
    
    const videos = await Video.find({userID})
    videos.forEach(async(v)=>{
        await View.deleteOne({videoID:v.folderPath})
    })
    await Video.deleteMany({userID})

    // remove folders
    const folderDirectory = path.join(baseURL, userID)
    try {
        if (fs.existsSync(folderDirectory)) {
          fs.rm(folderDirectory , {recursive:true}, (err) =>{
              console.log(err)
          });
        }
      } catch (err) {
        console.error(err)
      }
    res.json("user is successfully deleted!")
})

.get("/confirmation/:id" , async (req, res) =>{
     const id = req.params.id 


     if(typeof id === 'undefined') return res.status(400).json({mssg:"no user with this token is found!"})
     try {
         const rs = JWT.verify(id, process.env.EMAILTOKEN);       

         const user = await User.findOne({"_id":rs._id})
         if(user.active) return res.status(403).send("your Email is already confirmed!<br> "+
                                                        "go to Login page! <a href='http://192.168.188.52:3000/login'>Login</a> ")     
        await User.updateOne({"_id":rs._id} , {
            $set:{"active":true}
        })
        await Verify.deleteOne({userID:rs._id})
        res.status(200).send("Confirmation was sucessfull! go to Login page! <a href='http://192.168.188.52:3000/login'>Login</a>")

     } catch (error) {
         res.status(400).send("invalid TOKEN")
     }
     
     
 })

.post("/login" , async (req , res) =>{
    const {emailusername , password , isEmail } = req.body; 
    // check if the user is already in the database  
    const user = isEmail === "true" || isEmail === true ? await User.findOne({email:emailusername}) : 
                                    await User.findOne({username:emailusername})

        if(!user) return res.status(403).json("Email or Username or Password is wrong");
        if(!user.active) return res.status(403).json({mssg:"please confirm your email"})
        
        // password compare
        const validPass = await bcrypt.compare(password , user.password);
        if(!validPass) return res.status(403).json("Emial or username or Password is wrong");
        
        
        // CREATE and assign a token & refreshToken
        const accessToken = JWT.sign({_id:user._id} , process.env.ACCESSTOKEN , {
            expiresIn: "900s"
        })
        const refreshtoken = JWT.sign({_id:user._id} , process.env.REFRESHTOKEN , {
            expiresIn: "90d"
        })    
        const response = {
            user:{id:user._id , username:user.username, email:user.email},
            logedIn: true, 
            tokens:{ACTKEN:accessToken, SSRFSH:refreshtoken }
        }
        
        isEmail === "true" || isEmail === true? 
        await User.updateOne({email:emailusername} , {
            $push: {"refreshToken":[refreshtoken]}
        })
        : 
        await User.updateOne({username:emailusername} , {
            $push: {"refreshToken":[refreshtoken]}
        })    


    /* res.status(200).cookie(refreshTokenName , refreshtoken , 
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
    }) */

    res.json(response)
})


.post("/device/login", async (req,res) =>{
    const {emailusername , password , isEmail } = req.body; 
    const user = isEmail === "true" || isEmail === true  ? 
              await User.findOne({email:emailusername})
            : await User.findOne({username:emailusername})
        if(!user) return res.status(403).json("Email or Username or Password is wrong");
        
        // password compare
        const validPass = await bcrypt.compare(password , user.password);
        if(!validPass) return res.status(403).json("Emial or username or Password is wrong");
        
        
        // CREATE and assign a token & refreshToken
        const accessToken = JWT.sign({_id:user._id} , process.env.ACCESSTOKEN , {
        })
        const refreshtoken = JWT.sign({_id:user._id} , process.env.REFRESHTOKEN , {
            expiresIn: "90d"
        })    
        const response = {
            user:{id:user._id , username:user.username, email:user.email},
            logedIn: true, 
            accessToken
        }
        
        isEmail === "true"  || isEmail === true? 
        await User.updateOne({email:emailusername} , {
            $push: {"refreshToken":[refreshtoken]}
        })
        : 
        await User.updateOne({username:emailusername} , {
            $push: {"refreshToken":[refreshtoken]}
        })

    res.json({user:response})
  })

.get("/logout" , verify(process.env.ACCESSTOKEN) , async (req , res) =>{
    
    const id = req.data._id;
    const user = await User.findOne({id})
    if(user.refreshToken.length <=0)return res.json({mssg:"user is already logged out"})
    await User.updateOne({"_id" : id} , {
        $set: {"refreshToken":[]}
    })

    /* res.status(200).cookie(refreshTokenName , "" , 
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
        }) */
        res.json({mssg:"successfully logout"})
})

.get("/refresh" , verifyRefreshToken(process.env.REFRESHTOKEN) ,  async(req , res) =>{
    
    const refreshtoken = req.refreshToken;

    const id = req.data._id;
    const user =  await User.findOne({id});
    if(!user.refreshToken.includes(refreshtoken))
        res.status(403).json({message: "Invalid refresh Token"})
    try {
        const {_id} = JWT.verify(refreshtoken , process.env.REFRESHTOKEN);
        
        const accessToken = JWT.sign(
            {_id},
            process.env.ACCESSTOKEN,
            {expiresIn:"900s"}
        )
        /* res.status(200).cookie( accessTokenName , accessToken , 
        {   sameSite:'strict' , 
            httpOnly:true , 
            path:"/",
            expires:new Date(new Date().getTime() + tokenTime),
        }) */
        res.json({messgae:"Token is refreshed", accessToken})




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
    

    const url = `${process.env.FRONTEND}/reset-password/${emailToken}`
    const options = 
        {   
            from:process.env.EMAILUSER,
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
