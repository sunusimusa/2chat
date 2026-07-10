const user = JSON.parse(localStorage.getItem("user"));

const fileInput = document.getElementById("statusFile");

fileInput.addEventListener("change", uploadStatus);

function pickStatus() {
    fileInput.click();
}

async function uploadStatus() {

    const file = fileInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function (e) {

        try {

            const media = e.target.result;

            const type = file.type.startsWith("video")
                ? "video"
                : "image";

            const res = await fetch("/api/status/sunusi123", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: user.username,
                    type: type,
                    media: media,
                    text: ""
                })
            });

            const data = await res.json();

            console.log(data);

            if (data.success) {

                alert("✅ Status uploaded successfully.");

                fileInput.value = "";

                loadStatuses();

            } else {

                alert(data.message);

            }

        } catch (err) {

            console.error(err);

            alert(err.message);

        }

    };

    reader.readAsDataURL(file);

}

async function loadStatuses() {

    try {

        const res = await fetch("/api/status/all");

        const data = await res.json();

        const list = document.getElementById("statusList");

        list.innerHTML = "";

        data.statuses.forEach(status => {

            if (status.username === user.username) return;

            list.innerHTML += `
                <div class="status-card" onclick="openStatus('${status._id}')">

                    <img src="${status.avatar || '/images/default.png'}">

                    <div>
                        <h4>${status.username}</h4>
                        <small>${new Date(status.createdAt).toLocaleString()}</small>
                    </div>

                </div>
            `;

        });

    } catch (err) {

        console.error(err);

    }

}

function openStatus(id) {

    location.href = "/status-view.html?id=" + id;

}

loadStatuses();
