const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const commentSChema = new Schema({
    body:{type:String, required:true, default:""},
    date:{type:Date,required:true},
    VideoID:{type:String,default:"", required:true},
    UserID:{type:mongoose.Types.ObjectId, required:true},
    likes:{type:[String], default:[]},
    answers:{type:[String],default:[]}
})

const comment = mongoose.model("comment", commentSChema);
module.exports = comment;
