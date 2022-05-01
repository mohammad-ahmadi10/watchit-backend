const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
    name:{type:String, default:"", required:true},
    videoIDs:{type:[String],default:[], required:false},
    userID:{type:mongoose.Types.ObjectId, required:true},
})

const playlist = mongoose.model("playlist", playlistSchema);
module.exports = playlist;
