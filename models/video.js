const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const videoSchema = new Schema({
    videoname:{type:String, required:true},
    title:{type:String,default:"", required:false},
    description:{type:String, default:"", required:false},
    folderPath:{type:String, required:true, default:""},
    duration:{type:Number, required:true},
    date:{type:Number, required:true},
    ratios:{type:[String], default:[]},
    active:{type:Boolean, default:false, required:false},
    userID:{type:mongoose.Types.ObjectId, required:true},
    isActiveComment:{type:Boolean, default:true, required:false},
})

const video = mongoose.model("video", videoSchema);
module.exports = video;
