const user = JSON.parse(localStorage.getItem("user"));

const params = new URLSearchParams(window.location.search);

const id = params.get("id");

let progress = 0;

async function loadStatus() {

    try {

        const res = await fetch("/api/status/view/" + id);

        const data = await res.json();

        if (!data.success) {

            alert("Status not found");

            history.back();

            return;

        }

        const status = data.status;

        document.getElementById("avatar").src =
            status.avatar || "/images/default.png";

        document.getElementById("username").innerText =
            status.username;

        document.getElementById("time").innerText =
            new Date(status.createdAt).toLocaleString();

        if (status.mediaType === "video") {

            document.getElementById("statusVideo").src =
                status.media;

            document.getElementById("statusVideo").style.display =
                "block";

        } else {

            document.getElementById("statusImage").src =
                status.media;

            document.getElementById("statusImage").style.display =
                "block";

        }

        await fetch("/api/status/view/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: user.username
            })
        });

        startProgress();

    } catch (err) {

        console.error(err);

    }

}

function startProgress() {

    const bar = document.getElementById("progressBar");

    const timer = setInterval(() => {

        progress += 2;

        bar.style.width = progress + "%";

        if (progress >= 100) {

            clearInterval(timer);

            history.back();

        }

    }, 100);

}

function replyStatus() {

    const text = document.getElementById("reply").value.trim();

    if (text === "") return;

    alert("Reply feature will be added next.");

}

loadStatus();
