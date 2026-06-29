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

  seen:{
    type:Boolean,
    default:false
  },

  seenAt:{
    type:Date
  }

},
{
  timestamps:true
}
);

module.exports =
mongoose.model(
"Message",
messageSchema
);
