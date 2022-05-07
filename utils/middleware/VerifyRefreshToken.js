const jwt = require("jsonwebtoken");

const auth = (passedToken) =>{
    return (req , res , next) =>{
        
        const token = req.body.SSRFSH;
        
        if(!token) return res.status(401).send('Access Denied');
        try {
            const verified = jwt.verify(token , passedToken);
            req.data = verified;
            req.refreshToken = token;
            next()
        } catch (error) {
            res.status(400).send("Invalid Token")
        }
    }
   
}

module.exports = auth;