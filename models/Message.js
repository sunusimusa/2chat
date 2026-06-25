const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
  sender:{
    type:String
  },

  receiver:{
    type:String
  },

  text:{
    type:String
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
