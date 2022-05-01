const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const LikeSchema = new Schema({
    videoID:{type:String,default:"", required:true},
    userID:{type:mongoose.Types.ObjectId, required:true},
})

const comment = mongoose.model("like", LikeSchema);
module.exports = comment;
