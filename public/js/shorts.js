const user = JSON.parse(localStorage.getItem("user"));

const container = document.getElementById("shortsContainer");

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

<p>${video.caption || ""}</p>

</div>

<div class="actions">

<button onclick="likeVideo('${video._id}')">
❤️
</button>

<span id="likes-${video._id}">
${video.likes.length}
</span>

<button onclick="commentVideo('${video._id}')">
💬
</button>

<span>
${video.comments.length}
</span>

<button onclick="shareVideo('${video._id}')">
📤
</button>

<button>
👁️
</button>

<span id="views-${video._id}">
${video.views}
</span>

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

        await fetch("/api/shorts/like", {

            method: "PUT",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                videoId: id,

                username: user.username

            })

        });

        loadVideos();

    } catch (err) {

        console.log(err);

    }

}

// ================= COMMENT =================

function commentVideo(id) {

    alert("💬 Comment System Coming Next");

}

// ================= SHARE =================

function shareVideo(id) {

    const url = window.location.origin + "/shorts.html?id=" + id;

    navigator.clipboard.writeText(url);

    alert("📤 Link Copied");

}

// ================= LOAD =================

loadVideos();
