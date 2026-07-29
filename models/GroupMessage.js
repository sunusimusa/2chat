const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema({

    groupId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Group",
        required:true
    },

    sender:{
        type:String,
        required:true
    },

    text:{
        type:String,
        default:""
    },

    image:{
        type:String,
        default:""
    },

    voice:{
        type:String,
        default:""
    },

    voiceDuration:{
        type:Number,
        default:0
    },

    replyTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"GroupMessage",
        default:null
    },

    replyUser:{
        type:String,
        default:""
    },

    replyText:{
        type:String,
        default:""
    },

    replyImage:{
        type:String,
        default:""
    },

    reactions:[

        {

            username:String,

            emoji:String

        }

    ],

    deleted:{
        type:Boolean,
        default:false
    }

},{
    timestamps:true
});

module.exports =
mongoose.model(
    "GroupMessage",
    groupMessageSchema
);
