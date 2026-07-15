const user =
JSON.parse(localStorage.getItem("user"));

if(!user){
location.href="/login.html";
}

const params =
new URLSearchParams(window.location.search);

const profileUsername =
params.get("user") || user.username;

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

if(profile.username !== user.username){

followBtn.style.display = "block";

followBtn.onclick = () => {
    followUser(profile.username);
};

}else{

followBtn.style.display = "none";

}

document.getElementById("avatar").src =
profile.avatar ||
"https://cdn-icons-png.flaticon.com/512/149/149071.png";

const coverImage = document.getElementById("coverImage");

if (coverImage) {
    coverImage.src = profile.cover || "/images/default-cover.jpg";
}
    
document.getElementById("username").innerText =
profile.username;

document.getElementById("email").innerText =
profile.email;

document.getElementById("bio").innerText =
profile.bio || "No bio yet";

document.getElementById("followers").innerText =
profile.followers.length;

document.getElementById("following").innerText =
profile.following.length; 

}

async function saveProfile(){

  const username =
  document.getElementById("newUsername").value;

  const bio =
  document.getElementById("newBio").value;

  const res = await fetch(
    "/api/auth/profile",
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        email:user.email,
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

    alert(data.message);

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
document.getElementById(
"avatarFile"
).files[0];

if(!file){
return alert(
"Select image"
);
}

const formData =
new FormData();

formData.append(
"avatar",
file
);

formData.append(
"email",
user.email
);

const res =
await fetch(
"/api/auth/avatar",
{
method:"POST",
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

alert(
"✅ Avatar Updated"
);

location.reload();

}else{

alert(data.message);

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

loadMyPosts();

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

const formData = new FormData();

formData.append("cover",file);
formData.append("email",user.email);

const res = await fetch(
"/api/auth/cover",
{
method:"POST",
body:formData
}
);

const data = await res.json();

if(data.success){

user.cover = data.cover;

localStorage.setItem(
"user",
JSON.stringify(user)
);

alert("✅ Cover Updated");

location.reload();

}else{

alert(data.message);

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

loadCreatorBadge();
