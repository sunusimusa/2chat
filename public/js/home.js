const user =
JSON.parse(
localStorage.getItem("user")
);

if(!user){
  location.href="/login.html";
}

document.getElementById("userName")
.innerText = user.username;

function goProfile(){

location.href =
"/profile.html";

}

function goChat(){

location.href =
"/chat.html";

} 

function goMessenger(){

location.href =
"/messenger.html";

}  

function logout(){

localStorage.clear();

location.href =
"/login.html";

}  

async function commentPost(postId){

const text =
document.getElementById(
`comment-${postId}`
).value.trim();

if(text===""){
return;
}

const res =
await fetch(
"/api/posts/comment",
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
postId,
username:user.username,
text
})
}
);

const data =
await res.json();

if(data.success){

document.getElementById(`comment-${postId}`).value="";

loadPosts();

}else{

alert(data.message);

}

}

async function editPost(postId,currentText){

const newText =
prompt(
"Edit your post:",
currentText
);

if(!newText){
return;
}

const res =
await fetch(
"/api/posts/edit",
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
postId,
text:newText
})
}
);

const data =
await res.json();

if(data.success){

alert("✏️ Post Updated");

loadPosts();

}else{

alert(data.message);

}

}

// CREATE POST
async function createPost(){
const text =
document.getElementById("postText").value.trim();

const image =
document.getElementById("postImage").files[0];

if(text==="" && !image){
return;
}

const formData =
new FormData();

formData.append("userId",user._id);
formData.append("username",user.username);
formData.append("text",text);

if(image){

formData.append("image",image);

}

const res =
await fetch(
"/api/posts/create",
{
method:"POST",
body:formData
}
);              

const data =
await res.json();

if(data.success){

 document.getElementById(
"postImage"
).value = "";

document.getElementById(
"postPreview"
).style.display = "none"; 
  

document.getElementById(
"postText"
).value = "";

loadPosts();

}else{

alert(data.message);

}

}

// LIKE POST
async function likePost(postId){

const res =
await fetch(
"/api/posts/like",
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
postId,
username:user.username
})
}
);

const data =
await res.json();

if(data.success){

loadPosts();

}else{

alert(data.message);

}

}

async function deletePost(postId){

const confirmDelete =
confirm("Delete this post?");

if(!confirmDelete){
return;
}

const res =
await fetch(
"/api/posts/delete",
{
method:"DELETE",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
postId
})
}
);

const data =
await res.json();

if(data.success){

alert("🗑️ Post Deleted");

loadPosts();

}else{

alert(data.message);

}

}  

async function loadNotificationCount(){

const res =
await fetch(
"/api/notifications/count/" + user.username
);

const data =
await res.json();

if(data.success){

const badge =
document.getElementById(
"notificationCount"
);

if(data.count>0){

badge.innerText =
data.count;

badge.style.display =
"inline-block";

}else{

badge.style.display =
"none";

}

}

}

loadNotificationCount();

setInterval(
loadNotificationCount,
5000
);

// LOAD POSTS
  
async function loadPosts(){

const res = await fetch("/api/posts");
const data = await res.json();

let html = "";

data.posts.forEach(post=>{

const liked =
post.likes &&
post.likes.includes(user.username);

html += `

<div class="post-card">

<div class="post-header">

<div class="post-user">

<img
class="post-avatar"
src="${post.avatar || '/images/default.png'}">

<div>

<h4
onclick="openProfile('${post.username}')">

${post.username}

</h4>

<small>

${new Date(post.createdAt).toLocaleString()}

</small>

</div>

</div>

${post.username===user.username ?

`

<div class="post-menu">

<button
onclick="editPost('${post._id}',\`${post.text}\`)">

<i class="fa-solid fa-pen"></i>

</button>

<button
onclick="deletePost('${post._id}')">

<i class="fa-solid fa-trash"></i>

</button>

</div>

`

:

``

}

</div>

${post.text ?

`

<div class="post-text">

${post.text}

</div>

`

:

``

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

<div class="post-stats">

<span>

❤️ ${post.likes ? post.likes.length : 0}

</span>

<span>

💬 ${post.comments ? post.comments.length : 0}

</span>

</div>

<div class="post-actions">

<button
onclick="likePost('${post._id}')">

<i class="${liked ?

'fa-solid'

:

'fa-regular'

} fa-heart"></i>

</button>

<button
onclick="toggleComment('${post._id}')">

<i class="fa-regular fa-comment"></i>

</button>

<button
onclick="sharePost('${post._id}')">

<i class="fa-solid fa-share"></i>

</button>

</div>

<div
class="comment-box"
id="commentBox-${post._id}"
style="display:none;">

<input
id="comment-${post._id}"
type="text"
placeholder="Write comment...">

<button
onclick="commentPost('${post._id}')">

<i class="fa-solid fa-paper-plane"></i>

</button>

</div>

<div
class="comments-list">

${

post.comments && post.comments.length

?

post.comments.map(comment=>`

<div class="comment-item">

<img
class="comment-avatar"
src="${comment.avatar || '/images/default.png'}">

<div class="comment-body">

<b>${comment.username}</b>

<p>${comment.text}</p>

</div>

</div>

`).join("")

:

`<small class="no-comment">

No comments yet

</small>`

}

</div>

</div>

`;

});

document.getElementById("feed").innerHTML = html;

}

loadPosts();

const postImage =
document.getElementById("postImage");

postImage.addEventListener("change",()=>{

const file =
postImage.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload = function(e){

document.getElementById("postPreviewImage").src =
e.target.result;

document.getElementById("postPreview").style.display =
"block";

};

reader.readAsDataURL(file);

});

function removePostImage(){

postImage.value = "";

document.getElementById("postPreview").style.display =
"none";

}

function openProfile(username){
location.href = "/profile.html?user=" + username;
}

function viewPost(postId){

location.href =
"/post.html?id=" + postId;

}

async function sendFriendRequest(){

const res = await fetch("/api/friends/send",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

sender:user.username,

receiver:profileUser

})

});

const data = await res.json();

alert(data.message || "Friend request sent.");

}

async function loadStatusBar(){

const res = await fetch("/api/status/all");

const data = await res.json();

if(!data.success) return;

const box = document.getElementById("friendsStatus");

box.innerHTML = "";

data.statuses.forEach(status=>{

if(status.username===user.username) return;

box.innerHTML += `

<div class="friend-status"
onclick="location.href='/status.html?user=${status.username}'">

<img src="/images/default.png">

<p>${status.username}</p>

</div>

`;

});

}

loadStatusBar();

async function sharePost(postId){

const url =
window.location.origin +
"/post.html?id=" +
postId;

if(navigator.share){

navigator.share({

title:"2Chat Post",

url

});

}else{

navigator.clipboard.writeText(url);

alert("✅ Link copied");

}

}

function openMenu(){

document.getElementById("sideMenu").classList.add("active");

document.getElementById("menuOverlay").classList.add("active");

}

function closeMenu(){

document.getElementById("sideMenu").classList.remove("active");

document.getElementById("menuOverlay").classList.remove("active");

}

function toggleComment(postId){

const box =
document.getElementById(
`commentBox-${postId}`
);

if(!box) return;

box.style.display =
box.style.display==="flex"
?

"none"

:

"flex";

}

