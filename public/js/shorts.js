const user = JSON.parse(localStorage.getItem("user"));

const container = document.getElementById("shortsContainer");

let currentVideoId = null;
let currentVisibleVideoId = null;
let currentTab = "foryou";
let watchStart = {};

const creatorCache = {};

// ================= SHORTS MENU ACTIONS =================

function setupShortsMenuActions() {

    const menu = document.getElementById("shortsMenu");

    if (!menu || document.getElementById("shortReportMenuBtn")) {
        return;
    }

    const reportBtn = document.createElement("button");

    reportBtn.id = "shortReportMenuBtn";
    reportBtn.type = "button";
    reportBtn.innerHTML = `
        <i class="fa-solid fa-flag"></i>
        <span>Report this Short</span>
    `;

    reportBtn.addEventListener("click", function () {

        const video = window.videos?.find(
            item => item._id === currentVisibleVideoId
        );

        if (!video) return;

        menu.classList.remove("show");

        openReportModal(
            "short",
            video._id,
            video.username
        );

    });

    const viewsBtn = document.createElement("button");

    viewsBtn.id = "shortViewsMenuBtn";
    viewsBtn.type = "button";

    viewsBtn.innerHTML = `
        <i class="fa-solid fa-eye"></i>
        <span id="shortMenuViewsText">Views</span>
    `;

    viewsBtn.addEventListener("click", function () {

        const video = window.videos?.find(
            item => item._id === currentVisibleVideoId
        );

        if (!video) return;

        const viewsText = document.getElementById(
            "shortMenuViewsText"
        );

        if (viewsText) {
            viewsText.innerText =
                "Views: " + video.views;
        }

    });

    menu.appendChild(reportBtn);
    menu.appendChild(viewsBtn);
}

setupShortsMenuActions();

async function getCreator(username){

    if(creatorCache[username]){
        return creatorCache[username];
    }

    try{

        const res = await fetch(
            "/api/users/profile/" +
            encodeURIComponent(username)
        );

        const data = await res.json();

        if(data.success && data.user){

            creatorCache[username] = data.user;

            return data.user;

        }

    }catch(err){

        console.log("Creator profile error:", err);

    }

    return null;
}

function isVideoLikedByUser(video) {

    if (!Array.isArray(video.likes)) {
        return false;
    }

    return video.likes.some(like => {

        if (typeof like === "string") {
            return like === user.username ||
                   like === user._id;
        }

        return like?.username === user.username ||
               like?.user?.username === user.username ||
               like?.user === user._id;

    });
}


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

        const creatorUsernames = [
    ...new Set(
        videos.map(video => video.username)
    )
];

await Promise.all(
    creatorUsernames.map(username =>
        getCreator(username)
    )
);

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

    <div class="creator-info">

        <img
            src="${
                creatorCache[video.username]?.avatar
                || "/images/default.png"
            }"
            class="short-avatar"
            onclick="openShortProfile('${encodeURIComponent(video.username)}')"
            onerror="this.src='/images/default.png'"
        >

        <h3
            class="short-username"
            onclick="openShortProfile('${encodeURIComponent(video.username)}')">

            @${video.username}

            <span class="mini-badge">
                ${video.badge || ""}
            </span>

        </h3>

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

    <!-- LIKE -->
    <button
        id="likeBtn-${video._id}"
        class="like-action ${isVideoLikedByUser(video) ? "liked" : ""}"
        aria-label="Like"
        onclick="likeVideo('${video._id}')">
        <i class="fa-solid fa-thumbs-up"></i>
    </button>
    <span id="likes-${video._id}">${video.likes.length}</span>

    <!-- COMMENT -->
    <button
        id="commentBtn-${video._id}"
        class="comment-action"
        aria-label="Comment"
        onclick="commentVideo('${video._id}')">
        <i class="fa-regular fa-comment"></i>
    </button>
    <span id="comments-${video._id}">${video.comments.length}</span>

    <!-- SHARE -->
    <button
        id="shareBtn-${video._id}"
        class="share-action"
        aria-label="Share"
        onclick="shareVideo('${video._id}')">
        <i class="fa-solid fa-share"></i>
    </button>
    <span id="shares-${video._id}">${video.shares || 0}</span>

    <!-- GIFT -->
    <button
        id="giftBtn-${video._id}"
        class="gift-short-btn"
        aria-label="Gift"
        onclick="openShortGift('${video.username}', '${video._id}')">
        <i class="fa-solid fa-gift"></i>
    </button>
    <span>Gift</span>

    <!-- SAVE -->
    <button
        id="saveBtn-${video._id}"
        class="save-action ${savedVideos.includes(String(video._id)) ? "liked" : ""}"
        aria-label="Save"
        onclick="saveVideo('${video._id}')">
        <i class="fa-solid fa-bookmark"></i>
    </button>
    <span>Save</span>

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

        // =====================================
// GIFT CONFIRMATION FROM GIFTS PAGE
// =====================================

const giftData =
    sessionStorage.getItem(
        "shortGiftConfirmation"
    );

if (giftData) {

    try {

        const gift =
            JSON.parse(giftData);

        showGiftConfirmation(gift);

        // Kada animation ta sake bayyana
        // idan user ya refresh page
        sessionStorage.removeItem(
            "shortGiftConfirmation"
        );

    } catch (err) {

        console.error(
            "Gift confirmation error:",
            err
        );

        sessionStorage.removeItem(
            "shortGiftConfirmation"
        );

    }

}

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// ================= AUTO PLAY =================

function autoPlayVideos() {

    const videos = document.querySelectorAll(
        "#shortsContainer video"
    );

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            const videoElement = entry.target;

            const id = videoElement.id.replace("video-", "");

            if (entry.isIntersecting) {

                // Ajiye ID na Short da ake kallo
                currentVisibleVideoId = id;

                // Kunna video
                videoElement.play().catch(err => {
                    console.log("Video autoplay error:", err);
                });

                // Fara lissafin lokacin kallo
                if (!watchStart[id]) {
                    watchStart[id] = Date.now();
                }

                // Ƙara view
                addView(id);

            } else {

                // Tsayar da video
                videoElement.pause();

                // Lissafa lokacin da aka kalla
                const seconds = Math.floor(
                    (Date.now() - (watchStart[id] || Date.now())) / 1000
                );

                if (seconds > 0) {
                    addWatchTime(id, seconds);
                }

                // Share lokacin kallon da ya gabata
                delete watchStart[id];

            }

        });

    }, {
        threshold: 0.8
    });

    videos.forEach(video => {
        observer.observe(video);
    });

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

            if (typeof data.liked === "boolean") {
                btn.classList.toggle("liked", data.liked);
            } else {
                btn.classList.toggle("liked");
            }

            document.getElementById("likes-" + id).innerText =
                data.likes;

        }

    } catch (err) {
        console.log("Like error:", err);
    }
}

// ================= COMMENT =================

function commentVideo(id) {

    currentVideoId = id;

    document.querySelectorAll(".comment-action.active")
        .forEach(btn => btn.classList.remove("active"));

    const btn = document.getElementById("commentBtn-" + id);

    if (btn) {
        btn.classList.add("active");
    }

    document.getElementById("commentModal")
        .classList.add("show");

    loadComments(id);
}

function closeComments() {

    document.getElementById("commentModal")
        .classList.remove("show");

    document.querySelectorAll(".comment-action.active")
        .forEach(btn => btn.classList.remove("active"));

}

// ================= SHARE =================
async function shareVideo(id) {

    try {

        const res = await fetch("/api/shorts/share/" + id, {
            method: "PUT"
        });

        const data = await res.json();

        if (!data.success) return;

        document.getElementById("shares-" + id).innerText =
            data.shares;

        const url =
            window.location.origin + "/shorts.html?video=" + id;

        if (navigator.share) {

            await navigator.share({
                title: "2Chat Shorts",
                text: "Watch this Short on 2Chat!",
                url
            });

        } else {

            await navigator.clipboard.writeText(url);

            alert("Link copied successfully.");

        }

        const btn = document.getElementById("shareBtn-" + id);

        if (btn) {
            btn.classList.add("active");
        }

    } catch (err) {

        if (err.name !== "AbortError") {
            console.log("Share error:", err);
        }

    }
}

async function addView(id) {

    try {

        const res = await fetch(
            "/api/shorts/view/" + id,
            {
                method: "PUT"
            }
        );

        const data = await res.json();

        if (!data.success) {
            return;
        }

        // Sabunta Views a videos memory
        const video = window.videos?.find(
            item => String(item._id) === String(id)
        );

        if (video) {
            video.views = data.views;
        }

        // Sabunta Views a gefen dama
        const viewsElement = document.getElementById(
            "views-" + id
        );

        if (viewsElement) {
            viewsElement.innerText = data.views;
        }

        // Sabunta Views a cikin menu
        if (currentVisibleVideoId === id) {

            const viewsText = document.getElementById(
                "shortMenuViewsText"
            );

            if (viewsText) {
                viewsText.innerText = "Views: " + data.views;
            }

        }

    } catch (err) {

        console.log("Add view error:", err);

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

            closeComments();

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

async function saveVideo(id) {

    try {

        const btn = document.getElementById("saveBtn-" + id);

        const res = await fetch("/api/shorts/save", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: user.username,
                videoId: id
            })
        });

        const data = await res.json();

        if (data.success) {

            btn.classList.toggle("liked", data.saved);

        }

    } catch (err) {
        console.log("Save error:", err);
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

function openShortProfile(username){

    if(!username){
        return;
    }

    window.location.href =
        "/profile.html?username=" +
        username;
}

function openShortGift(username, videoId) {

    if (!username) {
        alert("Creator information is missing.");
        return;
    }

    const creator =
        creatorCache[username];

    if (!creator || !creator._id) {
        alert("Unable to find creator ID.");
        return;
    }

    window.location.href =
        "/gifts.html?receiverId=" +
        encodeURIComponent(creator._id) +
        "&fromShort=" +
        encodeURIComponent(videoId);
}

function showGiftConfirmation(gift) {

    const videoId = new URLSearchParams(
        window.location.search
    ).get("video");

    // Idan muna kan Short page
    if (videoId) {

        const video = document.getElementById(
            "video-" + videoId
        );

        if (!video) return;

const giftButton = document.getElementById(
    "giftBtn-" + videoId
);

if (giftButton) {
    giftButton.classList.add("active");
}

const short = video.closest(".short");
        
        if (!short) return;

        const animation =
            document.createElement("div");

        animation.className =
            "gift-confirmation";

        animation.innerHTML = `
            <div class="gift-confirmation-icon">
                ${gift.icon}
            </div>

            <strong>
                ${gift.name} Sent!
            </strong>

            <span>
                🎁 Gift sent successfully
            </span>
        `;

        short.appendChild(animation);

        setTimeout(() => {

            animation.classList.add("show");

        }, 50);

        setTimeout(() => {

            animation.classList.remove("show");

            setTimeout(() => {
                animation.remove();
            }, 300);

        }, 2200);

    }
}

function checkReturnedGift() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const giftType =
        params.get("gift");

    if (!giftType) return;


    const gift =
        GIFTS_FOR_SHORTS.find(
            item => item.type === giftType
        );

    if (!gift) return;


    setTimeout(() => {

        showGiftConfirmation(gift);

    }, 800);

}

// ================= REPORT =================

let reportContentType = null;
let reportContentId = null;
let reportReportedUsername = null;

function openReportModal(contentType, contentId, username){

    reportContentType = contentType;
    reportContentId = contentId;
    reportReportedUsername = username || "";

    const modal =
        document.getElementById("reportModal");

    if(!modal){
        console.error("Report modal not found");
        return;
    }

    const reason =
        document.getElementById("reportReason");

    const description =
        document.getElementById("reportDescription");

    if(reason){
        reason.value = "";
    }

    if(description){
        description.value = "";
    }

    modal.classList.add("active");

}

function closeReportModal(){

    const modal =
        document.getElementById("reportModal");

    if(!modal){
        return;
    }

    modal.classList.remove("active");

    reportContentType = null;
    reportContentId = null;
    reportReportedUsername = null;

}

async function submitReport(){

    const reason =
        document.getElementById("reportReason")?.value;

    const description =
        document.getElementById("reportDescription")?.value.trim();

    if(!reportContentType || !reportContentId){

        alert("Report information is missing.");

        return;

    }

    if(!reason){

        alert("Please select a reason.");

        return;

    }

    const childSafetyReasons = [
        "child_safety",
        "csam",
        "grooming",
        "sexual_exploitation",
        "sexualization_of_minors"
    ];

    if(
        childSafetyReasons.includes(reason) &&
        !description
    ){

        alert(
            "Please describe the child safety concern."
        );

        return;

    }

    const submitButton =
        document.querySelector(".submit-report-btn");

    if(submitButton){

        submitButton.disabled = true;
        submitButton.innerText = "Submitting...";

    }

    try{

        let reportedUser = null;

        /*
         * Shorts suna dauke da username ne.
         * Backend kuma yana bukatar User ObjectId.
         * Don haka muna dauko creator daga cache.
         */

        if(reportReportedUsername){

            const creator =
                creatorCache[reportReportedUsername];

            if(creator && creator._id){

                reportedUser = creator._id;

            }

        }

        const res = await fetch(
            "/api/reports",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json",

                    "Authorization":
    "Bearer " + localStorage.getItem("token")
                },

                body:JSON.stringify({

                    reportedUser,

                    contentType:reportContentType,

                    contentId:reportContentId,

                    reason,

                    description:description || ""

                })
            }
        );


        const responseText = await res.text();

console.log("REPORT STATUS:", res.status);
console.log("REPORT RESPONSE:", responseText);

let data;

try {
    data = JSON.parse(responseText);
} catch (err) {
    console.error("REPORT JSON ERROR:", err);
    alert(
        "Server returned an invalid response. Status: " +
        res.status
    );
    return;
}
        
        if(data.success){

            alert(
                "✅ Report submitted successfully."
            );

            closeReportModal();

        }else{

            alert(
                data.message ||
                "Failed to submit report."
            );

        }

    }catch(err){

        console.error(
            "Submit report error:",
            err
        );

        alert(
            "Failed to submit report. Please try again."
        );

    }finally{

        if(submitButton){

            submitButton.disabled = false;
            submitButton.innerText = "Submit Report";

        }

    }

 }

// ================= LOAD =================

loadVideos();
