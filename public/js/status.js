const user =
JSON.parse(localStorage.getItem("user"));

const fileInput =
document.getElementById("statusFile");

fileInput.addEventListener("change", uploadStatus);

function pickStatus(){

fileInput.click();

}

async function uploadStatus(){

const file = fileInput.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = async function(e){

const media = e.target.result;

const type =
file.type.startsWith("video")
? "video"
: "image";

const res = await fetch("/api/status/create",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

username:user.username,

type,

media,

text:""

})

});

const data = await res.json();

if(data.success){

alert("✅ Status uploaded successfully.");

loadStatuses();

}else{

alert(data.message);

}

};

reader.readAsDataURL(file);

}

async function loadStatuses(){

const res =
await fetch("/api/status/all");

const data =
await res.json();

const list =
document.getElementById("statusList");

list.innerHTML = "";

data.statuses.forEach(status=>{

if(status.username===user.username) return;

list.innerHTML += `

<div class="status-card">

<img src="/images/default.png">

<div>

<h4>${status.username}</h4>

<small>${status.type}</small>

</div>

</div>

`;

});

}

loadStatuses();
