const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
    sender:{
        type:String,
        required:true
    },

    receiver:{
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
        ref:"Message",
        default:null
    },

    replyText:{
        type:String,
        default:""
    },

    replyUser:{
        type:String,
        default:""
    },

    replyImage:{
        type:String,
        default:""
    },

    replyVoice:{
        type:String,
        default:""
    },

    reactions:{
        type:[
            {
                username:{
                    type:String,
                    default:""
                },
                emoji:{
                    type:String,
                    default:""
                }
            }
        ],
        default:[]
    },

    seen:{
        type:Boolean,
        default:false
    },

    seenAt:{
        type:Date,
        default:null
    },

    delivered:{
        type:Boolean,
        default:false
    },

    deliveredAt:{
        type:Date,
        default:null
    },

    deletedForEveryone:{
        type:Boolean,
        default:false
    },

    // Nau'in message
type: {
    type: String,
    enum: ["text","image","video","voice","file"],
    default: "text"
},

// Edit
edited: {
    type: Boolean,
    default: false
},

editedAt: {
    type: Date,
    default: null
},

// Forward
forwarded: {
    type: Boolean,
    default: false
},

forwardedFrom: {
    type: String,
    default: ""
},

// File
file: {
    type: String,
    default: ""
},

fileName: {
    type: String,
    default: ""
},

fileSize: {
    type: Number,
    default: 0
},

// Delete for me
deletedForMe: {
    type: [String],
    default: []
},

// Starred
starredBy: {
    type: [String],
    default: []
},

// Pin
pinned: {
    type: Boolean,
    default: false
},

// Reply preview
replyType: {
    type: String,
    default: ""
},

    deletedBy:{
        type:String,
        default:""
    }

},
{
    timestamps:true
}
);

// Chat loading ya zama da sauri
messageSchema.index({
    sender:1,
    receiver:1,
    createdAt:1
});

module.exports = mongoose.model(
    "Message",
    messageSchema
);
