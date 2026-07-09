const user =
JSON.parse(localStorage.getItem("user"));

function pickStatus(){

document
.getElementById("statusFile")
.click();

}

document
.getElementById("statusFile")
.addEventListener("change",()=>{

const file =
document
.getElementById("statusFile")
.files[0];

if(!file) return;

alert("✅ Status selected.\nUpload API za mu haɗa a mataki na gaba.");

});
