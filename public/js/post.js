/* =========================================
   2CHAT POST PAGE
   Secure rendering + Links + Likes + Comments
   Share + Edit + Delete
========================================= */

const user = (() => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
})();

const token = localStorage.getItem("token");

if (!user) {
    window.location.href = "/login.html";
}

const postId = new URLSearchParams(window.location.search).get("id");
const postContainer = document.getElementById("post");

let currentPost = null;

/* =========================================
   SECURITY HELPERS
========================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function safeMediaURL(value) {
    if (!value) return "";

    try {
        const url = new URL(value, window.location.origin);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

/* =========================================
   TEXT + CLICKABLE LINKS
========================================= */

function getPlainText(value) {
    let text = String(value ?? "");

    // Clean legacy posts that may contain saved anchor HTML.
    if (/<a\b/i.test(text)) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        text = doc.body.textContent || "";
    }

    return text;
}

function formatPostText(value) {
    const text = getPlainText(value);

    const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/gi);

    return parts.map(part => {
        if (/^(https?:\/\/|www\.)/i.test(part)) {

            let urlText = part;
            let punctuation = "";

            while (/[.,!?;:)\]}]$/.test(urlText)) {
                punctuation = urlText.slice(-1) + punctuation;
                urlText = urlText.slice(0, -1);
            }

            const href = urlText.startsWith("www.")
                ? "https://" + urlText
                : urlText;

            const safeURL = safeMediaURL(href);

            if (safeURL) {
                return `<a class="post-link"
                    href="${escapeHTML(safeURL)}"
                    target="_blank"
                    rel="noopener noreferrer">${escapeHTML(urlText)}</a>${escapeHTML(punctuation)}`;
            }
        }

        return escapeHTML(part);
    }).join("").replace(/\n/g, "<br>");
}

/* =========================================
   AUTHENTICATED API REQUEST
========================================= */

async function apiRequest(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Server bai dawo da sakamakon da ya dace ba.");
    }

    if (!response.ok) {
        throw new Error(data.message || "An samu matsala.");
    }

    return data;
}

/* =========================================
   OWNER CHECK
========================================= */

function isPostOwner(post) {
    const postUserId = post.userId?._id || post.userId;
    const currentUserId = user?._id || user?.id;

    return Boolean(
        postUserId &&
        currentUserId &&
        String(postUserId) === String(currentUserId)
    );
}

/* =========================================
   LOAD POST
========================================= */

async function loadPost() {

    if (!postId) {
        postContainer.innerHTML = "<h2>Post ID is missing.</h2>";
        return;
    }

    postContainer.innerHTML = "<p>Loading post...</p>";

    try {
        const response = await fetch(
            "/api/posts/single/" + encodeURIComponent(postId)
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.post) {
            postContainer.innerHTML = "<h2>Post not found.</h2>";
            return;
        }

        currentPost = data.post;

        renderPost(currentPost);

    } catch (error) {
        console.error("Load post error:", error);
        postContainer.innerHTML =
            "<h2>Unable to load this post. Please try again.</h2>";
    }
}

/* =========================================
   RENDER POST
========================================= */

function renderPost(post) {

    const avatar = safeMediaURL(post.avatar) ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const image = safeMediaURL(post.image);
    const video = safeMediaURL(post.video);

    const likes = Array.isArray(post.likes) ? post.likes : [];
    const comments = Array.isArray(post.comments) ? post.comments : [];

    const liked = likes.includes(user?.username);
    const owner = isPostOwner(post);

    const createdAt = post.createdAt
        ? new Date(post.createdAt).toLocaleString()
        : "";

    let html = `
        <div class="post-card">

            <div class="post-header"
                style="display:flex;align-items:center;gap:12px;">

                <img
                    src="${escapeHTML(avatar)}"
                    alt="Profile"
                    style="width:50px;height:50px;border-radius:50%;object-fit:cover;"
                >

                <div style="flex:1;">
                    <h3>${escapeHTML(post.username || "User")}</h3>
                    <small>${escapeHTML(createdAt)}</small>
                </div>

                ${owner ? `
                    <div class="post-menu">
                        <button type="button" data-action="edit">Edit</button>
                        <button type="button" data-action="delete">Delete</button>
                    </div>
                ` : ""}
            </div>

            <div class="post-text">
                ${formatPostText(post.text)}
            </div>

            ${image ? `
                <img
                    src="${escapeHTML(image)}"
                    alt="Post image"
                    style="width:100%;margin:15px 0;border-radius:10px;"
                >
            ` : ""}

            ${video ? `
                <video
                    src="${escapeHTML(video)}"
                    controls
                    playsinline
                    style="width:100%;margin:15px 0;border-radius:10px;"
                ></video>
            ` : ""}

            <div class="stats">
                <span>❤️ ${likes.length} Likes</span>
                <span>💬 ${comments.length} Comments</span>
            </div>

            <div class="post-actions">
                <button type="button" data-action="like">
                    ${liked ? "❤️ Unlike" : "🤍 Like"}
                </button>

                <button type="button" data-action="focus-comment">
                    💬 Comment
                </button>

                <button type="button" data-action="share">
                    ↗ Share
                </button>
            </div>

            <hr>

            <h3>Comments</h3>

            <div id="comments-list">
                ${comments.map(comment => `
                    <div class="comment">

                        <b>${escapeHTML(comment.username || "User")}</b>

                        <small>
                            ${escapeHTML(
                                comment.createdAt
                                    ? new Date(comment.createdAt).toLocaleString()
                                    : ""
                            )}
                        </small>

                        <p>${formatPostText(comment.text)}</p>

                    </div>
                `).join("")}
            </div>

            <div class="comment-form">
                <textarea
                    id="commentText"
                    placeholder="Write a comment..."
                    rows="3"
                    style="width:100%;padding:12px;border:1px solid #ccc;border-radius:10px;"
                ></textarea>

                <button type="button" data-action="comment">
                    Send Comment
                </button>
            </div>

        </div>
    `;

    postContainer.innerHTML = html;

    attachPostEvents();
}

/* =========================================
   POST BUTTON EVENTS
========================================= */

function attachPostEvents() {

    postContainer.onclick = async function(event) {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;

        try {

            if (action === "like") {
                await likePost();
            }

            if (action === "comment") {
                await sendComment();
            }

            if (action === "focus-comment") {
                document.getElementById("commentText")?.focus();
            }

            if (action === "share") {
                await sharePost();
            }

            if (action === "edit") {
                await editPost();
            }

            if (action === "delete") {
                await deletePost();
            }

        } catch (error) {
            alert(error.message || "An samu matsala.");
        }
    };
}

/* =========================================
   LIKE / UNLIKE
========================================= */

async function likePost() {

    const data = await apiRequest("/api/posts/like", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            postId
        })
    });

    if (data.success) {
        await loadPost();
    } else {
        alert(data.message || "Unable to like post.");
    }
}

/* =========================================
   SEND COMMENT
========================================= */

async function sendComment() {

    const input = document.getElementById("commentText");
    const text = input.value.trim();

    if (!text) {
        alert("Please write a comment.");
        return;
    }

    const data = await apiRequest("/api/posts/comment", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            postId,
            text
        })
    });

    if (data.success) {
        await loadPost();
    } else {
        alert(data.message || "Unable to send comment.");
    }
}

/* =========================================
   SHARE POST
========================================= */

async function sharePost() {

    const shareURL =
        window.location.origin +
        "/post.html?id=" +
        encodeURIComponent(postId);

    const shareData = {
        title: "2Chat Post",
        text: "Check out this post on 2Chat!",
        url: shareURL
    };

    if (navigator.share) {
        await navigator.share(shareData);
        return;
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareURL);
        alert("Post link copied successfully!");
        return;
    }

    prompt("Copy this post link:", shareURL);
}

/* =========================================
   EDIT POST
========================================= */

async function editPost() {

    if (!currentPost || !isPostOwner(currentPost)) {
        alert("You cannot edit this post.");
        return;
    }

    const newText = prompt(
        "Edit your post:",
        getPlainText(currentPost.text)
    );

    if (newText === null) return;

    if (!newText.trim()) {
        alert("Post text cannot be empty.");
        return;
    }

    const data = await apiRequest("/api/posts/edit", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            postId,
            text: newText.trim()
        })
    });

    if (data.success) {
        await loadPost();
        alert("Post updated successfully!");
    } else {
        alert(data.message || "Unable to edit post.");
    }
}

/* =========================================
   DELETE POST
========================================= */

async function deletePost() {

    if (!currentPost || !isPostOwner(currentPost)) {
        alert("You cannot delete this post.");
        return;
    }

    const confirmDelete = confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    const data = await apiRequest("/api/posts/delete", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            postId
        })
    });

    if (data.success) {
        alert("Post deleted successfully!");
        window.location.href = "/home.html";
    } else {
        alert(data.message || "Unable to delete post.");
    }
}

/* =========================================
   START
========================================= */

loadPost();
          
