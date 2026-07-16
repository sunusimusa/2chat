async function searchShorts(){


const keyword =
document.getElementById(
"searchInput"
).value
.trim()
.replace("#","");


if(!keyword){
return;
}


const res =
await fetch(
"/api/shorts/search/" + keyword
);


const data =
await res.json();



let html="";


if(data.success && data.videos.length){


data.videos.forEach(video=>{


html += `

<div class="video-card">


<video
src="${video.video}"
controls
></video>


<h3>
@${video.username}
</h3>


<p>
${video.caption}
</p>


<div>

❤️ ${video.likes.length}

&nbsp;

👁 ${video.views}

</div>


<p class="tags">

${video.hashtags.map(tag=>`
<span>
#${tag}
</span>
`).join("")}

</p>


</div>

`;

});


}else{


html =

`
<h3>
No videos found 😢
</h3>
`;

}



document.getElementById(
"results"
).innerHTML = html;


}
