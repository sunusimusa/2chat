const user =
JSON.parse(
localStorage.getItem("user")
);

if(!user){

location.href="/login.html";

}

async function loadNotifications(){

const res =
await fetch(
"/api/notifications/" + user.username
);

const data =
await res.json();

if(!data.success){

return;

}

let html="";

if(data.notifications.length===0){

html = `
<h3 style="text-align:center;margin-top:50px;">
No Notifications Yet
</h3>
`;

}else{

data.notifications.forEach(n=>{

html += `

<div
class="notification ${n.read ? "" : "unread"}"
onclick="readNotification('${n._id}','${n.type}','${n.postId || ""}')">

<h3>

${n.text}

</h3>

<div class="time">

${new Date(n.createdAt).toLocaleString()}

</div>

</div>

`;

});

}

document.getElementById("notifications").innerHTML =
html;

}

async function readNotification(id,type,postId){

await fetch(

"/api/notifications/read",

{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
id
})

}

);

if(type==="like" || type==="comment"){

location.href =
"/post.html?id="+postId;

return;

}

loadNotifications();

}

loadNotifications();
