const user = JSON.parse(localStorage.getItem("user"));

const videoInput = document.getElementById("video");
const preview = document.getElementById("preview");

videoInput.addEventListener("change", () => {

    const file = videoInput.files[0];

    if (!file) return;

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";

});

async function uploadShort() {

    const file = videoInput.files[0];

    const caption = document.getElementById("caption").value.trim();

    if (!file) {

        alert("Please select a video.");

        return;

    }

    try {

        const formData = new FormData();

        formData.append("video", file);

        formData.append("username", user.username);

        formData.append("avatar", user.avatar || "");

        formData.append("caption", caption);

        const res = await fetch("/api/shorts/upload", {

            method: "POST",

            body: formData

        });

        const data = await res.json();

        if (data.success) {

            alert("🎉 Short uploaded successfully.");

            location.href = "/shorts.html";

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

}
