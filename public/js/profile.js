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
 
