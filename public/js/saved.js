const container = document.getElementById("savedContainer");

async function loadSaved() {

    if (!container) {
        console.error("Saved videos container not found.");
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        container.textContent = "Please log in to view your saved videos.";
        return;
    }

    container.textContent = "Loading saved videos...";

    try {

        const res = await fetch("/api/shorts/saved", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            container.textContent =
                data.message || "Unable to load saved videos.";
            return;
        }

        const videos = Array.isArray(data.videos)
            ? data.videos
            : [];

        container.innerHTML = "";

        if (videos.length === 0) {
            container.textContent = "You have no saved videos yet.";
            return;
        }

        videos.forEach(video => {

            if (!video || !video.video) {
                return;
            }

            const card = document.createElement("div");
            card.className = "video-card";

            const player = document.createElement("video");
            player.src = video.video;
            player.controls = true;
            player.preload = "metadata";
            player.playsInline = true;

            const caption = document.createElement("p");
            caption.textContent = video.caption || "";

            card.appendChild(player);
            card.appendChild(caption);
            container.appendChild(card);

        });

        if (!container.children.length) {
            container.textContent = "No playable saved videos were found.";
        }

    } catch (error) {

        console.error("LOAD SAVED VIDEOS ERROR:", error);
        container.textContent = "Unable to load saved videos. Please try again.";

    }

}

loadSaved();
