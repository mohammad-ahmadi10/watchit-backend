const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
    name:{type:String, default:"", required:true},
    VideoIDs:{type:[String],default:[], required:true},
    UserID:{type:mongoose.Types.ObjectId, required:true},
})

const playlist = mongoose.model("playlist", playlistSchema);
module.exports = playlist;
