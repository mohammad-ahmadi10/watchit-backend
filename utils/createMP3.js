const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const asyncFFMPEG = async (folderPath , videoname) =>{
    
    const audioName = path.join(folderPath ,  "audio" + ".mp3") 
    return new Promise((resolve , reject) =>{

        resolve( 
            ffmpeg({source:path.join(folderPath , videoname) })
            .noVideo()
            .output(audioName)
            .run()
        )
        
    })
}

module.exports = asyncFFMPEG;
