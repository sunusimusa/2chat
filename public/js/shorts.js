const user = JSON.parse(localStorage.getItem("user"));

const container = document.getElementById("shortsContainer");

let currentVideoId = null;
let currentTab = "foryou";
let watchStart = {};

const creatorCache = {};

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

<button
id="likeBtn-${video._id}"
onclick="likeVideo('${video._id}')">
❤️
</button>
<span id="likes-${video._id}">${video.likes.length}</span>

<button onclick="commentVideo('${video._id}')">💬</button>

<span id="comments-${video._id}">
    ${video.comments.length}
</span>

<button onclick="shareVideo('${video._id}')">📤</button>
<span id="shares-${video._id}">
${video.shares || 0}
</span>

<button
    type="button"
    onclick="openReportModal('short', '${video._id}', '${video.username}')">
    🚩
</button>
<span>Report</span>

<button
    class="gift-short-btn"
    onclick="openShortGift('${video.username}', '${video._id}')">
    🎁
</button>

<span>Gift</span>

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
async function shareVideo(id){

    try{

        const res = await fetch("/api/shorts/share/" + id,{
            method:"PUT"
        });

        const data = await res.json();

        if(data.success){

            document.getElementById(
                "shares-" + id
            ).innerText = data.shares;

        }

        const url =
            window.location.origin +
            "/shorts.html?video=" + id;

        if(navigator.share){

            await navigator.share({
                title:"2Chat Shorts",
                text:"Watch this Short on 2Chat!",
                url
            });

        }else{

            await navigator.clipboard.writeText(url);

            alert("📋 Link copied successfully.");

        }

    }catch(err){

        console.log(err);

    }

}

async function addView(id){

    try{

        const res = await fetch("/api/shorts/view/" + id,{
            method:"PUT"
        });

        const data = await res.json();

        if(data.success){

            document.getElementById(
                "views-" + id
            ).innerText = data.views;

        }

    }catch(err){

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

        const data = await res.json();

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
