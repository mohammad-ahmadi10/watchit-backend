const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const viewSchema = new Schema({
    videoID:{type:String,default:"", required:true},
    userAgents:{type:[{user:{type:String,required:true},date:Date}],default:[],required:false},
    amount:{type:Number,required:false,default:0} 
})

const view = mongoose.model("view", viewSchema);
module.exports = view;
