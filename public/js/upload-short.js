const user = JSON.parse(localStorage.getItem("user"));

const videoInput = document.getElementById("video");
const preview = document.getElementById("preview");

videoInput.addEventListener("change", () => {

    const file = videoInput.files[0];

    if (!file) return;

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";

});

function uploadShort() {

    const file = videoInput.files[0];

    const caption = document.getElementById("caption").value.trim();

    if (!file) {

        alert("Please select a video.");

        return;

    }

    const formData = new FormData();

    formData.append("video", file);

    formData.append("username", user.username);

    formData.append("avatar", user.avatar || "");

    formData.append("caption", caption);

    formData.append(
    "category",
    document.getElementById("category").value
);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/api/shorts/upload", true);

    document.getElementById("progressContainer").style.display = "block";

    xhr.upload.onprogress = function(e){

        if(e.lengthComputable){

            const percent = Math.round((e.loaded / e.total) * 100);

            document.getElementById("progressFill").style.width = percent + "%";

            document.getElementById("progressText").innerText = percent + "%";

        }

    };

    xhr.onload = function(){

        const data = JSON.parse(xhr.responseText);

        if(data.success){

            document.getElementById("progressText").innerText = "✅ Upload Complete";

            setTimeout(()=>{

                location.href="/shorts.html";

            },1000);

        }else{

            alert(data.message);

        }

    };

    xhr.onerror = function(){

        alert("Upload failed.");

    };

    xhr.send(formData);

}
