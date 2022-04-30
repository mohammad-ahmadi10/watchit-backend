const router = require('express').Router();
const Video = require("../models/video");
const  User = require("../models/user");
const verify = require("../utils/middleware/verifyToken");
const path = require("path");
const { baseURL } = require('../utils/consts');
const fs = require("fs");
const Like = require("../models/like")
const View = require("../models/view")

router 

.get("/", async(req,res) =>{
    const videos = await Video.aggregate([
        {$match:{active:true}},
        {$sample:{size:10}}
    ])
    const rs = videos.map(async(video) =>{
        const view = await Video.findOne({videoID:video.folderPath})
        const user = await User.findOne({"_id":video.userID})
        return new Promise((resolve,reject) =>{
            resolve({id:video.folderPath,title:video.title,description:video.description,duration:video.duration,date:video.timestamp,resolutions:video.ratios,
                     view:view.amoutn , username:user.username,userID:video.userID.toString()})

        })
    })
    const modifiedVideos = await Promise.all(rs);
    res.json(modifiedVideos)
})

.get("/myVideos", verify(process.env.ACCESSTOKEN) ,async(req,res) =>{
    const id = req.data._id;


    const user = await User.findOne({"_id":id})
    const videos = await Video.find({videoID:id})
    const rs = videos.map(async(video) =>{
        const view = await Video.findOne({videoID:video.folderPath})
        return new Promise((resolve,reject) =>{
            resolve({id:video.folderPath,title:video.title,description:video.description,duration:video.duration,date:video.timestamp,resolutions:video.ratios,
                     view:view.amount, username:user.username,userID:video.userID.toString()})
        })
    })

    const modifiedVideos = await Promise.all(rs);
    res.json(modifiedVideos)
})

.get("/download/:id&:resu",verify(process.env.ACCESSTOKEN), async(req,res) =>{
    const {id,resu} = req.params;
    const userID = req.data._id;

    const video = await Video.findOne({folderPath:id})
    if(video === null) return res.status(400).json({mssg:"no video is found!"})
    let videoPath;
    if(typeof resu === "undefined"){
        videoPath = `${video.videoname}.mp4`;
    }
    else{
        videoPath = `${resu}.mp4`;
    }
    folderPath =  path.join(baseURL, userID ,  id , videoPath);
    res.download(folderPath)

})

.get("/download/mp3/:id",verify(process.env.ACCESSTOKEN), async(req,res) =>{
    const {id} = req.params;
    const userID = req.data._id;

    const video = await Video.findOne({folderPath:id})
    if(video === null) return res.status(400).json({mssg:"no video is found!"})
    folderPath =  path.join(baseURL, userID ,  id , "audio.mp3");
    res.download(folderPath)
})

.get('/:id&:resu', async (req, res) => {
    const {id,resu} = req.params;



    if(typeof id === "undefined" || resu === "undefined") return res.stat(400).json({mssg:"no video found!"})
    let videoPath;
    const video = await Video.findOne({folderPath:id})
    if(video === null) return res.status(400).json("no video is found");
    if(!video.ratios.includes(resu)) return res.status(400).json({mssg:`only ${video.ratios} is available`})

    videoPath = `${resu}.mp4`
    let filePath = path.join(baseURL, video.userID.toString(), id, videoPath)
    // Listing 3.
    const options = {};

    let start;
    let end;

    const range = req.headers.range;
    if (range) {
        const bytesPrefix = "bytes=";
        if (range.startsWith(bytesPrefix)) {
            const bytesRange = range.substring(bytesPrefix.length);
            const parts = bytesRange.split("-");
            if (parts.length === 2) {
                const rangeStart = parts[0] && parts[0].trim();
                if (rangeStart && rangeStart.length > 0) {
                    options.start = start = parseInt(rangeStart);
                }
                const rangeEnd = parts[1] && parts[1].trim();
                if (rangeEnd && rangeEnd.length > 0) {
                    options.end = end = parseInt(rangeEnd);
                }
            }
        }
    }

    res.setHeader("content-type", "video/mp4");

    fs.stat(filePath, (err, stat) => {
        if (err) {
            console.error(`File stat error for ${filePath}.`);
            console.error(err);
            res.sendStatus(500);
            return;
        }

        let contentLength = stat.size;

        // Listing 4.
        if (req.method === "HEAD") {
            res.statusCode = 200;
            res.setHeader("accept-ranges", "bytes");
            res.setHeader("content-length", contentLength);
            res.end();
        }
        else {       
            // Listing 5.
            let retrievedLength;
            if (start !== undefined && end !== undefined) {
                retrievedLength = (end+1) - start;
            }
            else if (start !== undefined) {
                retrievedLength = contentLength - start;
            }
            else if (end !== undefined) {
                retrievedLength = (end+1);
            }
            else {
                retrievedLength = contentLength;
            }

            // Listing 6.
            res.statusCode = start !== undefined || end !== undefined ? 206 : 200;

            res.setHeader("content-length", retrievedLength);

            if (range !== undefined) {  
                res.setHeader("content-range", `bytes ${start || 0}-${end || (contentLength-1)}/${contentLength}`);
                res.setHeader("accept-ranges", "bytes");
            }

            // Listing 7.
            const fileStream = fs.createReadStream(filePath, options);
            fileStream.on("error", error => {
                console.log(`Error reading file ${filePath}.`);
                console.log(error);
                res.sendStatus(500);
            });


            fileStream.pipe(res);
        }
    });


})

.get("/metadata/:id", async(req,res) =>{
  const {id} = req.params;
  
  const video = await Video.findOne({videoID:id})
    const modifiedVideo = await (new Promise(async(resolve,reject) =>{
        const view = await View.findOne({videoID:video.folderPath})
        const user = await User.findOne({"_id":video.userID})
        const like = await Like.find({videoID:video.folderPath}).count()
        resolve({id:video.folderPath,title:video.title,description:video.description,duration:video.duration,date:video.timestamp,resolutions:video.ratios,
                like:like, view:view.amount , username:user.username,userID:video.userID.toString()})
    }))
    res.json(modifiedVideo)
})

.get("/thumb/:id", async(req,res) =>{
    const {id} = req.params;

    const video = await Video.findOne({folderPath:id})
    if(video === null) return res.status(400).json("no video with given id!")
    const thumbPath = path.join(baseURL, video.userID.toString(), id, "thumbnails");
    const thumb = fs.readdirSync(thumbPath)[0]
    const fsReadStream = fs.createReadStream(path.join(thumbPath, thumb))
    fsReadStream.pipe(res)
})

.get("/thumbs/:id&:index", verify(process.env.ACCESSTOKEN) , async (req,res) =>{
    const {id,index} = req.params;

    const video = await Video.findOne({folderPath:id})
    if(video === null) return res.status(400).json("no video with given id!")
    const thumbPath = path.join(baseURL, video.userID.toString(), id, "thumbnails");
    if(index >3) return res.status(400).json({mssg:"only got 4 thumbs"})

    const thumb = fs.readdirSync(thumbPath)[index]

    const fsReadStream = fs.createReadStream(path.join(thumbPath, thumb))
    fsReadStream.pipe(res)
})


module.exports = router;