const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
location.href = "/login.html";
}

async function loadUsers() {
    try {
        let page = 1;
        let allUsers = [];
        let hasNextPage = true;

        while (hasNextPage) {
            const res = await fetch(
                `/api/users/all?page=${page}&limit=50`
            );

            if (!res.ok) {
                throw new Error("Failed to load users.");
            }

            const data = await res.json();

            if (!data.success || !Array.isArray(data.users)) {
                throw new Error("Invalid users response.");
            }

            allUsers.push(...data.users);

            hasNextPage =
                data.pagination?.hasNextPage === true;

            page++;
        }

        const box = document.getElementById("users");

        if (!box) return;

        box.innerHTML = "";

        allUsers.forEach(u => {
            if (u.username === user.username) return;

            box.innerHTML += `
                <div class="user-card">
                    <div class="user-info">
                        <img src="${u.avatar || '/images/default.png'}">

                        <div>
                            <b>${u.username}</b><br>
                            <small>
                                ${u.online ? "🟢 Online" : "⚫ Offline"}
                            </small>
                        </div>
                    </div>

                    <button
                        class="add-btn"
                        onclick="sendFriendRequest('${u.username}')">
                        ➕ Add Friend
                    </button>
                </div>
            `;
        });

    } catch (err) {
        console.error("LOAD USERS ERROR:", err);
    }
  }

async function sendFriendRequest(receiver){

const res = await fetch("/api/friends/send",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

sender:user.username,

receiver

})

});

const data = await res.json();

alert(data.message);

}

loadUsers();
