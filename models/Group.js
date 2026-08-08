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
    default:"/images/default-group-cover.jpg"
},

    description:{
        type:String,
        default:""
    },

    owner:{
        type:String,
        required:true
    },

    inviteCode:{
    type:String,
    unique:true,
    index:true,
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

    },{
    timestamps:true
});

module.exports = mongoose.model("Group", groupSchema);
