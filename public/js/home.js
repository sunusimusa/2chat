// =====================================================
// 2CHAT HOME
// =====================================================


// =====================================================
// CURRENT USER
// =====================================================

let user = null;

try {

    user =
        JSON.parse(
            localStorage.getItem("user")
        );

} catch (err) {

    console.error(
        "USER PARSE ERROR:",
        err
    );

}


if (!user) {

    location.href =
        "/login.html";

}

// =====================================================
// AUTHENTICATED API HEADERS
// =====================================================

function getAuthHeaders(extraHeaders = {}) {

    const token = localStorage.getItem("token");

    return {
        ...extraHeaders,
        ...(token ? {
            "Authorization": "Bearer " + token
        } : {})
    };

}


// =====================================================
// CREATE POST AVATAR
// =====================================================

const createPostAvatar =
    document.getElementById("createPostAvatar");

if (createPostAvatar && user) {

    createPostAvatar.src =
        user.avatar ||
        "/images/default.png";
}

// =====================================================
// USER NAME
// =====================================================

const userName =
    document.getElementById(
        "userName"
    );

if (userName) {

    userName.innerText =
        user.username || "User";

}


// =====================================================
// PROFILE
// =====================================================

function goProfile(){

    location.href =
        "/profile.html";

}


// =====================================================
// CHAT
// =====================================================

function goChat(){

    location.href =
        "/chat.html";

}


function goMessenger(){

    location.href =
        "/messenger.html";

}


// =====================================================
// LOGOUT
// =====================================================

function logout(){

    localStorage.clear();

    location.href =
        "/login.html";

}


// =====================================================
// MENU
// =====================================================

function openMenu(){

    const menu =
        document.getElementById(
            "sideMenu"
        );

    const overlay =
        document.getElementById(
            "menuOverlay"
        );

    if(menu){

        menu.classList.add(
            "active"
        );

    }

    if(overlay){

        overlay.classList.add(
            "active"
        );

    }

}


function closeMenu(){

    const menu =
        document.getElementById(
            "sideMenu"
        );

    const overlay =
        document.getElementById(
            "menuOverlay"
        );

    if(menu){

        menu.classList.remove(
            "active"
        );

    }

    if(overlay){

        overlay.classList.remove(
            "active"
        );

    }

}


// =====================================================
// SEARCH
// =====================================================

function openSearch(){

    const panel =
        document.getElementById(
            "searchPanel"
        );

    const input =
        document.getElementById(
            "searchInput"
        );

    if(!panel){

        return;

    }

    panel.classList.add(
        "active"
    );

    if(input){

        setTimeout(
            () => input.focus(),
            100
        );

    }

}


function closeSearch(){

    const panel =
        document.getElementById(
            "searchPanel"
        );

    if(panel){

        panel.classList.remove(
            "active"
        );

    }

}


function performSearch(){

    const input =
        document.getElementById(
            "searchInput"
        );

    if(!input){

        return;

    }

    const query =
        input.value.trim();

    if(!query){

        return;

    }

    /*
     * Idan kana da search.html,
     * za mu iya tura query zuwa can.
     */

    location.href =
        "/users.html?search=" +
        encodeURIComponent(
            query
        );

}


// =====================================================
// FOCUS CREATE POST
// =====================================================

function focusCreatePost(){

    const postText =
        document.getElementById(
            "postText"
        );

    if(postText){

        postText.focus();

        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }

}


// =====================================================
// COMMENT POST
// =====================================================

async function commentPost(postId){

    const input =
        document.getElementById(
            `comment-${postId}`
        );

    if(!input){

        return;

    }

    const text =
        input.value.trim();

    if(text === ""){

        return;

    }

    try{

        const res =
            await fetch(
                "/api/posts/comment",
                {
                    method:"PUT",

                    headers: getAuthHeaders({
    "Content-Type": "application/json"
}),

                    body:JSON.stringify({
                        postId,
                        username:
                            user.username,
                        text
                    })
                }
            );


        const data =
            await res.json();


        if(data.success){

            input.value = "";

            loadPosts();

        }else{

            alert(
                data.message ||
                "Comment failed."
            );

        }

    }catch(err){

        console.error(
            "COMMENT ERROR:",
            err
        );

        alert(
            "Failed to comment."
        );

    }

}


// =====================================================
// REPLY TO COMMENT
// =====================================================

function toggleReplyForm(postId, commentId) {

    const form = document.getElementById(
        `replyForm-${postId}-${commentId}`
    );

    if (!form) return;

    form.style.display =
        form.style.display === "flex" ? "none" : "flex";

    const input = form.querySelector("input");

    if (input && form.style.display === "flex") {
        input.focus();
    }
}


async function replyToComment(postId, commentId) {

    const input = document.getElementById(
        `replyInput-${postId}-${commentId}`
    );

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    try {

        const res = await fetch("/api/posts/reply", {
            method: "PUT",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                postId,
                commentId,
                text
            })
        });

        const data = await res.json();

        lastHomePostsRefresh = Date.now();

        if (data.success) {
            loadPosts();
        } else {
            alert(data.message || "Reply failed.");
        }

    } catch (err) {
        console.error("REPLY ERROR:", err);
        alert("Failed to send reply.");
    }
}


// =====================================================
// EDIT POST
// =====================================================

async function editPost(
    postId,
    currentText
){

    const newText =
        prompt(
            "Edit your post:",
            currentText
        );


    if(newText === null){

        return;

    }


    const text =
        newText.trim();


    if(!text){

        return;

    }


    try{

        const res = await fetch("/api/posts/edit", {
    method: "PUT",
    headers: getAuthHeaders({
        "Content-Type": "application/json"
    }),
    
                    body:JSON.stringify({
                        postId,
                        text
                    })
                }
            );


        const data =
            await res.json();


        if(data.success){

            alert(
                "✏️ Post Updated"
            );

            loadPosts();

        }else{

            alert(
                data.message ||
                "Update failed."
            );

        }

    }catch(err){

        console.error(
            "EDIT POST ERROR:",
            err
        );

    }

}


// =====================================================
// CREATE POST
// =====================================================

async function createPost() {

    const text =
        document
            .getElementById("postText")
            .value
            .trim();

    const imageInput =
        document.getElementById("postImage");

    const videoInput =
        document.getElementById("postVideo");

    const image =
        imageInput.files[0];

    const video =
        videoInput.files[0];

    // ==========================================
    // CHECK
    // ==========================================

    if (
        text === "" &&
        !image &&
        !video
    ) {

        return;

    }

    // ==========================================
    // PREVENT BOTH IMAGE + VIDEO
    // ==========================================

    if (image && video) {

        alert(
            "Please select Photo OR Video, not both."
        );

        return;

    }

    const formData =
        new FormData();

    formData.append(
        "userId",
        user._id
    );

    formData.append(
        "username",
        user.username
    );

    formData.append(
        "avatar",
        user.avatar || ""
    );

    formData.append(
        "text",
        text
    );

    // ==========================================
    // FILE
    // ==========================================

    if (image) {

        formData.append(
            "file",
            image
        );

    }

    if (video) {

        formData.append(
            "file",
            video
        );

    }

    try {

        const res = await fetch(
    "/api/posts/create",
    {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
    }
);

        const data =
            await res.json();

        if (data.success) {

            // Clear text
            document.getElementById(
                "postText"
            ).value = "";

            // Clear image
            imageInput.value = "";

            // Clear video
            videoInput.value = "";

            // Hide preview
            const preview =
                document.getElementById(
                    "postPreview"
                );

            if (preview) {
                preview.style.display =
                    "none";
            }

            // Reload posts
            loadPosts();

        } else {

            alert(
                data.message ||
                "Failed to create post"
            );

        }

    } catch (err) {

        console.error(
            "CREATE POST ERROR:",
            err
        );

        alert(
            "❌ Failed to create post"
        );

    }

}


// =====================================================
// LIKE POST
// =====================================================

async function likePost(postId){

    try{

        const res =
            await fetch(
                "/api/posts/like",
                {
                    method:"PUT",

                    headers: getAuthHeaders({
                 "Content-Type": "application/json"
                }),

                    body:JSON.stringify({
                        postId,
                        username:
                            user.username
                    })
                }
            );


        const data =
            await res.json();


        if(data.success){

            loadPosts();

        }else{

            alert(
                data.message ||
                "Like failed."
            );

        }

    }catch(err){

        console.error(
            "LIKE ERROR:",
            err
        );

    }

}


// =====================================================
// DELETE POST
// =====================================================

async function deletePost(postId){

    const confirmDelete =
        confirm(
            "Delete this post?"
        );


    if(!confirmDelete){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/posts/delete",
                {
                    method:"DELETE",

                    headers: getAuthHeaders({
                  "Content-Type": "application/json"
                 }),

                    body:JSON.stringify({
                        postId
                    })
                }
            );


        const data =
            await res.json();


        if(data.success){

            alert(
                "🗑️ Post Deleted"
            );

            loadPosts();

        }else{

            alert(
                data.message ||
                "Delete failed."
            );

        }

    }catch(err){

        console.error(
            "DELETE ERROR:",
            err
        );

    }

}


// =====================================================
// NOTIFICATION COUNT
// =====================================================

async function loadNotificationCount(){

    try{

        const res = await fetch(
    "/api/notifications/count/" +
    encodeURIComponent(user.username),
    {
        headers: getAuthHeaders()
    }
);

        const data =
            await res.json();


        const badge =
            document.getElementById(
                "notificationCount"
            );


        const menuBadge =
            document.getElementById(
                "menuNotificationCount"
            );


        if(!data.success){

            return;

        }


        if(data.count > 0){

            if(badge){

                badge.innerText =
                    data.count;

                badge.style.display =
                    "flex";

            }


            if(menuBadge){

                menuBadge.innerText =
                    data.count;

                menuBadge.style.display =
                    "inline-block";

            }

        }else{

            if(badge){

                badge.innerText = "";

                badge.style.display =
                    "none";

            }


            if(menuBadge){

                menuBadge.innerText = "";

                menuBadge.style.display =
                    "none";

            }

        }

    }catch(err){

        console.error(
            "NOTIFICATION ERROR:",
            err
        );

    }

}


loadNotificationCount();


setInterval(
    loadNotificationCount,
    5000
);


function formatPostText(text) {

    let cleanText = String(text || "");

    // =====================================
    // 1. DECODE HTML ENTITIES
    // =====================================

    const decoder = document.createElement("textarea");

    for (let i = 0; i < 5; i++) {

        decoder.innerHTML = cleanText;

        const decoded = decoder.value;

        if (decoded === cleanText) break;

        cleanText = decoded;
    }

    // =====================================
    // 2. REMOVE COMPLETE ANCHOR TAGS
    // =====================================

    const parser = new DOMParser();

    if (/<a\b|<\/a>/i.test(cleanText)) {

        const doc = parser.parseFromString(
            cleanText,
            "text/html"
        );

        cleanText = doc.body.textContent || "";

    }

    // =====================================
    // 3. REMOVE LEFTOVER ANCHOR ATTRIBUTES
    // =====================================

    cleanText = cleanText
        .replace(
            /\b(?:href|target|rel|class)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi,
            ""
        )
        .replace(/<\/?a\b[^>]*>/gi, "")
        .replace(/^\s*>+|>+\s*$/g, "")
        .replace(/[ \t]{2,}/g, " ");

    // =====================================
    // 4. ESCAPE HTML SAFELY
    // =====================================

    function escapeHTML(value) {

        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    }

    // =====================================
    // 5. CREATE CLICKABLE URLS
    // =====================================

    const urlPattern =
        /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi;

    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = urlPattern.exec(cleanText)) !== null) {

        const originalURL = match[0];

        let cleanURL = originalURL;
        let ending = "";

        while (/[.,!?;:)\]}]$/.test(cleanURL)) {

            ending = cleanURL.slice(-1) + ending;

            cleanURL = cleanURL.slice(0, -1);
        }

        result += escapeHTML(
            cleanText.slice(lastIndex, match.index)
        );

        const href = cleanURL.startsWith("www.")
            ? "https://" + cleanURL
            : cleanURL;

        try {

            const parsed = new URL(href);

            if (
                parsed.protocol === "https:" ||
                parsed.protocol === "http:"
            ) {

                result +=
                    `<a href="${escapeHTML(parsed.href)}" target="_blank" rel="noopener noreferrer" class="post-link">${escapeHTML(cleanURL)}</a>` +
                    escapeHTML(ending);

            } else {

                result += escapeHTML(originalURL);

            }

        } catch (error) {

            result += escapeHTML(originalURL);

        }

        lastIndex = match.index + originalURL.length;
    }

    result += escapeHTML(
        cleanText.slice(lastIndex)
    );

    return result.replace(/\r\n|\r|\n/g, "<br>");
}


// =====================================================
// LOAD POSTS
// =====================================================

var homePostsLoading = false;
var lastHomePostsRefresh = 0;

async function loadPosts() {

    const feed = document.getElementById("feed");

    if (!feed || homePostsLoading) return;

    homePostsLoading = true;

    try {

        const res = await fetch("/api/posts");

        const data = await res.json();

        if (!data.posts || !data.posts.length) {

            feed.innerHTML = `
                <div class="loading">
                    No posts found.
                </div>
            `;

            return;
        }

        // Safely escape user-generated text
        const escapeHTML = (value) => {

            return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]);

        };

        let html = "";

        data.posts.forEach(post => {

            const liked =
                Array.isArray(post.likes) &&
                post.likes.includes(user.username);

            const comments = Array.isArray(post.comments)
                ? post.comments
                : [];

            const likes = Array.isArray(post.likes)
                ? post.likes
                : [];

            const safeText = String(post.text || "")
                .replace(/`/g, "\\`");

            const username = escapeHTML(post.username || "User");

            const postDate = post.createdAt
                ? new Date(post.createdAt).toLocaleString()
                : "";

            const avatar = escapeHTML(
                post.avatar || "/images/default.png"
            );

            const postId = escapeHTML(post._id);

            const imageURL = post.image
                ? escapeHTML(post.image)
                : "";

            const videoURL = post.video
                ? escapeHTML(post.video)
                : "";

            // =====================================
            // COMMENTS HTML
            // =====================================

            const commentsHTML = comments.length

                ? comments.map(comment => {

                    const commentId = escapeHTML(comment._id || "");
                    const replies = Array.isArray(comment.replies)
                        ? comment.replies
                        : [];

                    const repliesHTML = replies.map(reply => `
                        <div style="display:flex;gap:8px;margin:8px 0 0 28px;padding:8px 10px;background:rgba(127,127,127,0.08);border-radius:10px;">
                            <div style="min-width:0;">
                                <b>${escapeHTML(reply.username || "User")}</b>
                                <p style="margin:3px 0 0;">${formatPostText(reply.text || "")}</p>
                            </div>
                        </div>
                    `).join("");

                    return `

                        <div class="comment-item" style="margin-bottom:12px;">

                            <img
                                class="comment-avatar"
                                src="${escapeHTML(
                                    comment.avatar || "/images/default.png"
                                )}"
                                alt="Avatar">

                            <div class="comment-body">

                                <b>
                                    ${escapeHTML(comment.username || "User")}
                                </b>

                                <p>
                                    ${formatPostText(comment.text || "")}
                                </p>

                                <button
                                    type="button"
                                    onclick="toggleReplyForm('${postId}','${commentId}')"
                                    style="margin-top:5px;border:0;background:none;color:#1877f2;cursor:pointer;padding:4px 0;">
                                    Reply
                                </button>

                                <div
                                    id="replyForm-${postId}-${commentId}"
                                    class="reply-form"
                                    style="display:none;gap:6px;margin-top:7px;">

                                    <input
                                        id="replyInput-${postId}-${commentId}"
                                        type="text"
                                        maxlength="1000"
                                        placeholder="Write a reply..."
                                        style="flex:1;min-width:0;padding:8px 10px;border:1px solid #ccc;border-radius:18px;">

                                    <button
                                        type="button"
                                        onclick="replyToComment('${postId}','${commentId}')"
                                        style="border:0;border-radius:18px;padding:7px 12px;background:#1877f2;color:white;cursor:pointer;">
                                        Send
                                    </button>

                                </div>

                                <div class="comment-replies">
                                    ${repliesHTML}
                                </div>

                            </div>

                        </div>

                    `;

                }).join("")

                : `
                    <small class="no-comment">
                        No comments yet
                    </small>
                `;


            // =====================================
            // POST HTML
            // =====================================

            html += `

                <article class="post-card">

                    <!-- POST HEADER -->

                    <div class="post-header">

                        <div class="post-user">

                            <img
                                class="post-avatar"
                                src="${avatar}"
                                alt="Profile"
                                onclick="openProfile('${escapeHTML(post.username)}')">

                            <div>

                                <h4
                                    onclick="openProfile('${escapeHTML(post.username)}')">

                                    ${username}

                                </h4>

                                <small>
                                    ${escapeHTML(postDate)}
                                </small>

                            </div>

                        </div>


                        ${
                            post.username === user.username
                            ?

                            `

                                <div class="post-menu">

                                    <button
                                        onclick="editPost(
                                            '${postId}',
                                            \`${safeText}\`
                                        )">

                                        <i class="fa-solid fa-pen"></i>

                                    </button>

                                    <button
                                        onclick="deletePost('${postId}')">

                                        <i class="fa-solid fa-trash"></i>

                                    </button>

                                </div>

                            `

                            : ""

                        }

                    </div>


                    <!-- POST TEXT -->

                    ${
                        post.text
                        ?
                        `
                            <div class="post-text">
                                ${formatPostText(post.text)}
                            </div>
                        `
                        : ""
                    }


                    <!-- POST IMAGE -->

                    ${
                        imageURL
                        ?
                        `

                            <div class="post-image">

                                <img
                                    src="${imageURL}"
                                    alt="Post image"
                                    onclick="window.open('${imageURL}','_blank')">

                            </div>

                        `
                        : ""
                    }


                    <!-- POST VIDEO -->

                    ${
                        videoURL
                        ?
                        `

                            <div class="post-video">

                                <video
                                    src="${videoURL}"
                                    controls
                                    playsinline
                                    preload="metadata">

                                    Your browser does not support video.

                                </video>

                            </div>

                        `
                        : ""
                    }


                    <!-- POST STATS -->

                    <div class="post-stats">

                        <span>

                            ❤️ ${likes.length}

                        </span>


                        <span
                            class="comment-count"
                            role="button"
                            tabindex="0"
                            onclick="toggleComments('${postId}')"
                            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleComments('${postId}')}">

                            💬 ${comments.length}

                        </span>

                    </div>


                    <!-- POST ACTIONS -->

                    <div class="post-actions">

                        <button
                            onclick="likePost('${postId}')">

                            <i class="${
                                liked
                                ? "fa-solid"
                                : "fa-regular"
                            } fa-heart"></i>

                            <span>Like</span>

                        </button>


                        <button
                            onclick="toggleComment('${postId}')">

                            <i class="fa-regular fa-comment"></i>

                            <span>Comment</span>

                        </button>


                        <button
                            onclick="sharePost('${postId}')">

                            <i class="fa-solid fa-share"></i>

                            <span>Share</span>

                        </button>

                    </div>


                    <!-- COMMENT INPUT -->

                    <div
                        class="comment-box"
                        id="commentBox-${postId}">

                        <input
                            id="comment-${postId}"
                            type="text"
                            placeholder="Write comment...">

                        <button
                            onclick="commentPost('${postId}')">

                            <i class="fa-solid fa-paper-plane"></i>

                        </button>

                    </div>


                    <!-- COMMENTS LIST: HIDDEN BY DEFAULT -->

                    <div
                        class="comments-list"
                        id="commentsList-${postId}"
                        style="display:none;">

                        ${commentsHTML}

                    </div>

                </article>

            `;

        });

        feed.innerHTML = html;

    } catch (err) {

        console.error("LOAD POSTS ERROR:", err);

        feed.innerHTML = `

            <div class="loading">

                ❌ Failed to load posts.

            </div>

        `;

    } finally {

        homePostsLoading = false;

    }

}


// Refresh Home after returning to the app and periodically while visible.
window.refreshHomeIfNeeded = function () {

    if (document.visibilityState && document.visibilityState !== "visible") {
        return;
    }

    // Do not replace the feed while the user is typing or watching a post video.
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA"
    )) {
        return;
    }

    const playingVideo = document.querySelector("#feed video:not([paused])");
    if (playingVideo && !playingVideo.paused) {
        return;
    }

    if (!homePostsLoading && Date.now() - lastHomePostsRefresh >= 30000) {
        loadPosts();
    }
};

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
        window.refreshHomeIfNeeded();
    }
});

setInterval(function () {
    window.refreshHomeIfNeeded();
}, 60000);


loadPosts();
                                                                       
// =====================================================
// IMAGE PREVIEW
// =====================================================

const postImage =
    document.getElementById(
        "postImage"
    );


if(postImage){

    postImage.addEventListener(
        "change",
        () => {

            const file =
                postImage.files[0];


            if(!file){

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function(e){

                    const previewImage =
                        document.getElementById(
                            "postPreviewImage"
                        );


                    const preview =
                        document.getElementById(
                            "postPreview"
                        );


                    if(previewImage){

                        previewImage.src =
                            e.target.result;

                    }


                    if(preview){

                        preview.style.display =
                            "block";

                    }

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// =====================================================
// REMOVE POST IMAGE
// =====================================================

function removePostImage(){

    const postImage =
        document.getElementById(
            "postImage"
        );


    const preview =
        document.getElementById(
            "postPreview"
        );


    if(postImage){

        postImage.value =
            "";

    }


    if(preview){

        preview.style.display =
            "none";

    }

}


// =====================================================
// OPEN PROFILE
// =====================================================

function openProfile(
    username
){

    location.href =
        "/profile.html?user=" +
        encodeURIComponent(
            username
        );

}


// =====================================================
// VIEW POST
// =====================================================

function viewPost(
    postId
){

    location.href =
        "/post.html?id=" +
        encodeURIComponent(
            postId
        );

}


// =====================================================
// FRIEND REQUEST
// =====================================================

async function sendFriendRequest(){

    if(typeof profileUser ===
        "undefined"){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/friends/send",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        sender:
                            user.username,

                        receiver:
                            profileUser

                    })
                }
            );


        const data =
            await res.json();


        alert(
            data.message ||
            "Friend request sent."
        );

    }catch(err){

        console.error(
            "FRIEND REQUEST ERROR:",
            err
        );

    }

}


// =====================================================
// STATUS BAR
// =====================================================

async function loadStatusBar(){

    const box =
        document.getElementById(
            "friendsStatus"
        );


    /*
     * Important:
     * Idan element bai wanzu ba,
     * kada JS ya crash.
     */

    if(!box){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/status/all"
            );


        const data =
            await res.json();


        if(!data.success){

            box.innerHTML = "";

            return;

        }


        box.innerHTML = "";


        data.statuses.forEach(
            status => {

                if(
                    status.username ===
                    user.username
                ){

                    return;

                }


                box.innerHTML += `

                    <div
                    class="friend-status"
                    onclick="
                    location.href=
                    '/status.html?user=${
                        encodeURIComponent(
                            status.username
                        )
                    }'">

                        <img
                        src="${
                            status.avatar ||
                            "/images/default.png"
                        }">

                        <p>
                            ${
                                status.username
                            }
                        </p>

                    </div>

                `;

            }
        );


    }catch(err){

        console.error(
            "STATUS ERROR:",
            err
        );

    }

}


loadStatusBar();


// =====================================================
// SHARE POST
// =====================================================

async function sharePost(
    postId
){

    const url =
        window.location.origin +
        "/post.html?id=" +
        encodeURIComponent(
            postId
        );


    if(navigator.share){

        try{

            await navigator.share({

                title:
                    "2Chat Post",

                url

            });

        }catch(err){

            console.log(
                "Share cancelled"
            );

        }

    }else{

        try{

            await navigator.clipboard
                .writeText(
                    url
                );

            alert(
                "✅ Link copied"
            );

        }catch(err){

            alert(
                "Unable to copy link."
            );

        }

    }

}


// =====================================================
// TOGGLE COMMENT
// =====================================================

function toggleComment(postId) {

    const box = document.getElementById(
        `commentBox-${postId}`
    );

    const comments = document.getElementById(
        `commentsList-${postId}`
    );

    if (!box || !comments) return;

    const isOpen = box.style.display === "flex";

    // Rufe comments na sauran posts
    document.querySelectorAll(".comment-box").forEach(item => {
        item.style.display = "none";
    });

    document.querySelectorAll(".comments-list").forEach(item => {
        item.style.display = "none";
    });

    // Buɗe ko rufe wanda aka danna
    if (!isOpen) {

        box.style.display = "flex";
        comments.style.display = "block";

        const input = document.getElementById(
            `comment-${postId}`
        );

        if (input) {
            setTimeout(() => input.focus(), 50);
        }

    }

}


function toggleComments(postId) {

    const comments = document.getElementById(
        `commentsList-${postId}`
    );

    if (!comments) return;

    comments.style.display =
        comments.style.display === "none"
            ? "block"
            : "none";

}


// =====================================
// AUTO CLOSE COMMENTS WHEN TAPPING OUTSIDE
// =====================================


document.addEventListener("pointerdown", function(event) {

    const target = event.target;

    // Kada a rufe idan an taɓa cikin comments
    if (
        target.closest(".comment-box") ||
        target.closest(".comments-list")
    ) {
        return;
    }

    // Kada a rufe lokacin danna Comment button
    if (
        target.closest('[onclick*="toggleComment"]') ||
        target.closest(".comment-count")
    ) {
        return;
    }

    // Rufe dukkan comment boxes
    document.querySelectorAll(".comment-box").forEach(box => {
        box.style.display = "none";
    });

    // Rufe dukkan comments lists
    document.querySelectorAll(".comments-list").forEach(list => {
        list.style.display = "none";
    });

}, true);
            

// =====================================================
// MEDIA PREVIEW
// =====================================================

const postImageInput =
    document.getElementById("postImage");

const postVideoInput =
    document.getElementById("postVideo");

const postPreviewBox =
    document.getElementById("postPreview");

const postPreviewImage =
    document.getElementById("postPreviewImage");

const postPreviewVideo =
    document.getElementById("postPreviewVideo");


// =====================================================
// PHOTO PREVIEW
// =====================================================

if (postImageInput) {

    postImageInput.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];

            if (!file) return;


            // Clear video
            if (postVideoInput) {
                postVideoInput.value = "";
            }

            if (postPreviewVideo) {

                postPreviewVideo.pause();

                postPreviewVideo.removeAttribute(
                    "src"
                );

                postPreviewVideo.load();

                postPreviewVideo.style.display =
                    "none";
            }


            // Show image
            const reader =
                new FileReader();

            reader.onload =
                function (e) {

                    if (postPreviewImage) {

                        postPreviewImage.src =
                            e.target.result;

                        postPreviewImage.style.display =
                            "block";
                    }

                    if (postPreviewBox) {

                        postPreviewBox.style.display =
                            "block";
                    }

                };

            reader.readAsDataURL(file);

        }
    );

}


// =====================================================
// VIDEO PREVIEW
// =====================================================

if (postVideoInput) {

    postVideoInput.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];

            if (!file) return;


            // Clear image
            if (postImageInput) {
                postImageInput.value = "";
            }

            if (postPreviewImage) {

                postPreviewImage.src = "";

                postPreviewImage.style.display =
                    "none";
            }


            // Create temporary video URL
            const videoURL =
                URL.createObjectURL(file);


            if (postPreviewVideo) {

                postPreviewVideo.src =
                    videoURL;

                postPreviewVideo.style.display =
                    "block";

            }


            if (postPreviewBox) {

                postPreviewBox.style.display =
                    "block";

            }

        }
    );

}


// =====================================================
// REMOVE PHOTO / VIDEO
// =====================================================

function removePostMedia() {

    if (postImageInput) {

        postImageInput.value =
            "";

    }


    if (postVideoInput) {

        postVideoInput.value =
            "";

    }


    if (postPreviewImage) {

        postPreviewImage.src =
            "";

        postPreviewImage.style.display =
            "none";

    }


    if (postPreviewVideo) {

        postPreviewVideo.pause();

        postPreviewVideo.removeAttribute(
            "src"
        );

        postPreviewVideo.load();

        postPreviewVideo.style.display =
            "none";

    }


    if (postPreviewBox) {

        postPreviewBox.style.display =
            "none";

    }

}
