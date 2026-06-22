const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
{
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  username:{
    type:String
  },

  text:{
    type:String
  },

  likes:[
    {
      type:String
    }
  ]

},
{
  timestamps:true
}
);

module.exports =
mongoose.model("Post", postSchema);
