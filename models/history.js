const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
    UserID:{type:mongoose.Types.ObjectId, required:true},
    VideoID:{type:String,default:"", required:true},
})

const comment = mongoose.model("history", HistorySchema);
module.exports = comment;
