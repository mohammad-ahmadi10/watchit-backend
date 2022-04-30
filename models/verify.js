const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const verifySchema = new Schema({
    verifyNumber:{type:String, default:"", required:true},
    userID:{type:mongoose.Types.ObjectId, required:true}
})

const verify = mongoose.model("verify", verifySchema);
module.exports = verify;
