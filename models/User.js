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

    role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
},

    isCreator: {
    type: Boolean,
    default: false
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
  default: "/images/default.png"
},

    cover: {
  type: String,
  default: "/images/default-cover.jpg"
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

    favoriteCategories: {
    type: [String],
    default: []
},

    creatorBadge: {
    type: String,
    default: "🥉 Bronze Creator"
},

    savedVideos: [
{
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShortVideo"
}
],

    blockedUsers: {
    type: [String],
    default: []
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
