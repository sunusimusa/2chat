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

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

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

        const res =
            await fetch(
                "/api/posts/edit",
                {
                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

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

        const res =
            await fetch(
                "/api/posts/create",
                {
                    method: "POST",
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

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

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

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

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

        const res =
            await fetch(
                "/api/notifications/count/" +
                encodeURIComponent(
                    user.username
                )
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


// =====================================================
// LOAD POSTS
// =====================================================

async function loadPosts(){

    const feed =
        document.getElementById(
            "feed"
        );


    if(!feed){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/posts"
            );


        const data =
            await res.json();


        if(!data.posts){

            feed.innerHTML = `
                <div class="loading">
                    No posts found.
                </div>
            `;

            return;

        }


        let html = "";


        data.posts.forEach(
            post => {

                const liked =
                    post.likes &&
                    post.likes.includes(
                        user.username
                    );


                const safeText =
                    String(
                        post.text || ""
                    )
                    .replace(
                        /`/g,
                        "\\`"
                    );


                html += `

                <article
                class="post-card">

                    <div
                    class="post-header">

                        <div
                        class="post-user">

                            <img
                            class="post-avatar"
                            src="${
                                post.avatar ||
                                "/images/default.png"
                            }"
                            onclick="openProfile(
                                '${post.username}'
                            )">

                            <div>

                                <h4
                                onclick="openProfile(
                                    '${post.username}'
                                )">

                                    ${
                                        post.username
                                    }

                                </h4>

                                <small>

                                    ${
                                        new Date(
                                            post.createdAt
                                        ).toLocaleString()
                                    }

                                </small>

                            </div>

                        </div>


                        ${
                            post.username ===
                            user.username

                            ?

                            `

                            <div
                            class="post-menu">

                                <button
                                onclick="editPost(
                                    '${post._id}',
                                    \`${safeText}\`
                                )">

                                    <i
                                    class="fa-solid fa-pen">
                                    </i>

                                </button>


                                <button
                                onclick="deletePost(
                                    '${post._id}'
                                )">

                                    <i
                                    class="fa-solid fa-trash">
                                    </i>

                                </button>

                            </div>

                            `

                            :

                            ""

                        }

                    </div>


                    ${
                        post.text

                        ?

                        `

                        <div
                        class="post-text">

                            ${post.text}

                        </div>

                        `

                        :

                        ""

                    }


                    ${post.image ?
`
<div class="post-image">

<img
src="${post.image}"
onclick="window.open('${post.image}','_blank')">

</div>
`
:
``
}

${post.video ?
`
<div class="post-video">

<video
src="${post.video}"
controls
playsinline
preload="metadata">

Your browser does not support video.

</video>

</div>
`
:
``
}


                    <div
                    class="post-stats">

                        <span>

                            ❤️
                            ${
                                post.likes
                                ?
                                post.likes.length
                                :
                                0
                            }

                        </span>

                        <span>

                            💬
                            ${
                                post.comments
                                ?
                                post.comments.length
                                :
                                0
                            }

                        </span>

                    </div>

                    <div
                    class="post-actions">

                        <button
                        onclick="likePost(
                            '${post._id}'
                        )">

                            <i
                            class="${
                                liked
                                ?
                                "fa-solid"
                                :
                                "fa-regular"
                            } fa-heart">
                            </i>

                            <span>Like</span>

                        </button>


                        <button
                        onclick="toggleComment(
                            '${post._id}'
                        )">

                            <i
                            class="fa-regular fa-comment">
                            </i>

                            <span>Comment</span>

                        </button>


                        <button
                        onclick="sharePost(
                            '${post._id}'
                        )">

                            <i
                            class="fa-solid fa-share">
                            </i>

                            <span>Share</span>

                        </button>

                    </div>


                    <div
                    class="comment-box"
                    id="commentBox-${post._id}">

                        <input
                        id="comment-${post._id}"
                        type="text"
                        placeholder="Write comment...">

                        <button
                        onclick="commentPost(
                            '${post._id}'
                        )">

                            <i
                            class="fa-solid fa-paper-plane">
                            </i>

                        </button>

                    </div>


                    <div
                    class="comments-list">

                        ${
                            post.comments &&
                            post.comments.length

                            ?

                            post.comments.map(
                                comment => `

                                <div
                                class="comment-item">

                                    <img
                                    class="comment-avatar"
                                    src="${
                                        comment.avatar ||
                                        "/images/default.png"
                                    }">

                                    <div
                                    class="comment-body">

                                        <b>
                                            ${
                                                comment.username
                                            }
                                        </b>

                                        <p>
                                            ${
                                                comment.text
                                            }
                                        </p>

                                    </div>

                                </div>

                                `
                            ).join("")

                            :

                            `
                            <small
                            class="no-comment">

                                No comments yet

                            </small>
                            `

                        }

                    </div>

                </article>

                `;

            }
        );


        feed.innerHTML =
            html;


    }catch(err){

        console.error(
            "LOAD POSTS ERROR:",
            err
        );


        feed.innerHTML = `

            <div class="loading">

                ❌ Failed to load posts.

            </div>

        `;

    }

}


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

function toggleComment(
    postId
){

    const box =
        document.getElementById(
            `commentBox-${postId}`
        );


    if(!box){

        return;

    }


    if(
        box.style.display ===
        "flex"
    ){

        box.style.display =
            "none";

    }else{

        box.style.display =
            "flex";

        const input =
            document.getElementById(
                `comment-${postId}`
            );


        if(input){

            setTimeout(
                () => input.focus(),
                50
            );

        }

    }

}

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
