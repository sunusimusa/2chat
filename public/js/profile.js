const user =
JSON.parse(localStorage.getItem("user"));

if(!user){
location.href="/login.html";
}

const params =
new URLSearchParams(window.location.search);

let profileUserId = null;

const profileUsername =
    params.get("username") ||
    params.get("user");

if (!profileUsername) {
    location.href = "/profile.html?username=" +
        encodeURIComponent(user.username);
}

async function loadProfile(){

const res =
await fetch(
"/api/users/profile/" + profileUsername
);

const data =
await res.json();

if(!data.success){
return;
}

const profile = data.user;

    profileUserId =
    profile._id;

const followBtn = document.getElementById("followBtn");

const isOwner =
    String(profile.username).toLowerCase() ===
    String(user.username).toLowerCase();
    
    const sendGiftBtn =
    document.getElementById("sendGiftBtn");

    const savedVideosBtn =
    document.getElementById("savedVideosBtn");

const walletBtn =
    document.getElementById("walletBtn");

const giftsReceivedBtn =
    document.getElementById("giftsReceivedBtn");

const creatorStudioBtn =
    document.getElementById("creatorStudioBtn");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const uploadAvatarBtn =
    document.getElementById("uploadAvatarBtn");

// ===============================
// OWNER / OTHER USER CONTROLS
// ===============================

const coverBtn =
    document.querySelector(".cover-btn");

const avatarBtn =
    document.querySelector(".avatar-btn");

const coverFile =
    document.getElementById("coverFile");

const avatarFile =
    document.getElementById("avatarFile");

const newUsername =
    document.getElementById("newUsername");

const newBio =
    document.getElementById("newBio");

// ===============================
// MY PROFILE
// ===============================

if(isOwner){

    // My profile controls
    if(coverBtn)
        coverBtn.style.display = "flex";

    if(avatarBtn)
        avatarBtn.style.display = "flex";

    if(newUsername)
        newUsername.style.display = "block";

    if(newBio)
        newBio.style.display = "block";

    if(savedVideosBtn)
        savedVideosBtn.style.display = "flex";

    if(walletBtn)
        walletBtn.style.display = "flex";

    if(giftsReceivedBtn)
        giftsReceivedBtn.style.display = "flex";

    if(creatorStudioBtn)
        creatorStudioBtn.style.display = "flex";

    if(saveProfileBtn)
        saveProfileBtn.style.display = "flex";

    if(uploadAvatarBtn)
        uploadAvatarBtn.style.display = "flex";


    // Hide visitor controls
    if(followBtn)
        followBtn.style.display = "none";

    if(sendGiftBtn)
        sendGiftBtn.style.display = "none";
}


// ===============================
// OTHER USER PROFILE
// ===============================

else{

    // Hide editing
    if(coverBtn)
        coverBtn.style.display = "none";

    if(avatarBtn)
        avatarBtn.style.display = "none";

    if(coverFile)
        coverFile.style.display = "none";

    if(avatarFile)
        avatarFile.style.display = "none";

    if(newUsername)
        newUsername.style.display = "none";

    if(newBio)
        newBio.style.display = "none";


    // Hide owner-only buttons
    if(savedVideosBtn)
        savedVideosBtn.style.display = "none";

    if(walletBtn)
        walletBtn.style.display = "none";

    if(giftsReceivedBtn)
        giftsReceivedBtn.style.display = "none";

    if(creatorStudioBtn)
        creatorStudioBtn.style.display = "none";

    if(saveProfileBtn)
        saveProfileBtn.style.display = "none";

    if(uploadAvatarBtn)
        uploadAvatarBtn.style.display = "none";


    // Show Follow
    if(followBtn){

        followBtn.style.display = "block";

        followBtn.onclick = () => {

            followUser(profile.username);

        };

    }


    // Show Send Gift
    if(sendGiftBtn){

        sendGiftBtn.style.display = "block";

    }

}
    
const avatar =
document.getElementById("avatar");

if(profile.avatar && profile.avatar.trim() !== ""){

    avatar.src = profile.avatar;

}else{

    avatar.src = "/images/default.png";

}
 
const coverImage = document.getElementById("coverImage");

if (coverImage) {
    coverImage.src = profile.cover || "/images/default-cover.jpg";
}
    
document.getElementById("username").innerText =
"@" + (profile.username || "User");


document.getElementById("email").innerText =
profile.email || "No email";

document.getElementById("bio").innerText =
profile.bio || "No bio yet";


document.getElementById("followers").innerText =
profile.followers ? profile.followers.length : 0;


document.getElementById("following").innerText =
profile.following ? profile.following.length : 0;    
    
}

async function saveProfile(){

    const username =
        document.getElementById("newUsername").value.trim();

    const bio =
        document.getElementById("newBio").value.trim();

    const token =
        localStorage.getItem("token");

    if(!token){
        return alert("❌ Login session expired. Please login again.");
    }

    const res = await fetch(
        "/api/auth/profile",
        {
            method:"PUT",

            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + token
            },

            body:JSON.stringify({
                username,
                bio
            })
        }
    );

    const data = await res.json();

    if(data.success){

        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        alert("✅ Profile Updated");

        location.reload();

    }else{

        alert("❌ " + (data.message || "Update failed"));

    }

}

function logout(){

  localStorage.clear();

  location.href="/login.html";

}

  function goHome(){

  location.href = "/home.html";

}

// ===============================
// COMPRESS IMAGE BEFORE UPLOAD
// ===============================

function compressImage(file, maxWidth = 1200, quality = 0.75){

    return new Promise((resolve, reject) => {

        const img = new Image();

        const reader = new FileReader();

        reader.onload = function(e){

            img.onload = function(){

                let width = img.width;
                let height = img.height;

                if(width > maxWidth){

                    height =
                        height * (maxWidth / width);

                    width = maxWidth;

                }

                const canvas =
                    document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const ctx =
                    canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );

                canvas.toBlob(
                    blob => {

                        if(!blob){
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
                                    type:"image/jpeg"
                                }
                            );

                        resolve(compressedFile);

                    },
                    "image/jpeg",
                    quality
                );

            };

            img.onerror = reject;

            img.src = e.target.result;

        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}

async function uploadAvatar(){

    const file =
        document.getElementById("avatarFile").files[0];

    if(!file){
        return alert("Select image");
    }

    const token =
        localStorage.getItem("token");

    if(!token){
        return alert(
            "❌ Login session expired. Please login again."
        );
    }

    try{

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
                    method:"POST",

                    headers:{
                        "Authorization":
                            "Bearer " + token
                    },

                    body:formData
                }
            );

        const data =
            await res.json();

        if(data.success){

            user.avatar =
                data.avatar;

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            alert("✅ Avatar Updated");

            location.reload();

        }else{

            alert(
                "❌ " +
                (data.message || "Upload failed")
            );

        }

    }catch(err){

        console.error(err);

        alert(
            "❌ Failed to upload avatar"
        );

    }

}

async function loadMyPosts(){

const res =
await fetch(
"/api/posts/user/" + profileUsername);

const data =
await res.json();

document.getElementById("postsCount").innerText =
data.count;

let html = "";

data.posts.forEach(post=>{

html += `
<div class="post">

${post.image ?
`<img src="${post.image}" style="width:100%;border-radius:10px;">`
: ""}

<p>${post.text}</p>

<small>
❤️ ${post.likes.length}
&nbsp;&nbsp;
💬 ${post.comments.length}
</small>

</div>
`;

});

document.getElementById("myPosts").innerHTML =
html;

}

async function followUser(targetUsername){

const res =
await fetch(
"/api/users/follow",
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
myUsername:user.username,
targetUsername
})
}
);

const data =
await res.json();

if(data.success){

alert("✅ Follow Updated");

loadProfile();

}else{

alert(data.message);

}

}


async function uploadCover(){

    const file =
        document.getElementById("coverFile").files[0];

    if(!file){
        return;
    }

    const token =
        localStorage.getItem("token");

    if(!token){
        return alert(
            "❌ Login session expired. Please login again."
        );
    }

    try{

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
                    method:"POST",

                    headers:{
                        "Authorization":
                            "Bearer " + token
                    },

                    body:formData
                }
            );

        const data =
            await res.json();

        if(data.success){

            user.cover =
                data.cover;

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            alert("✅ Cover Updated");

            location.reload();

        }else{

            alert(
                "❌ " +
                (data.message || "Upload failed")
            );

        }

    }catch(err){

        console.error(err);

        alert(
            "❌ Failed to upload cover"
        );

    }

}

document
.getElementById("coverFile")
.addEventListener("change", uploadCover);

async function loadCreatorBadge(){

const res = await fetch(
"/api/shorts/creator-badge/" + profileUsername
);

const data = await res.json();


const badge =
document.getElementById("creatorBadge");


if(data.success && badge){

    badge.innerText = data.badge;


    if(data.badge.includes("Diamond")){

        badge.className =
        "creator-badge badge-diamond";

    }

    else if(data.badge.includes("Gold")){

        badge.className =
        "creator-badge badge-gold";

    }

    else if(data.badge.includes("Silver")){

        badge.className =
        "creator-badge badge-silver";

    }

    else{

        badge.className =
        "creator-badge badge-bronze";

    }

}

}

function openCreatorGifts(){

    if(!profileUserId){

        alert("❌ Creator ID not found");

        return;

    }

    location.href =
        "/gifts.html?receiverId=" +
        encodeURIComponent(profileUserId);

}

loadProfile();
loadMyPosts();
loadCreatorBadge();

