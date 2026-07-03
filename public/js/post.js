const user =
JSON.parse(localStorage.getItem("user"));

if(!user){
location.href="/login.html";
}

const postId =
new URLSearchParams(window.location.search).get("id");

async function loadPost(){

const res =
await fetch("/api/posts/single/" + postId);

const data =
await res.json();

if(!data.success){

document.getElementById("post").innerHTML =
"<h2>Post not found.</h2>";

return;

}

const post = data.post;

let html = `

<div class="post-card">

<div style="display:flex;align-items:center;gap:10px;">

<img
src="${post.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
style="width:50px;height:50px;border-radius:50%;object-fit:cover;">

<div>

<h3>${post.username}</h3>

<small>
${new Date(post.createdAt).toLocaleString()}
</small>

</div>

</div>

${post.image ?
`<img
src="${post.image}"
style="width:100%;margin:15px 0;border-radius:10px;">`
: ""}

<p>${post.text}</p>

<hr>

<h3>
❤️ ${post.likes.length} Likes
</h3>

<h3>
💬 ${post.comments.length} Comments
</h3>

`;

post.comments.forEach(comment=>{

html += `

<div style="
padding:10px;
margin:10px 0;
background:#f5f5f5;
border-radius:8px;
">

<b>${comment.username}</b>

<br>

${comment.text}

</div>

`;

});

html += `

<input
id="commentText"
placeholder="Write comment">

<br><br>

<button onclick="sendComment()">

💬 Comment

</button>

</div>

`;

document.getElementById("post").innerHTML =
html;

}

async function sendComment(){

const text =
document.getElementById("commentText").value.trim();

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

loadPost();

}else{

alert(data.message);

}

}

loadPost();
