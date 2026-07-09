const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({

username:{
type:String,
required:true
},

type:{
type:String,
enum:["image","video","text"],
default:"image"
},

media:{
type:String,
default:""
},

text:{
type:String,
default:""
},

views:{
type:[String],
default:[]
}

},{
timestamps:true
});

module.exports =
mongoose.model("Status",statusSchema);
