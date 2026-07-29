const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },

    avatar:{
        type:String,
        default:""
    },

    cover:{
        type:String,
        default:""
    },

    description:{
        type:String,
        default:""
    },

    owner:{
        type:String,
        required:true
    },

    admins:{
        type:[String],
        default:[]
    },

    members:{
        type:[String],
        default:[]
    },

    memberCount:{
        type:Number,
        default:1
    },

    privacy:{
        type:String,
        enum:["public","private"],
        default:"public"
    },

    lastMessage:{
        type:String,
        default:""
    },

    lastMessageSender:{
        type:String,
        default:""
    },

    lastMessageTime:{
        type:Date,
        default:null
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model("Group", groupSchema);
