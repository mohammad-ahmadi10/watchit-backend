const express = require("express");
const { baseURL } = require("../utils/consts");
const router = express.Router();

const {createMulterThumb, createMulterVideo , createMulterAvatar} = require("../utils/multer_config");
const uploadvideo = require("../utils/uploadvideo");
const Video = require("../models/video");
const Like = require("../models/like");
const View = require("../models/view");
const Comment = require("../models/comment");

const verify = require("../utils/middleware/verifyToken");
const path = require("path");
const fs = require("fs");
const emptyThumbDir = require("../utils/middleware/deleteThumb");
const User = require("../models/user");
const {createVideos,getVideoResu} = require("../utils/convert")


const getUpload = async () =>{
    const videoUploader = await createMulterVideo();
    const avatarUploader = await createMulterAvatar();
    const thumbUploader = await createMulterThumb();
    const deleteVideo = async (videoID,userID ,  folder)=>{
    const folderpath =  path.join(baseURL , userID.toString() ,  folder);
        
        try {
          fs.rm(folderpath, {recursive:true , force:true}, (err) =>{
            if(err) {console.log(err)}
          })
          await Video.deleteOne({"_id":videoID})
          await Like.deleteMany({videoID})
          await View.deleteOne({videoID:folder})
          await Comment.deleteMany({videoID})
          return true
        } catch (error) {
          return false
        }
    }

    router.post("/video" , verify(process.env.ACCESSTOKEN) ,  videoUploader.single("file")  ,  async(req , res , err ) =>{
        const userID = req.data._id;
        const data = {userID , videoData:req.body }
        const videoPath = await uploadvideo(data)
        return videoPath.length > 0 ? res.status(200).json({videoPath}) : res.status(500).json({err:"Server couldn't store the file"})
    })
    
    router.post("/avatar" , verify(process.env.ACCESSTOKEN) ,  avatarUploader.single("file")  ,  async(req , res ) =>{
      const file = req.file;
      const id = req.data._id
      
      if(file) {
        const rs = await User.updateOne({id},{$set:{avatar:file.filename}})
        return res.json({mssg:"secussfully set a new avatar"})

      }
      return res.status(400).json({mssg:"server wasn't able to set the avatar"})

    })


    // video remove with his all infos
    .post("/rmvideo", verify(process.env.ACCESSTOKEN) , async  (req, res) =>{
      const {id} = req.body;
      if(id.length <= 0) return res.status(404).json({err:"invalid video"});
      const video = await Video.findOne({folderPath:id})
      if(video === null || video.length === 0) return res.status(404).json({err:"video not found"});
      const vidoeID = video._id;
      const userID = video.userID
      const result = await deleteVideo(vidoeID, userID ,  id);
      return result ?  res.status(200).json({mssg:"video was sucessfully deleted."}) : res.status(500).json({err:"video not found"})
    })

    /**
     * as form data
     * videoPath 
       titel
       description
       searchPointsunt
       file
     */
    .post("/thumb/index", verify(process.env.ACCESSTOKEN) ,  (req, res, next) =>{
      const {index, videoPath} = req.body;
      const userID = req.data._id;
      const thumb = `thumbnail_${index}.jpg`;
      const thumbfolder =  path.join(baseURL , userID.toString() , videoPath , "thumbnails");
      const folderPath = path.join(baseURL , userID.toString() , videoPath)
      req.body = {...req.body, thumb , thumbfolder,folderPath}
      next();
    } , emptyThumbDir() , async (req, res, next) =>{
      const {videoPath , title, description , folderPath, thumb} = req.body;
      const userID = req.data._id;
      const rs = await Video.findOne({folderPath:videoPath})
        if(rs === null) return res.status(400).json({mssg:"no video is found!"});
        if(userID !== rs.userID.toString()) return res.status(400).json({mssg:"you are not allowed to edit this video"})
          
        const r = await Video.updateOne({folderPath:videoPath}, {
            $set:{
            "title":title, 
            "description":description
        }
      })

        const data = {userID , folderPath , videoname: rs.videoname, videoPath }
        const metadata = await  getVideoResu(data)
        const {coded_width , coded_height} = metadata.streams[0]
        const {result , mssg} = await createVideos(coded_width , coded_height ,
                                          data);
        res.status(200).json({thumb})
    })





    .post("/thumb" ,  verify(process.env.ACCESSTOKEN) , thumbUploader.fields([     {name:'videoPath', maxCount:1}, 
                                                                                   {name:'titel', maxCount:1}, 
                                                                                   {name:'description', maxCount:1},
                                                                                   {name:'file' , maxCount:1}]), 
        emptyThumbDir() , async  (req, res) =>{
        const userID = req.data._id;
        const {thumb , videoPath , title , description , folderPath} = req.body;
        if(!thumb) return res.status(500).json({err:"not able to store the thumb"})
        const rs = await Video.findOne({folderPath:videoPath})
        if(rs === null) return res.status(400).json({mssg:"no video is found!"});
        if(userID !== rs.userID.toString()) return res.status(400).json({mssg:"you are not allowed to edit this video"})
          
        const r = await Video.updateOne({folderPath:videoPath}, {
            $set:{
            "title":title, 
            "description":description
        }
      })

        const data = {userID , folderPath , videoname: rs.videoname, videoPath }
        const metadata = await  getVideoResu(data)
        const {coded_width , coded_height} = metadata.streams[0]
        const {result , mssg} = await createVideos(coded_width , coded_height ,
                                          data);
        res.status(200).json({thumb})
    })
}

getUpload();

module.exports = router;
