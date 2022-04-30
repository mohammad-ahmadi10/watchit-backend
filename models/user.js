const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username:{type:String, default:"", required:true},
    email:{type:String, required:true, default:""},
    password:{type:String, required:true,default:""},
    refreshToken:{type:[String], required:false, default:[]},
    avatar:{type:String, required:false, default:""},
    active:{type:Boolean, required:false, default:false},
})

const user = mongoose.model("user", userSchema);
module.exports = user;
