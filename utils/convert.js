const path = require("path")
const Video = require("../models/video")
const ffmpeg = require("fluent-ffmpeg")

const  createVideos =  (width , height  , {videoname , folderPath ,userID, videoPath}) =>{
    const file = videoname
    return new Promise ( async (resolve , reject) =>{
      if(width > 1920 || height > 1080) reject({result: false , mssg: "heigher then as we accept"})
  
      let size = "720p"
      if(height == 1080){
        size = "1080p"
      }
      if(height < 1080 && height > 720) {
        size = "720p"
      }
      if(height < 720 && height > 480){
        size = "480p"
      }
      else if(height < 480){
        size = "small"
      }
  
  
    
      let ratio = []
      if(size === "1080p"){
        ratio = ["1080p" , "720p" , "480p"] 
  
        ffmpeg(path.join(folderPath , file))
        .saveToFile(path.join(folderPath , "1080.mp4"))
        .size('1920x1080').aspect('16:9')
        .saveToFile(path.join(folderPath , "720p.mp4"))
        .size('1280x720').aspect('16:9')
        .saveToFile(path.join(folderPath , "480p.mp4"))
        .size('640x480').aspect('4:3')
        .on("end", async () =>{
          await activeVideo(videoPath)
        })
        .run()
      }
  
      else if(size === "720p"){
        ratio = ["720p" , "480p"] 
        ffmpeg(path.join(folderPath , file))
        .saveToFile(path.join(folderPath , "480p.mp4"))
        .size('640x480').aspect('4:3')
        .saveToFile(path.join(folderPath , "720p.mp4"))
        .size('1280x720').aspect('16:9')
        .on("end", async () =>{
          await activeVideo(videoPath)
        })
        .run()
      }
  
      else if(size === "480p"){
        ratio = [ "480p"] 
  
        ffmpeg(path.join(folderPath , file))
        .saveToFile(path.join(folderPath , "480p.mp4"))
        .size('640x480').aspect('4:3')
        .on("end", async () =>{
          await activeVideo(videoPath)
        })
        .run()
  
   
  
      }
      else if(size == "small"){
        ratio = [ `${height}p`] 
  
        ffmpeg(path.join(folderPath , file))
        .size(`${width}x${height}`).aspect('4:3')
        .saveToFile(path.join(folderPath ,  `${height}p.mp4`))
        .on("end",  async () =>{
          await activeVideo(videoPath)
        })
        .run()
      }
      
      const folder = videoPath                              
      await Video.updateOne({folderPath:folder}, {
        $set: {'ratios':ratio}
      })


      resolve({result:true , mssg:"sucessfully uploaded! need time to get fully converted!"})

    })
    
  }
  
  const activeVideo = async (folderPath) =>{
      const rs = await Video.updateOne({folderPath}, {
        $set:{active:true}
      })
  }
  
  const getVideoResu = ({userID , folderPath , videoname}) =>{
    return new Promise((resolve , reject) =>{
            ffmpeg.ffprobe(path.join(folderPath , videoname), function(err, metadata) {
                if (err) {
                    reject(err)
                } else {
                    // metadata should contain 'width', 'height' and 'display_aspect_ratio'
                    resolve(metadata)
                }
            })
    })
  
  }


module.exports = {createVideos, getVideoResu}