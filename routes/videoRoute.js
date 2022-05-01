const router = require('express').Router();
const Video = require("../models/video");
const  User = require("../models/user");
const verify = require("../utils/middleware/verifyToken");
const path = require("path");
const { baseURL } = require('../utils/consts');
const fs = require("fs");
const Like = require("../models/like")
const View = require("../models/view")
const Comment = require("../models/comment")
const Playlist = require("../models/playlist")
const History = require("../models/history")

const createComment = async (commentBody,id,userID) =>{
    const rs = await Comment.create({
        body:commentBody,
        videoID:id,
        userID : userID.toString(),
        date:Date.now() 
    })
    return rs 
}

router 

.put("/view",  async (req,res) =>{
    const {id} = req.body;
    const user = req.headers['user-agent'];
    console.log(user)

    const r = await  View.findOne({videoID:id})
    if(!r) return res.status(400).json({mssg:"no video is found!"})

    let isUserAgent;
    for (u of r.userAgents){
        if(u.user === user){
            isUserAgent = true
            break
        }
    }
    if(isUserAgent){
        const condit = Date.now() -  u.date >= process.env.VIEWHOUR 
            if(condit){
                const rs = await View.findOneAndUpdate({
                    videoID:id,
                    "userAgents.user":user
                }, {
                    $inc:{amount:1},
                    $set:{"userAgents.$.date":Date.now()}
                }, {upsert:true})
                return res.json({mssg:"seccussfully viewed up"})
            }else{
               return res.status(400).json({mssg:"user has already watched the video"})
            }
    }else{
        const rs = await View.updateOne({
            videoID:id
        }, {
            $inc:{amount:1},
            $push:{userAgents:{user, date:Date.now()}}
        })
        if(rs.modifiedCount === 1)
        res.json({mssg:"seccussfully viewed up"})
        else res.status(400).json({mssg:"could not be viewed up"})
    }
    
})

.put("/like", verify(process.env.ACCESSTOKEN), async(req,res) =>{
    const {id} = req.body
    const userID = req.data._id
    const video = await Video.findOne({folderPath:id})
    if(!video) return res.status(400).json({mssg:"no video is found!"})
    const rs = await Like.updateOne({videoID:id, userID}, {
        videoID:id,
            userID:userID.toString()
    }, {upsert:true})
    if(rs.upsertedId){
        return res.json({mssg:`User liked video ${id}`})
    }else{
        return res.json({mssg:`already liked the video ${id}`})
    }
})
.put("/unlike", verify(process.env.ACCESSTOKEN), async(req,res) =>{
    const {id} = req.body
    const userID = req.data._id
    const video = await Video.findOne({folderPath:id})
    if(!video) return res.status(400).json({mssg:"no video is found!"})
    const rs = await Like.deleteOne({videoID:id, userID}, {upsert:true})
    if(rs.deletedCount === 1){
        return res.json({mssg:`User unliked video ${id}`})
    }else{
        return res.json({mssg:`already unliked the video ${id}`})
    }
})

.put("/comment", verify(process.env.ACCESSTOKEN), async(req,res) =>{
    const userID = req.data._id;
    const {commentBody, id} = req.body;
    const video = await Video.findOne({folderPath:id})
    if(!video) return res.status(400).json({mssg:"no video is found!"})
    if(!video.isActiveComment) return res.status(400).json("unable to comment this video!")
    const rs = await createComment(commentBody,id,userID)

    res.json({mssg:"comment was seccussfully created",comment:rs})
})
.put("/uncomment", verify(process.env.ACCESSTOKEN), async(req,res) =>{
    const {commentID} = req.body;
    const rs = await Comment.findOneAndDelete({"_id":commentID})
    if(rs){
       return  res.json({mssg:"comment was successfully deleted",comment:rs})
    }
    return res.status(400).json({mssg:"no comment is found!"})
})
.get("/comments/:id", async(req,res) =>{
    const {id} = req.params;
    const comments = await Comment.find({videoID:id})
    const modifiedComments = comments.map(comment =>{
        const like= comment.likes.length;
        return {id:comment._id,body:comment.body,date:comment.date,userID:comment.userID, videoID:comment.videoID,answers:comment.answers,like}
    })
    return res.json(modifiedComments)   
})
.get("/comment/answers/:id", async (req,res)=>{
    const {id} = req.params;

    const comment = await Comment.findById(id)
    const r = await comment.answers.map(async(id)=>{
        const comment = await Comment.findById(id)
        return new Promise((resolve,reject)=>{
            const like= comment.likes.length;
            resolve({id:comment._id,body:comment.body,date:comment.date,userID:comment.userID, videoID:comment.videoID,answers:comment.answers,like})
        })
    })
    const comments = await Promise.all(r)
    res.json(comments)
})

.put("/comment/answer",verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {commentID, commentBody} = req.body;
    const userID = req.data._id 
    const comment = await Comment.findById(commentID);
    if(!comment) return res.status(400).json("no comment is found")
    const rs = await createComment(commentBody,comment.videoID,userID)
    const answerID = rs._id
    const r = await Comment.updateOne({"_id":commentID}, {
        $push:{answers:[answerID]}
    })
    console.log(r)
    res.json(rs)
})
.put("/comment/rmAnswer",verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {commentID, answerID} = req.body;
    const comment = await Comment.findById(commentID);
    if(!comment) return res.status(400).json("no comment is found")
    const r = await Comment.updateOne({"_id":commentID}, {
        $pull:{answers:answerID}
    })
    if(r.modifiedCount === 1){
        return res.json({mssg:`comment was successfully deleted!`})
    }
    return res.status(400).json({mssg:`no comment is found!`})
})
.put("/comment/like", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const userID = req.data._id;
    const {id} = req.body
    const rs = await Comment.updateOne({"_id":id}, {
        $addToSet:{likes:[userID]}
    })
    if(rs.modifiedCount === 1) 
    return res.json({mssg:"comment successfully is liked!"})

    return res.status(400).json({mssg:"already liked!"})
})
.put("/comment/unlike", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const userID = req.data._id;
    const {id} = req.body
    const rs = await Comment.updateOne({"_id":id}, {
        $pull:{likes:userID}
    })
    if(rs.modifiedCount === 1) 
    return res.json({mssg:"comment successfully is unliked!"})

    return res.status(400).json({mssg:"already unliked!"})
})

.put("/comment/edit",  verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {id ,commentBody} = req.body;

    try {
        const rs = await Comment.findOneAndUpdate({"_id":id}, {
            $set:{body:commentBody}
        })
        res.json({mssg:"successfully edited the comment!"})
    } catch (error) {
        res.status(400).json({mssg:"no comment is found!"})
    }
    
})

.post("/searchpoint", async(req,res) =>{
    const {search} = req.body;
    const rs = await Video.aggregate([{
        $match:{
            title:{$regex:search},
            active:true
        }
    },{ $project:{
        title:1, folderPath:1
    }}])
    return res.json(rs)
})

.post("/newPlaylist", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {playlistName} = req.body;
    const userID = req.data._id 
    const rs = await Playlist.updateOne({userID, name:playlistName}, {userID:userID.toString(), name:playlistName} ,{upsert:true});
    rs.upsertedId ? res.json(`playlist ${playlistName.toUpperCase()} is created`):
                    res.status(400).json("playlist is already available")

})
.post("/rmPlaylist", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {playlistName} = req.body;
    const userID = req.data._id 
    const rs = await Playlist.findOneAndDelete({userID, name:playlistName});
    rs ? res.json(`playlist ${playlistName.toUpperCase()} is deleted`):
                    res.status(400).json("no playlist is found")
})

.post("/addtoplaylist", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {playlistName, id} = req.body;
    const userID = req.data._id;

    const video = await Video.findOne({folderPath:id})
    if(!video) return res.status(400).json({mssg:"no video is found!"})

    try {
        const rs = await Playlist.updateOne({playlistName,userID}, {
            $addToSet:{videoIDs:[id]}
        })
        rs.modifiedCount === 1 ? 
        res.json({mssg:"video is added"}) :
        res.status(400).json({mssg:"video is already added"})

    } catch (error) {
        res.json(error)        
    }
    
})
.post("/rmfromplaylist", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const {playlistName, id} = req.body;
    const userID = req.data._id;

    const video = await Video.findOne({folderPath:id})
    if(!video) return res.status(400).json({mssg:"no video is found!"})

    try {
        const rs = await Playlist.updateOne({playlistName,userID}, {
            $pull:{videoIDs:id}
        })
        rs.modifiedCount === 1 ? 
        res.json({mssg:"video is removed"}) :
        res.status(400).json({mssg:`no video with id ${id} in playlist ${playlistName.toUpperCase()}`})
    } catch (error) {
        res.json(error)        
    }
})

.get("/getplaylist/:playlistName",verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const userID = req.data._id;
    const {playlistName} = req.params;

    if(!playlistName) return res.status(400).json({mssg:"no playlist is given!"})

    const rs = await Playlist.findOne({userID, name:playlistName})
    const videos = rs.videoIDs.map(async (h) =>{

        const video = await Video.findOne({folderPath:h})
        const user = await User.findById(video.userID)
        return new Promise((resolve,reject) => {
            const modifiedVideo = {
                id:video.id,title:video.title,description:video.description,
                duration:video.duration,userID:video.userID, username:user.username,isActiveComment:video.isActiveComment,
                resolution:video.ratios, seen:h.date
            }
            resolve(modifiedVideo)
        })
    })
    const modifiedHistories = await Promise.all(videos)

    return res.json(modifiedHistories)
    
})

.get("/myhistory", verify(process.env.ACCESSTOKEN), async(req,res)=>{
    const userID = req.data._id;

    const rs = await History.find({userID})
    const histories =  rs.map( async (h) =>{
        const video = await Video.findOne({folderPath:h.videoID})
        const user = await User.findById(video.userID)
        return new Promise((resolve,reject) => {
            const modifiedVideo = {
                id:video.id,title:video.title,description:video.description,
                duration:video.duration,userID:video.userID,username:user.username,isActiveComment:video.isActiveComment,
                resolution:video.ratios, seen:h.date
            }
            resolve(modifiedVideo)
        })
    })
    const modifiedHistories = await Promise.all(histories)
    return res.json(modifiedHistories)
})

module.exports = router;