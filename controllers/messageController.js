const Message =
require("../models/Message");

// SEND MESSAGE

exports.sendMessage =
async(req,res)=>{

try{

const {
sender,
receiver,
text
} = req.body;

const message =
await Message.create({
sender,
receiver,
text
});

res.json({
success:true,
message
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// GET CHAT

exports.getMessages =
async(req,res)=>{

try{

const {
sender,
receiver
} = req.query;

const messages =
await Message.find({
$or:[
{
sender,
receiver
},
{
sender:receiver,
receiver:sender
}
]
})
.sort({
createdAt:1
});

res.json({
success:true,
messages
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
