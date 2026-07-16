const me = JSON.parse(localStorage.getItem("user"));

if (!me) {
location.href = "/login.html";
}

async function loadUsers() {

try{

const res = await fetch("/api/messages/list/" + me.username);

const data = await res.json();

if(!data.success) return;

let html = "";

data.chats.forEach(chat=>{

html += `

<div class="user"
onclick="openChat('${chat.username}')">

<img
src="${chat.avatar || '/images/default.png'}">

${chat.online
? '<div class="online-dot"></div>'
: ''}

<div class="user-info">

<h3>${chat.username}</h3>

<p>${chat.lastMessage}</p>

</div>

<div style="
display:flex;
flex-direction:column;
align-items:end;
gap:6px;
">

<div class="chat-time">

${chat.time
? new Date(chat.time).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
})
: ""}

</div>

${
chat.unread && chat.unread > 0

?

`<div class="unread">
${chat.unread}
</div>`

:

""

}

</div>

</div>

`;

});

document.getElementById("users").innerHTML = html;

}catch(err){

console.log(err);

}

}

// SEARCH

const search =
document.getElementById("searchUser");

search.addEventListener("input",()=>{

const value =
search.value.toLowerCase();

document.querySelectorAll(".user")
.forEach(user=>{

user.style.display =
user.innerText.toLowerCase()
.includes(value)

?

"flex"

:

"none";

});

});

// OPEN CHAT

function openChat(username){

location.href =
"/chat.html?user=" + username;

}

// AUTO REFRESH

loadUsers();

setInterval(loadUsers,5000);
