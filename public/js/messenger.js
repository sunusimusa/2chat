const me = JSON.parse(localStorage.getItem("user"));

async function loadUsers(){

const res = await fetch("/api/messages/list/" + me.username);

const data = await res.json();

let html = "";

data.chats.forEach(chat=>{

html += `

<div class="user" onclick="openChat('${chat.username}')">

<img src="${chat.avatar || '/images/default.png'}">

<div class="user-info">

<h3>${chat.username}</h3>

<p>${chat.lastMessage}</p>

</div>

<div style="text-align:right;">

<div class="chat-time">

${chat.time
? new Date(chat.time).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
})
: ""}

</div>

${chat.online
? '<div class="online-dot"></div>'
: ''}

</div>

</div>

`;

});

document.getElementById("users").innerHTML = html;

}

function openChat(username){

location.href="/chat.html?user="+username;

}

const search = document.getElementById("searchUser");

search.addEventListener("input",()=>{

const value = search.value.toLowerCase();

document.querySelectorAll(".user").forEach(user=>{

const name = user.innerText.toLowerCase();

user.style.display =
name.includes(value)
? "flex"
: "none";

});

});

loadUsers();

setInterval(loadUsers,5000);
