const Status = require("../models/Status");

// Upload Status
exports.createStatus = async (req, res) => {
try{

const { username, type, media, text } = req.body;

const status = await Status.create({
username,
type,
media,
text
});

res.json({
success:true,
status
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}
};

// Get All Active Status
exports.getStatuses = async (req, res) => {

try{

const statuses = await Status.find()
.sort({createdAt:-1});

res.json({
success:true,
statuses
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};


// Get One Status
exports.getStatusById = async (req, res) => {

try{

const status = await Status.findById(req.params.id);

if(!status){

return res.json({
success:false,
message:"Status not found"
});

}

res.json({
success:true,
status
});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};
