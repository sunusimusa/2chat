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
).value;

const res =
await fetch(
"/api/posts/comment",
{
method:"PUT",

body:formData
  
postId,
username:user.username,
text
})
}
);

const data =
await res.json();

if(data.success){

document.getElementById("postImage").value = "";

document.getElementById("postPreview").style.display =
"none";

lloadPosts);

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

body:formData
 
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
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
userId:user._id,
username:user.username,
text
})
}
);

const data =
await res.json();

if(data.success){

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

// LOAD POSTS
  
async function loadPosts(){

const res = await fetch("/api/posts");
const data = await res.json();

let html = "";

data.posts.forEach(post=>{

html += `
<div style="
border:1px solid #ddd;
border-radius:10px;
padding:15px;
margin:15px 0;
background:#fff;
box-shadow:0 2px 5px rgba(0,0,0,.08);
">

<div style="
display:flex;
align-items:center;
gap:10px;
margin-bottom:10px;
">

<img
src="${post.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
style="
width:50px;
height:50px;
border-radius:50%;
object-fit:cover;
border:2px solid #2196f3;
">

<div>

<h3 style="margin:0;">
${post.username}
</h3>

<small>
${new Date(post.createdAt).toLocaleString()}
</small>

</div>

</div>

<p style="
font-size:18px;
margin:10px 0;
word-wrap:break-word;
">
${post.text}
</p>

<button onclick="likePost('${post._id}')">
❤️ Like (${post.likes ? post.likes.length : 0})
</button>

${
post.username===user.username
?

`
<button
onclick="editPost('${post._id}',\`${post.text}\`)">
✏️ Edit
</button>

<button
onclick="deletePost('${post._id}')">
🗑️ Delete
</button>
`

:

""

}

<hr>

<input
id="comment-${post._id}"
placeholder="Write comment"
style="
width:95%;
padding:8px;
">

<br><br>

<button
onclick="commentPost('${post._id}')">
💬 Comment
</button>

<p>
<b>
Comments (${post.comments ? post.comments.length : 0})
</b>
</p>

<div>

${
post.comments && post.comments.length

?

post.comments.map(comment=>`

<div style="
display:flex;
gap:10px;
margin:10px 0;
padding:8px;
background:#f7f7f7;
border-radius:8px;
">

<img
src="${comment.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
style="
width:35px;
height:35px;
border-radius:50%;
object-fit:cover;
">

<div>

<b>
${comment.username}
</b>

<br>

${comment.text}

</div>

</div>

`).join("")

:

"<p>No comments yet.</p>"

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
