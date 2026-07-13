const user = JSON.parse(localStorage.getItem("user"));

const container =
document.getElementById("savedContainer");

async function loadSaved(){

const res = await fetch(
"/api/shorts/saved/" + user.username
);

const data = await res.json();

if(!data.success){

return;

}

container.innerHTML="";

data.videos.forEach(video=>{

container.innerHTML += `

<div class="video-card">

<video

src="${video.video}"

controls

poster="${video.avatar}">

</video>

<p>${video.caption}</p>

</div>

`;

});

}

loadSaved();
