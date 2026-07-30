const avatarInput = document.getElementById("groupImage");
const avatarPreview = document.getElementById("previewImage");

let avatarBase64 = "";

// =======================
// Avatar Preview
// =======================

avatarInput.addEventListener("change", () => {

    const file = avatarInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

        avatarPreview.src = reader.result;
        avatarBase64 = reader.result;

    };

    reader.readAsDataURL(file);

});

// =======================
// Create Group
// =======================

document
.getElementById("createBtn")
.addEventListener("click", createGroup);

async function createGroup(){

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const name =
    document.getElementById("groupName")
    .value
    .trim();

    const description =
    document.getElementById("groupDescription")
    .value
    .trim();

    if(!name){

        alert("Enter group name");

        return;

    }

    try{

        const res = await fetch("/api/groups/create",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                name,
                description,
                owner:user.username,
                avatar:avatarBase64

            })

        });

        const data = await res.json();

        if(data.success){

            alert("✅ Group created successfully");

            document.getElementById("groupName").value = "";

           document.getElementById("groupDescription").value = "";


            avatarPreview.src = "/images/default-group.png";
            
            avatarInput.value = "";

            avatarBase64 = "";
            
            window.location.href="/groups.html";
            
        }else{

            alert(data.message);

        }

    }catch(err){

        console.error(err);

        alert("Network Error");

    }

}
