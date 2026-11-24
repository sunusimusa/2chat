const blockedUsersList = document.getElementById("blockedUsersList");
const blockedMessage = document.getElementById("blockedMessage");

async function loadBlockedUsers() {
    try {
        const res = await fetch("/api/users/blocked", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            blockedMessage.textContent =
                data.message || "Failed to load blocked users.";
            return;
        }

        const users = data.blockedUsers || [];

        blockedUsersList.innerHTML = "";

        if (users.length === 0) {
            blockedMessage.textContent = "You have not blocked anyone.";
            return;
        }

        blockedMessage.style.display = "none";

        users.forEach(user => {
            if (!user || !user._id) return;

            const item = document.createElement("div");
            item.className = "blocked-user";

            const avatar = document.createElement("img");
            avatar.src = user.avatar || "/images/default-avatar.jpg";
            avatar.alt = "User avatar";
            avatar.onerror = () => {
                avatar.src = "/images/default-avatar.jpg";
            };

            const info = document.createElement("div");
            info.className = "blocked-info";

            const username = document.createElement("strong");
            username.textContent = user.username || "Unknown User";

            const bio = document.createElement("p");
            bio.textContent = user.bio || "Blocked on 2Chat";

            info.appendChild(username);
            info.appendChild(bio);

            const button = document.createElement("button");
            button.className = "unblock-btn";
            button.textContent = "Unblock";

            button.addEventListener("click", () => {
                unblockUser(user._id, button);
            });

            item.appendChild(avatar);
            item.appendChild(info);
            item.appendChild(button);

            blockedUsersList.appendChild(item);
        });

    } catch (error) {
        console.error("LOAD BLOCKED USERS ERROR:", error);
        blockedMessage.textContent = "Network error. Please try again.";
    }
}

async function unblockUser(userId, button) {
    const confirmed = confirm("Are you sure you want to unblock this user?");

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Unblocking...";

    try {
        const res = await fetch(
            `/api/users/block/${encodeURIComponent(userId)}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Failed to unblock user.");
            button.disabled = false;
            button.textContent = "Unblock";
            return;
        }

        alert("User unblocked successfully.");

        loadBlockedUsers();

    } catch (error) {
        console.error("UNBLOCK USER ERROR:", error);
        alert("Network error. Could not unblock user.");

        button.disabled = false;
        button.textContent = "Unblock";
    }
}

loadBlockedUsers();
          
