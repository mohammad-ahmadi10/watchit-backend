const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const videoSchema = new Schema({
    videoname:{type:String, required:true},
    title:{type:String,default:"", required:false},
    description:{type:String, default:"", required:false},
    folderPath:{type:String, required:true, default:""},
    duration:{type:Number, required:true},
    timestamp:{type:Number, required:true},
    ratios:{type:[String], default:[]},
    active:{type:Boolean, default:false, required:false},
    userID:{type:mongoose.Types.ObjectId, required:true},

})

const video = mongoose.model("video", videoSchema);
module.exports = video;
