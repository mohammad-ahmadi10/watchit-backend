const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
    userID:{type:mongoose.Types.ObjectId, required:true},
    videoID:{type:String,default:"", required:true},
    date:{type:Date, required:true}
})

const comment = mongoose.model("history", HistorySchema);
module.exports = comment;
