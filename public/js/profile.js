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
            encodeURIComponent(
                profileUsername
            )
        );

        const data = await res.json();

        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "User profile not found."
            );

            return;
        }


        const profile =
            data.user;


        profileUserId =
            profile._id;


        // ===============================
        // OWNER CHECK
        // ===============================

        const isOwner =
            String(profile.username)
                .toLowerCase() ===
            String(user.username)
                .toLowerCase();


        // ===============================
        // ELEMENTS
        // ===============================

        const followBtn =
            document.getElementById(
                "followBtn"
            );

        const sendGiftBtn =
            document.getElementById(
                "sendGiftBtn"
            );

        const savedVideosBtn =
            document.getElementById(
                "savedVideosBtn"
            );

        const walletBtn =
            document.getElementById(
                "walletBtn"
            );

        const giftsReceivedBtn =
            document.getElementById(
                "giftsReceivedBtn"
            );

        const creatorStudioBtn =
            document.getElementById(
                "creatorStudioBtn"
            );

        const monetizationBtn =
            document.getElementById(
                "monetizationBtn"
            );

        const saveProfileBtn =
            document.getElementById(
                "saveProfileBtn"
            );

        const uploadAvatarBtn =
            document.getElementById(
                "uploadAvatarBtn"
            );

        const coverBtn =
            document.querySelector(
                ".cover-btn"
            );

        const avatarBtn =
            document.querySelector(
                ".avatar-btn"
            );

        const coverFile =
            document.getElementById(
                "coverFile"
            );

        const avatarFile =
            document.getElementById(
                "avatarFile"
            );

        const newUsername =
            document.getElementById(
                "newUsername"
            );

        const newBio =
            document.getElementById(
                "newBio"
            );


        // =================================================
        // OWNER PROFILE
        // =================================================

        if (isOwner) {

            // -------------------------------
            // Editing controls
            // -------------------------------

            if (coverBtn)
                coverBtn.style.display =
                    "flex";

            if (avatarBtn)
                avatarBtn.style.display =
                    "flex";

            if (newUsername)
                newUsername.style.display =
                    "block";

            if (newBio)
                newBio.style.display =
                    "block";


            // -------------------------------
            // Owner buttons
            // -------------------------------

            if (savedVideosBtn)
                savedVideosBtn.style.display =
                    "flex";

            if (walletBtn)
                walletBtn.style.display =
                    "flex";

            if (giftsReceivedBtn)
                giftsReceivedBtn.style.display =
                    "flex";

            if (creatorStudioBtn)
                creatorStudioBtn.style.display =
                    "flex";

            if (saveProfileBtn)
                saveProfileBtn.style.display =
                    "flex";

            if (uploadAvatarBtn)
                uploadAvatarBtn.style.display =
                    "flex";


            // -------------------------------
            // Hide visitor buttons
            // -------------------------------

            if (followBtn)
                followBtn.style.display =
                    "none";

            if (sendGiftBtn)
                sendGiftBtn.style.display =
                    "none";


            // -------------------------------
            // Check Monetization
            // -------------------------------

            await loadMonetizationStatus(
                monetizationBtn
            );

        }


        // =================================================
        // OTHER USER PROFILE
        // =================================================

        else {

            // -------------------------------
            // Hide editing
            // -------------------------------

            if (coverBtn)
                coverBtn.style.display =
                    "none";

            if (avatarBtn)
                avatarBtn.style.display =
                    "none";

            if (coverFile)
                coverFile.style.display =
                    "none";

            if (avatarFile)
                avatarFile.style.display =
                    "none";

            if (newUsername)
                newUsername.style.display =
                    "none";

            if (newBio)
                newBio.style.display =
                    "none";


            // -------------------------------
            // Hide owner buttons
            // -------------------------------

            if (savedVideosBtn)
                savedVideosBtn.style.display =
                    "none";

            if (walletBtn)
                walletBtn.style.display =
                    "none";

            if (giftsReceivedBtn)
                giftsReceivedBtn.style.display =
                    "none";

            if (creatorStudioBtn)
                creatorStudioBtn.style.display =
                    "none";

            if (monetizationBtn)
                monetizationBtn.style.display =
                    "none";

            if (saveProfileBtn)
                saveProfileBtn.style.display =
                    "none";

            if (uploadAvatarBtn)
                uploadAvatarBtn.style.display =
                    "none";


            // -------------------------------
            // Follow button
            // -------------------------------

            if (followBtn) {

                followBtn.style.display =
                    "block";

                updateFollowButton(
                    profile,
                    followBtn
                );

                followBtn.onclick =
                    async function () {

                        await followUser(
                            profile.username
                        );

                    };

            }


            // -------------------------------
            // Send Gift
            // -------------------------------

            if (sendGiftBtn) {

                sendGiftBtn.style.display =
                    "block";

            }

        }


        // =================================================
        // PROFILE DATA
        // =================================================

        const avatar =
            document.getElementById(
                "avatar"
            );

        if (avatar) {

            if (
                profile.avatar &&
                typeof profile.avatar ===
                    "string" &&
                profile.avatar.trim() !== ""
            ) {

                avatar.src =
                    profile.avatar;

            } else {

                avatar.src =
                    "/images/default.png";

            }

        }


        // -------------------------------
        // Cover
        // -------------------------------

        const coverImage =
            document.getElementById(
                "coverImage"
            );

        if (coverImage) {

            coverImage.src =
                profile.cover ||
                "/images/default-cover.jpg";

        }


        // -------------------------------
        // Username
        // -------------------------------

        const usernameElement =
            document.getElementById(
                "username"
            );

        if (usernameElement) {

            usernameElement.innerText =
                "@" +
                (
                    profile.username ||
                    "User"
                );

        }


        // -------------------------------
        // Email
        // -------------------------------

        const emailElement =
            document.getElementById(
                "email"
            );

        if (emailElement) {

            emailElement.innerText =
                profile.email ||
                "No email";

        }


        // -------------------------------
        // Bio
        // -------------------------------

        const bioElement =
            document.getElementById(
                "bio"
            );

        if (bioElement) {

            bioElement.innerText =
                profile.bio ||
                "No bio yet";

        }


        // -------------------------------
        // Followers
        // -------------------------------

        const followersElement =
            document.getElementById(
                "followers"
            );

        if (followersElement) {

            followersElement.innerText =
                Array.isArray(
                    profile.followers
                )
                    ? profile.followers.length
                    : 0;

        }


        // -------------------------------
        // Following
        // -------------------------------

        const followingElement =
            document.getElementById(
                "following"
            );

        if (followingElement) {

            followingElement.innerText =
                Array.isArray(
                    profile.following
                )
                    ? profile.following.length
                    : 0;

        }

    } catch (err) {

        console.error(
            "LOAD PROFILE ERROR:",
            err
        );

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
        document.getElementById(
            "newUsername"
        );

    const bioElement =
        document.getElementById(
            "newBio"
        );


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


    try {

        const res =
            await fetch(
                "/api/auth/profile",
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
                        username,
                        bio
                    })
                }
            );


        const data =
            await res.json();


        if (data.success) {

            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.user
                )
            );


            alert(
                "✅ Profile Updated"
            );


            location.reload();

        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Update failed"
                )
            );

        }

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

        const res =
            await fetch(
                "/api/posts/user/" +
                encodeURIComponent(
                    profileUsername
                )
            );


        const data =
            await res.json();


        if (!data.success) {
            return;
        }


        const postsCount =
            document.getElementById(
                "postsCount"
            );


        if (postsCount) {

            postsCount.innerText =
                data.count || 0;

        }


        const myPosts =
            document.getElementById(
                "myPosts"
            );


        if (!myPosts) {
            return;
        }


        let html = "";


        if (
            !Array.isArray(
                data.posts
            ) ||
            data.posts.length === 0
        ) {

            myPosts.innerHTML = `
                <p style="text-align:center;">
                    No posts yet.
                </p>
            `;

            return;
        }


        data.posts.forEach(
            post => {

                html += `
                    <div class="post">

                        ${
                            post.image
                            ?
                            `
                            <img
                                src="${post.image}"
                                style="
                                    width:100%;
                                    border-radius:10px;
                                "
                            >
                            `
                            :
                            ""
                        }

                        <p>
                            ${
                                post.text ||
                                ""
                            }
                        </p>

                        <small>
                            ❤️ ${
                                post.likes?.length ||
                                0
                            }

                            &nbsp;&nbsp;

                            💬 ${
                                post.comments?.length ||
                                0
                            }
                        </small>

                    </div>
                `;

            }
        );


        myPosts.innerHTML =
            html;

    } catch (err) {

        console.error(
            "LOAD POSTS ERROR:",
            err
        );

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


// =====================================================
// START
// =====================================================

loadProfile();

loadMyPosts();

loadCreatorBadge();
