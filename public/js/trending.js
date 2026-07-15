const container =
document.getElementById("trendingContainer");

async function loadTrending(){

    const res =
    await fetch("/api/shorts/trending");

    const data =
    await res.json();

    if(!data.success){

        alert(data.message);

        return;

    }

    container.innerHTML="";

    data.videos.forEach((video,index)=>{

        container.innerHTML += `

<div class="trending-card"
onclick="location.href='/shorts.html?video=${video._id}'">

<video
src="${video.video}"
muted>
</video>

<div class="info">

<div class="rank">

#${index+1}

</div>

<div class="username">

@${video.username}

</div>

<p>

${video.caption || ""}

</p>

<div class="stats">

❤️ ${video.likes.length}<br>

💬 ${video.comments.length}<br>

👁 ${video.views}<br>

🔥 ${Math.floor(video.watchTime||0)} sec

</div>

</div>

</div>

`;

    });

}

loadTrending();
