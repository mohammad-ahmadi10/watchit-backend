const jwt = require("jsonwebtoken");

const verify = () =>{
    return  ( req , res , next) =>{
        const token = req.body.token;
        if(!token) return res.status(401).send('Access Denied');
            try {
                const verified = jwt.verify(token , process.env.ACCESSTOKEN);
                req.data = verified;
                
                next()
            } catch (error) {
                res.status(400).send(error)
            }
    }


    
}

module.exports = verify;