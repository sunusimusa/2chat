const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({

storage,

limits: {

fileSize: 30 * 1024 * 1024

},

fileFilter: (req,file,cb)=>{


if(
file.mimetype.startsWith("video/") ||
file.mimetype.startsWith("image/") ||
file.mimetype.startsWith("audio/")
){

cb(null,true);

}else{

cb(new Error("Unsupported file type"));

}


}

});


module.exports = upload;
