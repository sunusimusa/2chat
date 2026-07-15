const user = JSON.parse(localStorage.getItem("user"));

const container = document.getElementById("shortsContainer");

let currentVideoId = null;
let currentTab = "foryou";
let watchStart = {};


// ================= LOAD VIDEOS =================

async function loadVideos() {

    try {

        const res = await fetch(
    "/api/shorts/foryou/" + user.username
);
        
        const data = await res.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        container.innerHTML = "";

        const following = user.following || [];

        window.videos = data.videos;

        const savedRes = await fetch(
    "/api/shorts/saved/" + user.username
);

const savedData = await savedRes.json();

const savedVideos = savedData.success && Array.isArray(savedData.videos)
    ? savedData.videos.map(v => String(v._id))
    : [];

        let videos = [...data.videos];

if(currentTab === "following"){

    videos = videos.filter(video =>
        user.following.includes(video.username)
    );

}else{

    // For You: sabbin videos da masu likes da views su fara fitowa

    videos.sort((a,b)=>{

        const scoreA =
    a.likes.length * 5 +
    a.views +
    (a.watchTime || 0);

const scoreB =
    b.likes.length * 5 +
    b.views +
    (b.watchTime || 0);
        
        return scoreB - scoreA;

    });

}

videos.forEach(video => {
    
            container.innerHTML += `

<div class="short">

<video
id="video-${video._id}"
src="${video.video}"
playsinline
loop
ondblclick="doubleLike('${video._id}')"
onclick="togglePlay('${video._id}')">
</video>

<div id="heart-${video._id}" class="heart-animation">
❤️
</div>

<div class="overlay">

    <div class="user-info">

        <div>
            <h3>@${video.username}</h3>
        </div>

        <div class="user-buttons">

            <button class="uploadBtn"
            onclick="location.href='/upload-short.html'">
                ➕
            </button>

            <button
            id="followBtn-${video.username}"
            class="follow-btn ${
                following.includes(video.username) ? "following" : ""
            }"
            onclick="followUser('${video.username}')">

            ${
                following.includes(video.username)
                ? "✓ Following"
                : "+ Follow"
            }

            </button>

        </div>

    </div>

    <p>${video.caption || ""}</p>

</div>

<div class="actions">

<button
id="likeBtn-${video._id}"
onclick="likeVideo('${video._id}')">
❤️
</button>
<span id="likes-${video._id}">${video.likes.length}</span>

<button onclick="commentVideo('${video._id}')">💬</button>
<span>${video.comments.length}</span>

<button onclick="shareVideo('${video._id}')">📤</button>
<span>Share</span>

<button
id="saveBtn-${video._id}"
class="${savedVideos.includes(video._id) ? "liked" : ""}"
onclick="saveVideo('${video._id}')">

${savedVideos.includes(String(video._id)) ? "✅" : "🔖"}

</button>
<span>Save</span>

<button disabled>👁️</button>
<span id="views-${video._id}">${video.views}</span>

</div>

</div>

`;

        });

        const params = new URLSearchParams(window.location.search);

const videoId = params.get("video");

if(videoId){

    const target =
    document.getElementById("video-" + videoId);

    if(target){

        target.parentElement.scrollIntoView({

            behavior:"smooth"

        });

    }

}

        autoPlayVideos();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// ================= AUTO PLAY =================

function autoPlayVideos() {

    const videos = document.querySelectorAll("video");

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

    entry.target.play();

    const id = entry.target.id.replace("video-", "");

   watchStart[id] = Date.now();
                
    addView(id);

} else {

    entry.target.pause();

    const id = entry.target.id.replace("video-", "");

    const seconds = Math.floor(
    (Date.now() - (watchStart[id] || Date.now())) / 1000
);

    if(seconds > 0){

        addWatchTime(id, seconds);

    }

}

        });

    }, {

        threshold: 0.8

    });

    videos.forEach(video => observer.observe(video));

}

// ================= PLAY / PAUSE =================

function togglePlay(id) {

    const video = document.getElementById("video-" + id);

    if (video.paused) {

        video.play();

    } else {

        video.pause();

    }

}

// ================= LIKE =================

async function likeVideo(id) {

    try {

        const btn = document.getElementById("likeBtn-" + id);

        const res = await fetch("/api/shorts/like", {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                videoId: id,

                username: user.username

            })

        });

        const data = await res.json();

        if (data.success) {

            btn.classList.toggle("liked");

            document.getElementById("likes-" + id).innerText =
                data.likes;

        }

    } catch (err) {

        console.log(err);

    }

}

// ================= COMMENT =================

function commentVideo(id) {

    currentVideoId = id;

    document
        .getElementById("commentModal")
        .classList
        .add("show");

    loadComments(id);

}

// ================= SHARE =================
async function shareVideo(id) {

    const url =
window.location.origin +
"/shorts.html?video=" +
id;

    try {

        if (navigator.share) {

            await navigator.share({

                title: "2Chat Shorts",

                text: "Watch this amazing Short on 2Chat!",

                url: url

            });

        } else {

            await navigator.clipboard.writeText(url);

            alert("📋 Link copied successfully.");

        }

    } catch (err) {

        console.log(err);

    }

}

async function addView(id) {

    try {

        const res = await fetch("/api/shorts/view/" + id, {

            method: "PUT"

        });

        const data = await res.json();

        if (data.success) {

            document.getElementById("views-" + id).innerText =
                data.views;

        }

    } catch (err) {

        console.log(err);

    }

}

function closeComments() {

    document
        .getElementById("commentModal")
        .classList
        .remove("show");

}              

function loadComments(id) {

    const video = window.videos.find(v => v._id === id);

    const list =
        document.getElementById("commentList");

    list.innerHTML = "";

    if (!video.comments.length) {

        list.innerHTML =
            "<p style='text-align:center;'>No comments yet.</p>";

        return;

    }

    video.comments.forEach(comment => {

        list.innerHTML += `

<div class="comment-item">

<b>@${comment.username}</b>

<p>${comment.text}</p>

</div>

`;

    });

}

async function sendComment() {

    const input = document.getElementById("commentText");

    const text = input.value.trim();

    if (text === "") return;

    try {

        const res = await fetch("/api/shorts/comment", {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                videoId: currentVideoId,

                username: user.username,

                text

            })

        });

        const data = await res.json();

        if (data.success) {

            input.value = "";

            const list = document.getElementById("commentList");

            list.innerHTML = "";

            data.comments.forEach(comment => {

                list.innerHTML += `

<div class="comment-item">

<b>@${comment.username}</b>

<p>${comment.text}</p>

</div>

`;

            });

            // Sabunta yawan comments a memory
            const video = window.videos.find(v => v._id === currentVideoId);

            if (video) {

                video.comments = data.comments;

            }

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

        alert("Failed to send comment.");

    }

}

async function doubleLike(id){

    const heart =
        document.getElementById("heart-" + id);

    heart.classList.add("show");

    setTimeout(()=>{

        heart.classList.remove("show");

    },500);

    await likeVideo(id);

}

async function followUser(targetUsername){

    if(targetUsername === user.username){
        return;
    }

    try{

        const res = await fetch("/api/users/follow",{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                myUsername:user.username,

                targetUsername

            })

        });

        const data = await res.json();

        if(data.success){

            const btn = document.getElementById(
                "followBtn-" + targetUsername
            );

            if(btn.innerText === "+ Follow"){

                btn.innerText = "✓ Following";

                btn.classList.add("following");

                user.following.push(targetUsername);

            }else{

                btn.innerText = "+ Follow";

                btn.classList.remove("following");

                user.following = user.following.filter(
                    u => u !== targetUsername
                );

            }

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

        }

    }catch(err){

        console.log(err);

    }

}


// ================= SAVE VIDEO =================

async function saveVideo(id){

    try{

        const btn =
        document.getElementById("saveBtn-" + id);

        const res = await fetch("/api/shorts/save",{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                username:user.username,

                videoId:id

            })

        });

        const data = await res.json();

        if(data.success){

            if(data.saved){

                btn.innerText="✅";

                btn.classList.add("liked");

            }else{

                btn.innerText="🔖";

                btn.classList.remove("liked");

            }

        }

    }catch(err){

        console.log(err);

    }

}

function showForYou(){

    currentTab = "foryou";

    document.getElementById("forYouTab")
        .classList.add("active");

    document.getElementById("followingTab")
        .classList.remove("active");

    loadVideos();

}

function showFollowing(){

    currentTab = "following";

    document.getElementById("followingTab")
        .classList.add("active");

    document.getElementById("forYouTab")
        .classList.remove("active");

    loadVideos();

}

async function addWatchTime(id, seconds){

    try{

        await fetch("/api/shorts/watch/" + id,{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                seconds
            })

        });

    }catch(err){

        console.log(err);

    }

}

// ================= LOAD =================

loadVideos();
