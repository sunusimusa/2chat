const user = JSON.parse(localStorage.getItem("user"));

const params = new URLSearchParams(location.search);

const id = params.get("id");

let progress = 0;

async function loadStatus(){

const res = await fetch("/api/status/" + id);

const data = await res.json();

if(!data.success){

alert("Status not found");

history.back();

return;

}

const status = data.status;

document.getElementById("avatar").src =
status.avatar || "/images/default.png";

document.getElementById("username").innerText =
status.username;

document.getElementById("time").innerText =
new Date(status.createdAt).toLocaleString();

if(status.type==="image"){

const img = document.getElementById("statusImage");

img.src = status.media;

img.style.display = "block";

}else{

const video = document.getElementById("statusVideo");

video.src = status.media;

video.style.display = "block";

}

startProgress();

}

function startProgress(){

const bar = document.getElementById("progressBar");

const timer = setInterval(()=>{

progress += 2;

bar.style.width = progress + "%";

if(progress >= 100){

clearInterval(timer);

history.back();

}

},100);

}

function replyStatus(){

const text =
document.getElementById("reply").value.trim();

if(text==="") return;

alert("Reply feature will be connected next.");

}

loadStatus();
