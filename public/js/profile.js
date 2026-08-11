const user =
JSON.parse(localStorage.getItem("user"));

if(!user){
location.href="/login.html";
}

const params =
new URLSearchParams(window.location.search);

const profileUsername =
params.get("username") ||
params.get("user") ||
user.username;

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

const followBtn = document.getElementById("followBtn");

const isOwner =
    profile.username === user.username;


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

const saveBtn =
    document.querySelector(
        'button[onclick="saveProfile()"]'
    );

const uploadAvatarBtn =
    document.querySelector(
        'button[onclick="uploadAvatar()"]'
);


// ===============================
// MY PROFILE
// ===============================

if(isOwner){

    // Show editing controls

    if(coverBtn)
        coverBtn.style.display = "flex";

    if(avatarBtn)
        avatarBtn.style.display = "flex";

    if(newUsername)
        newUsername.style.display = "block";

    if(newBio)
        newBio.style.display = "block";

    if(saveBtn)
        saveBtn.style.display = "flex";

    if(uploadAvatarBtn)
        uploadAvatarBtn.style.display = "flex";


    // Hide Follow

    if(followBtn)
        followBtn.style.display = "none";

}


// ===============================
// OTHER USER PROFILE
// ===============================

else{

    // Hide editing controls

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

    if(saveBtn)
        saveBtn.style.display = "none";

    if(uploadAvatarBtn)
        uploadAvatarBtn.style.display = "none";


    // Show Follow

    if(followBtn){

        followBtn.style.display = "block";

        followBtn.onclick = () => {

            followUser(profile.username);

        };

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

async function uploadAvatar(){

    const file =
        document.getElementById("avatarFile").files[0];

    if(!file){
        return alert("Select image");
    }

    const token =
        localStorage.getItem("token");

    if(!token){
        return alert("❌ Login session expired. Please login again.");
    }

    const formData =
        new FormData();

    formData.append("avatar", file);

    const res =
        await fetch(
            "/api/auth/avatar",
            {
                method:"POST",

                headers:{
                    "Authorization":"Bearer " + token
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

        alert("❌ " + (data.message || "Upload failed"));

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
        return alert("❌ Login session expired. Please login again.");
    }

    const formData =
        new FormData();

    formData.append("cover", file);

    const res =
        await fetch(
            "/api/auth/cover",
            {
                method:"POST",

                headers:{
                    "Authorization":"Bearer " + token
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

        alert("❌ " + (data.message || "Upload failed"));

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

loadProfile();
loadMyPosts();
loadCreatorBadge();

