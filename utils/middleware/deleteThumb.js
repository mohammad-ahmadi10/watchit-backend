const fs = require('fs');
const path = require('path');
const { baseURL } = require('../consts');

const emptyThumbDir = () =>{
    return  ( req , res , next) =>{
        const {thumb} = req.body;

        const thumbfolder = req.body.thumbfolder;
        const files = fs.readdirSync(thumbfolder);
        if(files.length === 1) return   next();       
        for(const file of files){
            if(file === thumb) continue;
            fs.unlinkSync(path.join(thumbfolder , file));
        }
        
        next()
        return;
        
    }

}

module.exports = emptyThumbDir;