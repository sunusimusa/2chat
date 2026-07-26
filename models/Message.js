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
