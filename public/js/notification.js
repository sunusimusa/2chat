const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

const container = document.getElementById("notifications");

if (!user || !token) {
    location.href = "/login.html";
}

async function loadNotifications() {

    container.innerHTML = "<p>Loading notifications...</p>";

    try {

        const res = await fetch(
            "/api/notifications/" + encodeURIComponent(user.username),
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Unable to load notifications.");
        }

        let html = "";

        if (!data.notifications || data.notifications.length === 0) {

            html = `
                <h3 style="text-align:center;margin-top:50px;">
                    No Notifications Yet
                </h3>
            `;

        } else {

            data.notifications.forEach(n => {

                html += `
                    <div
                        class="notification ${n.read ? "" : "unread"}"
                        onclick="readNotification('${n._id}','${n.type}','${n.postId || ""}')">

                        <h3>${n.text}</h3>

                        <div class="time">
                            ${new Date(n.createdAt).toLocaleString()}
                        </div>

                    </div>
                `;

            });

        }

        container.innerHTML = html;

    } catch (error) {

        console.error("Notification Loading Error:", error);

        container.innerHTML = `
            <p style="text-align:center;margin-top:40px;color:red;">
                Failed to load notifications.
                Please refresh and try again.
            </p>
        `;

    }

}


async function readNotification(id, type, postId) {

    try {

        const res = await fetch(
            "/api/notifications/read",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({ id })
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Unable to mark notification as read.");
        }

        if (type === "like" || type === "comment") {

            if (postId) {
                location.href = "/post.html?id=" + encodeURIComponent(postId);
                return;
            }

        }

        await loadNotifications();

    } catch (error) {

        console.error("Mark Notification Read Error:", error);
        alert("Unable to open notification. Please try again.");

    }

}

loadNotifications();
            
