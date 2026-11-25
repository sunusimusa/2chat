// =====================================================
// 2CHAT PROFILE
// =====================================================

// ===============================
// CURRENT USER
// ===============================

let user = null;

try {
    user = JSON.parse(
        localStorage.getItem("user")
    );
} catch (err) {
    console.error("USER PARSE ERROR:", err);
}

if (!user) {
    location.href = "/login.html";
    throw new Error("User not logged in");
}


// ===============================
// TOKEN
// ===============================

const token =
    localStorage.getItem("token");

if (!token) {
    localStorage.clear();
    location.href = "/login.html";
    throw new Error("Authentication token missing");
}


// ===============================
// PROFILE USERNAME
// ===============================

const params =
    new URLSearchParams(
        window.location.search
    );

let profileUserId = null;

const profileUsername =
    params.get("username") ||
    params.get("user");

console.log("PROFILE USERNAME:", profileUsername);
console.log("PROFILE URL:", window.location.href);


// ===============================
// DEFAULT TO MY PROFILE
// ===============================

if (!profileUsername) {

    location.href =
        "/profile.html?username=" +
        encodeURIComponent(
            user.username
        );
}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {

    try {

        const res = await fetch(
            "/api/users/profile/" +
            encodeURIComponent(profileUsername),
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "User profile not found.");
            return;
        }

        const profile = data.user;

        profileUserId = profile._id;

        // Use backend ownership verification
        const isOwner = data.isOwner === true;

        // =================================
        // ELEMENTS
        // =================================

        const get = id => document.getElementById(id);

        const privateDetails = get("privateDetails");
        const editProfileSection = get("editProfileSection");
        const accountTools = get("accountTools");

        const followBtn = get("followBtn");
        const sendGiftBtn = get("sendGiftBtn");

        const savedVideosBtn = get("savedVideosBtn");
        const walletBtn = get("walletBtn");
        const notificationSettingsBtn = get("notificationSettingsBtn");
        const giftsReceivedBtn = get("giftsReceivedBtn");
        const creatorStudioBtn = get("creatorStudioBtn");
        const monetizationBtn = get("monetizationBtn");

        const saveProfileBtn = get("saveProfileBtn");
        const uploadAvatarBtn = get("uploadAvatarBtn");

        const coverBtn = document.querySelector(".cover-btn");
        const avatarBtn = document.querySelector(".avatar-btn");

        const newUsername = get("newUsername");
        const newBio = get("newBio");

        // =================================
        // OWNER / VISITOR PERMISSIONS
        // =================================

        if (isOwner) {

            // Private information
            if (privateDetails) {
                privateDetails.hidden = false;
            }

            // Editing and account tools
            if (editProfileSection) {
                editProfileSection.style.display = "block";
            }

            if (accountTools) {
                accountTools.style.display = "block";
            }

            // Owner controls
            if (coverBtn) coverBtn.style.display = "flex";
            if (avatarBtn) avatarBtn.style.display = "grid";

            if (savedVideosBtn) savedVideosBtn.style.display = "flex";
            if (walletBtn) walletBtn.style.display = "flex";

            if (notificationSettingsBtn) {
                notificationSettingsBtn.style.display = "flex";
            }

            if (giftsReceivedBtn) giftsReceivedBtn.style.display = "flex";
            if (creatorStudioBtn) creatorStudioBtn.style.display = "flex";

            if (saveProfileBtn) saveProfileBtn.style.display = "block";
            if (uploadAvatarBtn) uploadAvatarBtn.style.display = "block";

            // Fill edit fields
            if (newUsername) {
                newUsername.value = profile.username || "";
            }

            if (newBio) {
                newBio.value = profile.bio || "";
            }

            // Private email
            const emailElement = get("email");

            if (emailElement) {
                emailElement.textContent = profile.email || "No email";
            }

            // Private phone
            const phoneElement = get("phoneNumber");

            if (phoneElement) {
                phoneElement.textContent =
                    profile.phoneNumber || "Not available";
            }

            // Private date of birth
            const dobElement = get("dateOfBirth");

            if (dobElement) {

                if (profile.dateOfBirth) {

                    const dateString = String(
                        profile.dateOfBirth
                    ).slice(0, 10);

                    const parts = dateString.split("-");

                    dobElement.textContent =
                        parts.length === 3
                            ? `${parts[2]}/${parts[1]}/${parts[0]}`
                            : "Not available";

                } else {
                    dobElement.textContent = "Not available";
                }
            }

            // Monetization
            await loadMonetizationStatus(monetizationBtn);

            // Hide visitor actions
            if (followBtn) followBtn.style.display = "none";
            if (sendGiftBtn) sendGiftBtn.style.display = "none";

        } else {

            // Hide all private information
            if (privateDetails) {
                privateDetails.hidden = true;
            }

            // Hide owner sections
            if (editProfileSection) {
                editProfileSection.style.display = "none";
            }

            if (accountTools) {
                accountTools.style.display = "none";
            }

            // Hide owner controls
            if (coverBtn) coverBtn.style.display = "none";
            if (avatarBtn) avatarBtn.style.display = "none";

            if (savedVideosBtn) savedVideosBtn.style.display = "none";
            if (walletBtn) walletBtn.style.display = "none";

            if (notificationSettingsBtn) {
                notificationSettingsBtn.style.display = "none";
            }

            if (giftsReceivedBtn) giftsReceivedBtn.style.display = "none";
            if (creatorStudioBtn) creatorStudioBtn.style.display = "none";
            if (monetizationBtn) monetizationBtn.style.display = "none";

            if (saveProfileBtn) saveProfileBtn.style.display = "none";
            if (uploadAvatarBtn) uploadAvatarBtn.style.display = "none";

            // Show visitor actions
            if (followBtn) {

                followBtn.style.display = "block";

                updateFollowButton(profile, followBtn);

                followBtn.onclick = async function () {
                    await followUser(profile.username);
                };
            }

            if (sendGiftBtn) {
                sendGiftBtn.style.display = "block";
            }
        }

        // =================================
        // PROFILE PHOTO
        // =================================

        const avatar = get("avatar");

        if (avatar) {
            avatar.src =
                profile.avatar ||
                "/images/default.png";
        }

        // =================================
        // COVER PHOTO
        // =================================

        const coverImage = get("coverImage");

        if (coverImage) {
            coverImage.src =
                profile.cover ||
                "/images/default-cover.jpg";
        }

        // =================================
        // USERNAME
        // =================================

        const usernameElement = get("username");

        if (usernameElement) {
            usernameElement.textContent =
                "@" + (profile.username || "User");
        }

        // =================================
        // BIO
        // =================================

        const bioElement = get("bio");

        if (bioElement) {
            bioElement.textContent =
                profile.bio || "No bio yet";
        }

        // =================================
        // FOLLOWERS
        // =================================

        const followersElement = get("followers");

        if (followersElement) {
            followersElement.textContent =
                Array.isArray(profile.followers)
                    ? profile.followers.length
                    : 0;
        }

        // =================================
        // FOLLOWING
        // =================================

        const followingElement = get("following");

        if (followingElement) {
            followingElement.textContent =
                Array.isArray(profile.following)
                    ? profile.following.length
                    : 0;
        }

    } catch (err) {

        console.error("LOAD PROFILE ERROR:", err);

        alert("Failed to load profile. Please try again.");

    }

}

// =====================================================
// MONETIZATION STATUS
// =====================================================

async function loadMonetizationStatus(
    button
) {

    if (!button) {
        return;
    }

    // Hide by default
    button.style.display =
        "none";

    try {

        const res = await fetch(
            "/api/monetization/status",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );


        const data =
            await res.json();


        if (!res.ok || !data.success) {
            return;
        }


        const monetization =
            data.monetization;


        if (!monetization) {
            return;
        }


        // =================================================
        // SHOW MONETIZATION
        // =================================================
        //
        // Eligible:
        // - eligible
        // - pending
        // - approved
        //
        // Idan user bai kai eligibility ba,
        // button zai kasance a boye.
        // =================================================

        if (
            monetization.status ===
                "eligible" ||

            monetization.status ===
                "pending" ||

            monetization.status ===
                "approved"
        ) {

            button.style.display =
                "flex";

        }

    } catch (err) {

        console.error(
            "MONETIZATION STATUS ERROR:",
            err
        );

        button.style.display =
            "none";
    }

}


// =====================================================
// SAVE PROFILE
// =====================================================

async function saveProfile() {

    const usernameElement =
        document.getElementById("newUsername");

    const bioElement =
        document.getElementById("newBio");

    const username =
        usernameElement
            ? usernameElement.value.trim()
            : "";

    const bio =
        bioElement
            ? bioElement.value.trim()
            : "";

    if (!token) {
        return alert(
            "❌ Login session expired. Please login again."
        );
    }

    if (!username) {
        return alert(
            "❌ Username cannot be empty."
        );
    }

    try {

        const res = await fetch(
            "/api/auth/profile",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    username,
                    bio
                })
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            return alert(
                "❌ " +
                (data.message || "Update failed")
            );
        }

        if (data.user) {
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
        }

        const updatedUsername =
            data.user?.username || username;

        alert("✅ Profile Updated");

        window.location.href =
            "/profile.html?username=" +
            encodeURIComponent(updatedUsername);

    } catch (err) {

        console.error(
            "SAVE PROFILE ERROR:",
            err
        );

        alert(
            "❌ Failed to update profile."
        );
    }
 }

// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.clear();

    location.href =
        "/login.html";

}


// =====================================================
// HOME
// =====================================================

function goHome() {

    location.href =
        "/home.html";

}


// =====================================================
// IMAGE COMPRESSION
// =====================================================

function compressImage(
    file,
    maxWidth = 1200,
    quality = 0.75
) {

    return new Promise(
        (resolve, reject) => {

            const img =
                new Image();

            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    img.onload =
                        function () {

                            let width =
                                img.width;

                            let height =
                                img.height;


                            if (
                                width >
                                maxWidth
                            ) {

                                height =
                                    height *
                                    (
                                        maxWidth /
                                        width
                                    );

                                width =
                                    maxWidth;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            canvas.toBlob(
                                function (blob) {

                                    if (!blob) {

                                        reject(
                                            new Error(
                                                "Image compression failed"
                                            )
                                        );

                                        return;
                                    }


                                    const compressedFile =
                                        new File(
                                            [blob],
                                            file.name.replace(
                                                /\.[^/.]+$/,
                                                ".jpg"
                                            ),
                                            {
                                                type:
                                                    "image/jpeg"
                                            }
                                        );


                                    resolve(
                                        compressedFile
                                    );

                                },
                                "image/jpeg",
                                quality
                            );

                        };


                    img.onerror =
                        reject;


                    img.src =
                        e.target.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


// =====================================================
// UPLOAD AVATAR
// =====================================================

async function uploadAvatar() {

    const avatarFile =
        document.getElementById(
            "avatarFile"
        );


    const file =
        avatarFile?.files?.[0];


    if (!file) {

        return alert(
            "Select image"
        );

    }


    if (!token) {

        return alert(
            "❌ Login session expired. Please login again."
        );

    }


    try {

        const compressedFile =
            await compressImage(
                file,
                700,
                0.75
            );


        const formData =
            new FormData();


        formData.append(
            "avatar",
            compressedFile
        );


        const res =
            await fetch(
                "/api/auth/avatar",
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " +
                            token
                    },

                    body: formData
                }
            );


        const data =
            await res.json();


        if (data.success) {

            user.avatar =
                data.avatar;


            localStorage.setItem(
                "user",
                JSON.stringify(
                    user
                )
            );


            alert(
                "✅ Avatar Updated"
            );


            location.reload();

        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Upload failed"
                )
            );

        }

    } catch (err) {

        console.error(
            "UPLOAD AVATAR ERROR:",
            err
        );

        alert(
            "❌ Failed to upload avatar."
        );

    }

}


// =====================================================
// LOAD MY POSTS
// =====================================================


async function loadMyPosts() {

    try {

        const res = await fetch(
            "/api/posts/user/" +
            encodeURIComponent(profileUsername)
        );

        const data = await res.json();

        if (!data.success) {
            console.error("LOAD POSTS ERROR:", data.message);
            return;
        }

        const postsCount = document.getElementById("postsCount");

        if (postsCount) {
            postsCount.innerText = data.count || 0;
        }

        const myPosts = document.getElementById("myPosts");

        if (!myPosts) return;

        if (!Array.isArray(data.posts) || data.posts.length === 0) {

            myPosts.innerHTML = `
                <p class="posts-empty">
                    No posts yet.
                </p>
            `;

            return;
        }

        const currentUser = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        const currentUsername = currentUser?.username || "";

        let html = "";

        data.posts.forEach(post => {

            const postId = String(post._id || "");

            const username = String(post.username || "User");

            const avatar = String(
                post.avatar || "/images/default.png"
            );

            const text = String(post.text || "");

            const safeText = text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");

            const safeUsername = username.replace(
                /\\/g, "\\\\"
            ).replace(/'/g, "\\'");

            const isOwner =
                currentUser &&
                post.userId &&
                String(post.userId) === String(currentUser._id);

            const likes = Array.isArray(post.likes)
                ? post.likes.length
                : 0;

            const comments = Array.isArray(post.comments)
                ? post.comments.length
                : 0;

            const liked = Array.isArray(post.likes) &&
                post.likes.includes(currentUsername);

            const date = post.createdAt
                ? new Date(post.createdAt).toLocaleString()
                : "";

            let media = "";

            if (post.image) {

                const imageUrl = String(post.image)
                    .replace(/&/g, "&amp;")
                    .replace(/"/g, "&quot;")
                    .replace(/</g, "&lt;");

                media += `
                    <img
                        class="profile-post-media"
                        src="${imageUrl}"
                        alt="Post image"
                        loading="lazy"
                    >
                `;
            }

            if (post.video) {

                const videoUrl = String(post.video)
                    .replace(/&/g, "&amp;")
                    .replace(/"/g, "&quot;")
                    .replace(/</g, "&lt;");

                media += `
                    <video
                        class="profile-post-media"
                        src="${videoUrl}"
                        controls
                        playsinline
                        preload="metadata">
                    </video>
                `;
            }

            html += `
                <article class="profile-post-card">

                    
                 <div class="profile-post-header">

               <a
                  href="/profile.html?user=${encodeURIComponent(username)}"
                  class="profile-post-avatar-link"
                  aria-label="Open ${username}'s profile">

              <img
                  class="profile-post-avatar"
                  src="${avatar.replace(/"/g, "&quot;")}"
                  alt="${username.replace(/"/g, "&quot;")}"
                  onerror="this.src='/images/default.png'"
               >

          </a>

           <div class="profile-post-user">

                 <a
                   href="/profile.html?user=${encodeURIComponent(username)}"
                   class="profile-post-username">
                  ${username}
              </a>

        <small class="profile-post-date">${date}</small>

    </div>
</div>
        


                            <small class="profile-post-date">
                                ${date}
                            </small>

                        </div>

                        ${
                            isOwner
                            ? `
                                <button
                                    class="profile-post-menu"
                                    type="button"
                                    onclick="openProfilePostMenu('${postId}')"
                                    aria-label="Post options">
                                    <i class="fa-solid fa-ellipsis"></i>
                                </button>
                            `
                            : ""
                        }

                    </div>

                    ${
                        safeText
                        ? `
                            <div class="profile-post-text">
                                ${safeText}
                            </div>
                        `
                        : ""
                    }

                    ${media}

                    <div class="profile-post-stats">

                        <span>
                            ❤️ ${likes}
                        </span>

                        <span>
                            💬 ${comments}
                        </span>

                    </div>

                    <div class="profile-post-actions">

                        <button
                            type="button"
                            onclick="profileLikePost('${postId}')">

                            <i class="${liked ? "fa-solid" : "fa-regular"} fa-heart"></i>
                            Like

                        </button>

                        <button
                            type="button"
                            onclick="profileToggleComment('${postId}')">

                            <i class="fa-regular fa-comment"></i>
                            Comment

                        </button>

                    </div>

                    <div
                        class="comment-box"
                        id="profile-comment-box-${postId}"
                        style="display:none;">

                        <input
                            type="text"
                            id="profile-comment-${postId}"
                            placeholder="Write comment...">

                        <button
                            type="button"
                            onclick="profileCommentPost('${postId}')">

                            <i class="fa-solid fa-paper-plane"></i>

                        </button>

                    </div>

                </article>
            `;

        });

        myPosts.innerHTML = html;

    } catch (err) {

        console.error("LOAD POSTS ERROR:", err);

    }

}


// =====================================
// PROFILE POST MENU
// =====================================

function openProfilePostMenu(postId) {

    const choice = prompt(
        "Post options:\n\n1. Edit Post\n2. Delete Post\n\nEnter 1 or 2:"
    );

    if (choice === "1") {

        profileEditPost(postId);

    } else if (choice === "2") {

        profileDeletePost(postId);

    }

}


// =====================================
// EDIT PROFILE POST
// =====================================


async function profileEditPost(postId) {

    const card = Array.from(
        document.querySelectorAll(
            "#myPosts .profile-post-card"
        )
    ).find(item => {

        const menu = item.querySelector(
            ".profile-post-menu"
        );

        return menu &&
            menu.getAttribute("onclick") ===
            `openProfilePostMenu('${postId}')`;

    });

    if (!card) {
        alert("Post not found.");
        return;
    }

    const textBox = card.querySelector(
        ".profile-post-text"
    );

    const currentText = textBox
        ? textBox.innerText
        : "";

    const newText = prompt(
        "Edit your post:",
        currentText
    );

    if (newText === null) return;

    if (!newText.trim()) {
        alert("Post text cannot be empty.");
        return;
    }

    try {

        const token = localStorage.getItem("token");

        const res = await fetch(
            "/api/posts/edit",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    ...(token ? {
                        "Authorization": "Bearer " + token
                    } : {})
                },

                body: JSON.stringify({
                    postId,
                    text: newText.trim()
                })
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Unable to edit post."
            );

            return;
        }

        alert("Post updated successfully.");

        await loadMyPosts();

    } catch (err) {

        console.error(
            "PROFILE EDIT POST ERROR:",
            err
        );

        alert("Failed to edit post.");

    }

  }

// =====================================
// DELETE PROFILE POST
// =====================================

async function profileDeletePost(postId) {

    if (!confirm("Are you sure you want to delete this post?")) {
        return;
    }

    try {

        const token = localStorage.getItem("token");

        const res = await fetch("/api/posts/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...(token ? {
                    "Authorization": "Bearer " + token
                } : {})
            },
            body: JSON.stringify({
                postId
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Unable to delete post.");
            return;
        }

        await loadMyPosts();

    } catch (err) {

        console.error("PROFILE DELETE POST ERROR:", err);
        alert("Failed to delete post.");

    }

}


// =====================================
// PROFILE LIKE POST
// =====================================

async function profileLikePost(postId) {

    try {

        const token = localStorage.getItem("token");

        const res = await fetch("/api/posts/like", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token ? {
                    "Authorization": "Bearer " + token
                } : {})
            },
            body: JSON.stringify({
                postId
            })
        });

        const data = await res.json();

        if (data.success) {
            await loadMyPosts();
        }

    } catch (err) {

        console.error("PROFILE LIKE ERROR:", err);

    }

}


// =====================================
// PROFILE COMMENT TOGGLE
// =====================================

function profileToggleComment(postId) {

    const box = document.getElementById(
        "profile-comment-box-" + postId
    );

    if (!box) return;

    box.style.display =
        box.style.display === "flex"
        ? "none"
        : "flex";

}


// =====================================
// PROFILE COMMENT POST
// =====================================

async function profileCommentPost(postId) {

    const input = document.getElementById(
        "profile-comment-" + postId
    );

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    try {

        const token = localStorage.getItem("token");

        const res = await fetch("/api/posts/comment", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token ? {
                    "Authorization": "Bearer " + token
                } : {})
            },
            body: JSON.stringify({
                postId,
                text
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Comment failed.");
            return;
        }

        await loadMyPosts();

    } catch (err) {

        console.error("PROFILE COMMENT ERROR:", err);

    }

}        

// =====================================================
// FOLLOW BUTTON UI
// =====================================================

function updateFollowButton(
    profile,
    button
) {

    if (!button) {
        return;
    }


    const following =
        Array.isArray(
            user.following
        )
            ? user.following
            : [];


    const isFollowing =
        following.some(
            username =>
                String(username)
                    .toLowerCase() ===
                String(profile.username)
                    .toLowerCase()
        );


    if (isFollowing) {

        button.innerHTML = `
            <i class="fa-solid fa-user-minus"></i>
            Unfollow
        `;

    } else {

        button.innerHTML = `
            <i class="fa-solid fa-user-plus"></i>
            Follow
        `;

    }

}


// =====================================================
// FOLLOW / UNFOLLOW
// =====================================================

async function followUser(
    targetUsername
) {

    if (!token) {

        return alert(
            "❌ Login session expired."
        );

    }


    try {

        const res =
            await fetch(
                "/api/users/follow",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            token
                    },

                    body: JSON.stringify({

                        myUsername:
                            user.username,

                        targetUsername:
                            targetUsername

                    })
                }
            );


        const data =
            await res.json();


        if (data.success) {

            // Update local user data
            // so button state stays correct.

            if (
                Array.isArray(
                    user.following
                )
            ) {

                const index =
                    user.following.findIndex(
                        username =>
                            String(username)
                                .toLowerCase() ===
                            String(targetUsername)
                                .toLowerCase()
                    );


                if (index >= 0) {

                    user.following.splice(
                        index,
                        1
                    );

                } else {

                    user.following.push(
                        targetUsername
                    );

                }

            } else {

                user.following = [
                    targetUsername
                ];

            }


            localStorage.setItem(
                "user",
                JSON.stringify(
                    user
                )
            );


            await loadProfile();

        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Follow update failed."
                )
            );

        }

    } catch (err) {

        console.error(
            "FOLLOW ERROR:",
            err
        );

        alert(
            "❌ Failed to update follow."
        );

    }

}


// =====================================================
// UPLOAD COVER
// =====================================================

async function uploadCover() {

    const coverFile =
        document.getElementById(
            "coverFile"
        );


    const file =
        coverFile?.files?.[0];


    if (!file) {
        return;
    }


    if (!token) {

        return alert(
            "❌ Login session expired. Please login again."
        );

    }


    try {

        const compressedFile =
            await compressImage(
                file,
                1400,
                0.75
            );


        const formData =
            new FormData();


        formData.append(
            "cover",
            compressedFile
        );


        const res =
            await fetch(
                "/api/auth/cover",
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " +
                            token
                    },

                    body: formData
                }
            );


        const data =
            await res.json();


        if (data.success) {

            user.cover =
                data.cover;


            localStorage.setItem(
                "user",
                JSON.stringify(
                    user
                )
            );


            alert(
                "✅ Cover Updated"
            );


            location.reload();

        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Upload failed"
                )
            );

        }

    } catch (err) {

        console.error(
            "UPLOAD COVER ERROR:",
            err
        );

        alert(
            "❌ Failed to upload cover."
        );

    }

}


// =====================================================
// CREATOR BADGE
// =====================================================

async function loadCreatorBadge() {

    try {

        const res =
            await fetch(
                "/api/shorts/creator-badge/" +
                encodeURIComponent(
                    profileUsername
                )
            );


        const data =
            await res.json();


        const badge =
            document.getElementById(
                "creatorBadge"
            );


        if (
            !badge ||
            !data.success
        ) {
            return;
        }


        const badgeText =
            data.badge ||
            "🥉 Bronze Creator";


        badge.innerText =
            badgeText;


        // -------------------------------
        // Badge class
        // -------------------------------

        if (
            badgeText.includes(
                "Diamond"
            )
        ) {

            badge.className =
                "creator-badge badge-diamond";

        }

        else if (
            badgeText.includes(
                "Gold"
            )
        ) {

            badge.className =
                "creator-badge badge-gold";

        }

        else if (
            badgeText.includes(
                "Silver"
            )
        ) {

            badge.className =
                "creator-badge badge-silver";

        }

        else {

            badge.className =
                "creator-badge badge-bronze";

        }

    } catch (err) {

        console.error(
            "CREATOR BADGE ERROR:",
            err
        );

    }

}


// =====================================================
// OPEN CREATOR GIFTS
// =====================================================

function openCreatorGifts() {

    if (!profileUserId) {

        return alert(
            "❌ Creator ID not found."
        );

    }


    location.href =
        "/gifts.html?receiverId=" +
        encodeURIComponent(
            profileUserId
        );

}


// =====================================================
// FILE LISTENERS
// =====================================================

const coverFileInput =
    document.getElementById(
        "coverFile"
    );


if (coverFileInput) {

    coverFileInput.addEventListener(
        "change",
        uploadCover
    );

}


const avatarFileInput =
    document.getElementById(
        "avatarFile"
    );


if (avatarFileInput) {

    avatarFileInput.addEventListener(
        "change",
        uploadAvatar
    );

}


/* =====================================================
   LOAD PROFILE VIDEOS
===================================================== */


/* =====================================
   2CHAT PROFILE VIDEO GALLERY
===================================== */


/* =====================================
   2CHAT PROFILE VIDEO GALLERY
   AUTOMATIC INFINITE SCROLL
===================================== */

let profileVideos = [];
let currentProfileVideo = 0;

let profileVideosCursor = null;
let profileVideosHasMore = true;
let profileVideosLoading = false;
let profileVideosObserver = null;


// =====================================
// INITIAL VIDEO LOAD
// =====================================

async function loadMyVideos() {

    const myVideos = document.getElementById("myVideos");

    if (!myVideos) return;

    // Reset pagination
    profileVideos = [];
    profileVideosCursor = null;
    profileVideosHasMore = true;
    profileVideosLoading = false;

    if (profileVideosObserver) {
        profileVideosObserver.disconnect();
        profileVideosObserver = null;
    }

    myVideos.innerHTML = `
        <p style="text-align:center; grid-column:1/-1;">
            Loading videos...
        </p>
    `;

    await loadMoreProfileVideos(true);
}


// =====================================
// LOAD NEXT VIDEO PAGE
// =====================================

async function loadMoreProfileVideos(isFirstLoad = false) {

    const myVideos = document.getElementById("myVideos");

    if (
        !myVideos ||
        profileVideosLoading ||
        !profileVideosHasMore
    ) {
        return;
    }

    profileVideosLoading = true;

    try {

        const url = new URL(
            "/api/shorts/user/" +
            encodeURIComponent(profileUsername),
            window.location.origin
        );

        url.searchParams.set("limit", "12");

        if (profileVideosCursor) {
            url.searchParams.set(
                "cursor",
                profileVideosCursor
            );
        }

        const res = await fetch(url.toString());

        const data = await res.json();

        if (!res.ok || !data.success) {

            console.error(
                "PROFILE VIDEOS API ERROR:",
                data.message
            );

            if (isFirstLoad) {
                myVideos.innerHTML = `
                    <p style="text-align:center; grid-column:1/-1;">
                        Unable to load videos.
                    </p>
                `;
            }

            profileVideosHasMore = false;
            return;
        }

        if (
            !Array.isArray(data.videos) ||
            data.videos.length === 0
        ) {

            profileVideosHasMore = false;

            if (
                isFirstLoad &&
                profileVideos.length === 0
            ) {
                myVideos.innerHTML = `
                    <p style="text-align:center; grid-column:1/-1;">
                        No videos published yet.
                    </p>
                `;
            }

            const oldSentinel = document.getElementById(
                "profileVideosSentinel"
            );

            if (oldSentinel) {
                oldSentinel.remove();
            }

            return;
        }

        // Remember the starting index
        const startIndex = profileVideos.length;

        // Add newly loaded videos
        profileVideos.push(...data.videos);

        // Save pagination cursor
        profileVideosCursor = data.nextCursor || null;

        profileVideosHasMore =
            data.hasMore === true &&
            Boolean(profileVideosCursor);

        // Render only the new videos
        renderProfileVideos(
            data.videos,
            startIndex
        );

        // Keep existing viewer controls
        setupProfileVideoViewer();

        // Watch for automatic loading
        observeProfileVideos();

    } catch (err) {

        console.error(
            "LOAD MORE PROFILE VIDEOS ERROR:",
            err
        );

        if (isFirstLoad) {
            myVideos.innerHTML = `
                <p style="text-align:center; grid-column:1/-1;">
                    Unable to load videos.
                </p>
            `;
        }

    } finally {

        profileVideosLoading = false;

    }
}


// =====================================
// RENDER NEW VIDEOS
// =====================================

function renderProfileVideos(videos, startIndex) {

    const myVideos = document.getElementById("myVideos");

    if (!myVideos) return;

    // Remove old loading sentinel
    const oldSentinel = document.getElementById(
        "profileVideosSentinel"
    );

    if (oldSentinel) {
        oldSentinel.remove();
    }

    let html = "";

    videos.forEach((video, offset) => {

        const index = startIndex + offset;

        const videoUrl = String(video.video || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;");

        const views = Number(video.views) || 0;

        const likes = Array.isArray(video.likes)
            ? video.likes.length
            : 0;

        html += `
            <div
                class="post video-gallery-item"
                data-video-index="${index}"
                role="button"
                tabindex="0"
                aria-label="Play video ${index + 1}"
            >

                <video
                    src="${videoUrl}"
                    playsinline
                    muted
                    preload="metadata"
                    class="video-gallery-thumbnail">
                </video>

                <div class="video-gallery-play">
                    <i class="fa-solid fa-play"></i>
                </div>

                <div class="video-gallery-stats">

                    <span>
                        <i class="fa-solid fa-eye"></i>
                        ${views}
                    </span>

                    <span>
                        <i class="fa-solid fa-heart"></i>
                        ${likes}
                    </span>

                </div>

            </div>
        `;

    });

    // Append without deleting previous videos
    myVideos.insertAdjacentHTML(
        "beforeend",
        html
    );

    // Add a new sentinel if more videos exist
    if (profileVideosHasMore) {

        const sentinel = document.createElement("div");

        sentinel.id = "profileVideosSentinel";
        sentinel.style.gridColumn = "1 / -1";
        sentinel.style.height = "20px";
        sentinel.setAttribute("aria-hidden", "true");

        myVideos.appendChild(sentinel);
    }
}


// =====================================
// AUTOMATIC SCROLL OBSERVER
// =====================================

function observeProfileVideos() {

    const sentinel = document.getElementById(
        "profileVideosSentinel"
    );

    if (!sentinel || !profileVideosHasMore) {

        if (profileVideosObserver) {
            profileVideosObserver.disconnect();
            profileVideosObserver = null;
        }

        return;
    }

    if (!("IntersectionObserver" in window)) {
        console.error(
            "IntersectionObserver is not supported by this browser."
        );
        return;
    }

    if (profileVideosObserver) {
        profileVideosObserver.disconnect();
    }

    profileVideosObserver = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    profileVideosObserver.unobserve(
                        entry.target
                    );

                    loadMoreProfileVideos(false);

                }

            });

        },
        {
            root: null,
            rootMargin: "500px 0px",
            threshold: 0
        }
    );

    profileVideosObserver.observe(sentinel);
 }
        

/* =====================================
   2CHAT VIDEO VIEWER CONTROLS
===================================== */

function openProfileVideo(index) {

    if (
        index < 0 ||
        index >= profileVideos.length
    ) return;

    currentProfileVideo = index;

    const video = profileVideos[index];

    const viewer = document.getElementById("videoViewer");
    const player = document.getElementById("viewerVideo");
    const caption = document.getElementById("viewerCaption");
    const views = document.getElementById("viewerViews");

    if (!viewer || !player) return;

    player.pause();
    player.src = video.video || "";
    player.load();

    if (caption) {
        caption.textContent = video.caption || "";
    }

    if (views) {
        views.textContent =
            "👁️ " + (Number(video.views) || 0) + " Views";
    }

    viewer.hidden = false;
    document.body.style.overflow = "hidden";

    player.play().catch(err => {
        console.log("Video playback requires user interaction:", err);
    });
}


/* NEXT VIDEO */

function nextProfileVideo() {

    if (!profileVideos.length) return;

    const nextIndex =
        (currentProfileVideo + 1) % profileVideos.length;

    openProfileVideo(nextIndex);
}


/* PREVIOUS VIDEO */

function previousProfileVideo() {

    if (!profileVideos.length) return;

    const previousIndex =
        (currentProfileVideo - 1 + profileVideos.length) %
        profileVideos.length;

    openProfileVideo(previousIndex);
}


/* CLOSE VIDEO VIEWER */

function closeProfileVideo() {

    const viewer = document.getElementById("videoViewer");
    const player = document.getElementById("viewerVideo");

    if (!viewer || !player) return;

    player.pause();
    player.removeAttribute("src");
    player.load();

    viewer.hidden = true;
    document.body.style.overflow = "";
}


/* CONNECT VIEWER BUTTONS */

function setupProfileVideoViewer() {

    const gallery = document.getElementById("myVideos");

    if (!gallery || gallery.dataset.viewerBound) return;

    gallery.dataset.viewerBound = "true";

    gallery.addEventListener("click", function(e) {

        const item = e.target.closest(".video-gallery-item");

        if (!item) return;

        openProfileVideo(
            Number(item.dataset.videoIndex)
        );

    });

    gallery.addEventListener("keydown", function(e) {

        if (e.key !== "Enter" && e.key !== " ") return;

        const item = e.target.closest(".video-gallery-item");

        if (!item) return;

        e.preventDefault();

        openProfileVideo(
            Number(item.dataset.videoIndex)
        );

    });

    document.getElementById("closeVideoViewer")
        ?.addEventListener("click", closeProfileVideo);

    document.getElementById("nextVideo")
        ?.addEventListener("click", nextProfileVideo);

    document.getElementById("previousVideo")
        ?.addEventListener("click", previousProfileVideo);

    document.addEventListener("keydown", function(e) {

        const viewer = document.getElementById("videoViewer");

        if (!viewer || viewer.hidden) return;

        if (e.key === "Escape") {
            closeProfileVideo();
        }

    });

}


// =====================================================
// START
// =====================================================

loadProfile();

loadMyPosts();

loadMyVideos();

loadCreatorBadge();
