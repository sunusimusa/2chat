const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
location.href = "/login.html";
}

async function loadFriends() {

try {

const res = await fetch(`/api/friends/list/${user.username}`);

const data = await res.json();

const box = document.getElementById("friends");

box.innerHTML = "";

if (!data.friends || data.friends.length === 0) {

box.innerHTML = `
<div style="text-align:center;padding:30px;">
<h3>No friends yet 😔</h3>
<p>Send friend requests to start chatting.</p>
</div>
`;

return;

}

for (const username of data.friends) {

const profile = await fetch(`/api/users/profile/${username}`);

const userData = await profile.json();

const friend = userData.user;

box.innerHTML += `

<div class="user-card">

<div class="user-info">

<img src="${friend.avatar || "/images/default.png"}">

<div>

<b>${friend.username}</b><br>

<small>
${friend.online ? "🟢 Online" : "⚫ Offline"}
</small>

</div>

</div>

<button
class="add-btn"
onclick="location.href='/chat.html?user=${friend.username}'">

💬 Chat

</button>

</div>

`;

}

} catch(err) {

console.log(err);

}

}

loadFriends();
