const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const asyncFFMPEG = async (folderPath , folder , videoname) =>{  
    return new Promise((resolve , reject) =>{
      ffmpeg({source: path.join(folderPath , videoname) })
          .on('filenames' ,async (filenames)=>{ 
            
          })
          .on("end", async () =>{
            resolve("end") 
          })
          .takeScreenshots({
            filename:"thumbnail.jpg",
            count:4,
            size:'1280x720'
          }, path.join(folderPath , "thumbnails"))
          .on('error' , err => reject(new Error(err)));
    })
  }
module.exports = asyncFFMPEG;