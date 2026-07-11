const user = JSON.parse(localStorage.getItem("user"));

const container = document.getElementById("shortsContainer");

let currentVideoId = null;

// ================= LOAD VIDEOS =================

async function loadVideos() {

    try {

        const res = await fetch("/api/shorts/all");

        const data = await res.json();

        if (!data.success) {

            alert(data.message);

            return;

        }

        container.innerHTML = "";

        window.videos = data.videos;

        data.videos.forEach(video => {

            container.innerHTML += `

<div class="short">

<video
id="video-${video._id}"
src="${video.video}"
playsinline
loop
onclick="togglePlay('${video._id}')">
</video>

<div class="overlay">

<h3>@${video.username}</h3>

<p>${video.caption ? video.caption : "No description."}</p>

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

<button disabled>👁️</button>
<span id="views-${video._id}">${video.views}</span>

</div>

</div>

`;

        });

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

    addView(id);

} else {

    entry.target.pause();

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

function shareVideo(id) {

    const url = window.location.origin + "/shorts.html?id=" + id;

    navigator.clipboard.writeText(url);

    alert("📤 Link Copied");

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

// ================= LOAD =================

loadVideos();


