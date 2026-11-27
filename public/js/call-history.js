(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const root = document.getElementById("callHistory");
    if (!token || !user) {
        location.href = "/login.html";
        return;
    }

    async function loadHistory() {
        try {
            const response = await fetch("/api/calls/history", {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Load failed");
            if (!data.calls.length) {
                root.innerHTML = '<div class="empty"><i class="fa-solid fa-phone-slash" style="font-size:32px"></i><p>No calls yet</p></div>';
                return;
            }
            root.innerHTML = data.calls.map(call => {
                const outgoing = call.caller === user.username;
                const other = outgoing ? call.receiver : call.caller;
                const label = call.status === "missed" ? "Missed call" :
                    call.status === "declined" ? "Declined" :
                    call.status === "cancelled" ? "Cancelled" :
                    call.status === "ended" ? "Voice call" :
                    call.status === "accepted" ? "Voice call" : "Unanswered";
                const date = new Date(call.createdAt).toLocaleString();
                const duration = call.durationSeconds ? " · " + Math.floor(call.durationSeconds / 60) + ":" + String(call.durationSeconds % 60).padStart(2,"0") : "";
                return '<article class="call-row"><div class="call-icon"><i class="fa-solid ' + (call.status === "missed" && !outgoing ? "fa-phone-slash" : outgoing ? "fa-phone-arrow-up-right" : "fa-phone-arrow-down-left") + '"></i></div><div class="details"><div class="name"></div><div class="meta"></div><div class="status"></div></div><button class="call-back" type="button">Call</button></article>';
            }).join("");
            [...root.querySelectorAll(".call-row")].forEach((row, index) => {
                const call = data.calls[index];
                const other = call.caller === user.username ? call.receiver : call.caller;
                row.querySelector(".name").textContent = other;
                row.querySelector(".meta").textContent = new Date(call.createdAt).toLocaleString();
                row.querySelector(".status").textContent = (call.status === "missed" ? "Missed call" : call.status.charAt(0).toUpperCase() + call.status.slice(1)) + (call.durationSeconds ? " · " + Math.floor(call.durationSeconds / 60) + ":" + String(call.durationSeconds % 60).padStart(2,"0") : "");
                row.querySelector("button").addEventListener("click", () => {
                    location.href = "/chat.html?user=" + encodeURIComponent(other);
                });
            });
        } catch (error) {
            console.error("Call history error:", error);
            root.innerHTML = '<p class="empty">Unable to load call history. Please refresh.</p>';
        }
    }
    loadHistory();
})();
