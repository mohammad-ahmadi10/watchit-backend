const {getVideoDurationInSeconds} = require("get-video-duration");
const createthumb = require("../utils/createThumbnail");
const createMP3 = require("../utils/createMP3");

const Video = require("../models/video");
const path = require("path");
const View = require("../models/view");


const uploadvideo =  async({userID , videoData}) =>{
    
    const folderPath = videoData.folderPath;
    const folder = videoData.folder;
    const videoname = videoData.vidoeInfos.filename;
    const duration = await getVideoDurationInSeconds( path.join(folderPath , videoname) );

    /* const durations =  {minute:  parseInt(duration / 60 , 10) , second:parseInt(duration % 60 , 10)} */
    await createMP3(folderPath , videoname);
    await createthumb(folderPath , folder , videoname );

    const result = await Video.create({
        "videoname": videoData.vidoeInfos.filename,
        "folderPath": folder,
        "duration": duration,
        "timestamp": videoData.vidoeInfos.timestamp,
        "userID": userID
    });
    await View.create({
        videoID:result.folderPath
    })
    return result ?  folder : ""
}

module.exports = uploadvideo;
