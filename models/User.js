const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    friends:{
type:[String],
default:[]
},

    password: {
      type: String,
      required: true
    },

    avatar: {
      type: String,
      default: ""
    },

    online:{
type:Boolean,
default:false
},

lastSeen:{
type:Date,
default:Date.now
},

   followers:{
  type:[String],
  default:[]
},

following:{
  type:[String],
  default:[]
}, 

    bio: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
