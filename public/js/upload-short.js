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

    const reader = new FileReader();

    reader.onload = async function (e) {

        try {

            const res = await fetch("/api/shorts/upload", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    username: user.username,

                    avatar: user.avatar || "",

                    caption: caption,

                    video: e.target.result

                })

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

            alert("Upload failed.");

        }

    };

    reader.readAsDataURL(file);

}
