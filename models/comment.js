const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const commentSChema = new Schema({
    body:{type:String, required:true, default:""},
    date:{type:Date,required:true},
    videoID:{type:String,default:"", required:true},
    userID:{type:String, required:true},
    likes:{type:[String], default:[], required:false },
    answers:{type:[String],default:[], required:false}
})

const comment = mongoose.model("comment", commentSChema);
module.exports = comment;
