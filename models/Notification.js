const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

receiver:{
type:String,
required:true
},

sender:{
type:String,
required:true
},

type:{
type:String,
enum:[
"like",
"comment",
"follow",
"message"
],
required:true
},

postId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Post",
default:null
},

text:{
type:String,
default:""
},

read:{
type:Boolean,
default:false
}

},{
timestamps:true
});

module.exports =
mongoose.model(
"Notification",
notificationSchema
);
