const jwt = require("jsonwebtoken");

const auth = (passedToken) =>{
    return (req , res ,next) =>{
        let token ;
        if(typeof req.headers.authorization !== "undefined"){
            token = req.headers.authorization.split(" ")[1]
        }
        if(!token) return res.status(401).send('Access Denied');
        try {
            const verified = jwt.verify(token , passedToken);
            req.data = verified;
            next()
        } catch (error) {
            res.status(401).send("Token is expired")
        }
    }
   
}

module.exports = auth;