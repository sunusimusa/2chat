
const me =
JSON.parse(
localStorage.getItem("user")
);

async function loadUsers(){

const res =
await fetch(
"/api/messages/list/" + me.username
);

const data =
await res.json();

let html = "";

data.chats.forEach(chat=>{

html += `

<div
class="user"
onclick="openChat('${chat.username}')"
>

<img
src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
>

<div style="flex:1;">

<b>${chat.username}</b>

<br>

<small>

${chat.online ? "🟢 Online" : "Last seen"}

</small>

<small style="color:gray;">
${chat.lastMessage}
</small>

</div>

<div style="position:relative;">

<img
src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
style="
width:50px;
height:50px;
border-radius:50%;
">

<div style="
position:absolute;
bottom:2px;
right:2px;
width:12px;
height:12px;
background:
${chat.online ? "#00c853" : "#9e9e9e"};
border-radius:50%;
border:2px solid white;
"></div>

</div>

`;

});

document.getElementById("users").innerHTML =
"<h2 align='center'>💬 Chats</h2>" + html;

}

function openChat(username){

location.href=
"/chat.html?user="+username;

}

loadUsers();

setInterval(loadUsers,5000);


