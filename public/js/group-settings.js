// ==================================================
// 2CHAT GROUP SETTINGS
// ==================================================

const user =
    JSON.parse(localStorage.getItem("user"));


// ==================================================
// GET GROUP ID
// ==================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const groupId =
    params.get("id");


// ==================================================
// CHECK LOGIN
// ==================================================

if(!user || !user.username){

    alert("Please login first.");

    location.href =
        "/login.html";

}


// ==================================================
// CHECK GROUP ID
// ==================================================

if(!groupId){

    alert("Group ID is missing.");

    history.back();

}


// ==================================================
// ELEMENTS
// ==================================================

const groupNameInput =
    document.getElementById(
        "groupName"
    );

const groupDescriptionInput =
    document.getElementById(
        "groupDescription"
    );

const groupAvatarInput =
    document.getElementById(
        "groupAvatar"
    );

const groupCoverInput =
    document.getElementById(
        "groupCover"
    );

const avatarPreview =
    document.getElementById(
        "avatarPreview"
    );

const coverPreview =
    document.getElementById(
        "coverPreview"
    );

const saveSettingsBtn =
    document.getElementById(
        "saveSettingsBtn"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const settingsMessage =
    document.getElementById(
        "settingsMessage"
    );


// ==================================================
// CURRENT GROUP
// ==================================================

let currentGroup = null;


// ==================================================
// MESSAGE
// ==================================================

function showMessage(
    message,
    isError = false
){

    if(!settingsMessage){
        return;
    }

    settingsMessage.textContent =
        message;

    settingsMessage.classList.add(
        "show"
    );

    if(isError){

        settingsMessage.classList.add(
            "error"
        );

    }else{

        settingsMessage.classList.remove(
            "error"
        );

    }

    setTimeout(() => {

        settingsMessage.classList.remove(
            "show"
        );

    },3000);

}


// ==================================================
// LOAD GROUP
// ==================================================

async function loadGroup(){

    try{

        const res =
            await fetch(
                "/api/groups/" + groupId
            );

        const data =
            await res.json();

        if(
            !res.ok ||
            !data.success ||
            !data.group
        ){

            showMessage(
                data.message ||
                "Group not found.",
                true
            );

            return;

        }

        currentGroup =
            data.group;


        // ==================================================
        // CHECK PERMISSION
        // ==================================================

        const isOwner =
            currentGroup.owner ===
            user.username;

        const isAdmin =
            Array.isArray(
                currentGroup.admins
            ) &&
            currentGroup.admins.includes(
                user.username
            );


        if(
            !isOwner &&
            !isAdmin
        ){

            alert(
                "Only Owner or Admin can access Group Settings."
            );

            history.back();

            return;

        }


        // ==================================================
        // FILL INPUTS
        // ==================================================

        if(groupNameInput){

            groupNameInput.value =
                currentGroup.name || "";

        }


        if(groupDescriptionInput){

            groupDescriptionInput.value =
                currentGroup.description || "";

        }


        // ==================================================
        // AVATAR PREVIEW
        // ==================================================

        if(avatarPreview){

            avatarPreview.src =
                currentGroup.avatar ||
                "/images/default-group.png";

        }


        // ==================================================
        // COVER PREVIEW
        // ==================================================

        if(coverPreview){

            coverPreview.src =
                currentGroup.cover ||
                "/images/default-group-cover.jpg";

        }


    }catch(err){

        console.error(
            "LOAD GROUP SETTINGS ERROR:",
            err
        );

        showMessage(
            "Failed to load group settings.",
            true
        );

    }

}


// ==================================================
// AVATAR PREVIEW
// ==================================================

if(groupAvatarInput){

    groupAvatarInput.addEventListener(
        "change",
        function(){

            const file =
                this.files[0];

            if(!file){
                return;
            }

            if(
                !file.type.startsWith(
                    "image/"
                )
            ){

                alert(
                    "Please select an image."
                );

                this.value = "";

                return;

            }


            const reader =
                new FileReader();

            reader.onload =
                function(){

                    if(avatarPreview){

                        avatarPreview.src =
                            reader.result;

                    }

                };

            reader.readAsDataURL(file);

        }
    );

}


// ==================================================
// COVER PREVIEW
// ==================================================

if(groupCoverInput){

    groupCoverInput.addEventListener(
        "change",
        function(){

            const file =
                this.files[0];

            if(!file){
                return;
            }

            if(
                !file.type.startsWith(
                    "image/"
                )
            ){

                alert(
                    "Please select an image."
                );

                this.value = "";

                return;

            }


            const reader =
                new FileReader();

            reader.onload =
                function(){

                    if(coverPreview){

                        coverPreview.src =
                            reader.result;

                    }

                };

            reader.readAsDataURL(file);

        }
    );

}


// ==================================================
// SAVE SETTINGS
// ==================================================

if(saveSettingsBtn){

    saveSettingsBtn.addEventListener(
        "click",
        saveSettings
    );

}


async function saveSettings(){

    if(!currentGroup){

        showMessage(
            "Group information is not loaded.",
            true
        );

        return;

    }


    const name =
        groupNameInput
        ? groupNameInput.value.trim()
        : "";

    const description =
        groupDescriptionInput
        ? groupDescriptionInput.value.trim()
        : "";


    // ==================================================
    // VALIDATION
    // ==================================================

    if(!name){

        showMessage(
            "Group name cannot be empty.",
            true
        );

        return;

    }


    if(name.length < 2){

        showMessage(
            "Group name is too short.",
            true
        );

        return;

    }


    if(name.length > 50){

        showMessage(
            "Group name is too long.",
            true
        );

        return;

    }


    if(description.length > 500){

        showMessage(
            "Description is too long.",
            true
        );

        return;

    }


    // ==================================================
    // DISABLE BUTTON
    // ==================================================

    saveSettingsBtn.disabled =
        true;

    saveSettingsBtn.textContent =
        "Saving...";


    try{

        const formData =
            new FormData();

        formData.append(
            "groupId",
            groupId
        );

        formData.append(
            "username",
            user.username
        );

        formData.append(
            "name",
            name
        );

        formData.append(
            "description",
            description
        );


        // ==================================================
        // AVATAR
        // ==================================================

        if(
            groupAvatarInput &&
            groupAvatarInput.files[0]
        ){

            formData.append(
                "avatar",
                groupAvatarInput.files[0]
            );

        }


        // ==================================================
        // COVER
        // ==================================================

        if(
            groupCoverInput &&
            groupCoverInput.files[0]
        ){

            formData.append(
                "cover",
                groupCoverInput.files[0]
            );

        }


        // ==================================================
        // SEND
        // ==================================================

        const res =
            await fetch(
                "/api/groups/settings",
                {
                    method:"PUT",

                    body:formData
                }
            );


        const data =
            await res.json();


        if(
            !res.ok ||
            !data.success
        ){

            showMessage(
                data.message ||
                "Failed to update group.",
                true
            );

            return;

        }


        // ==================================================
        // SUCCESS
        // ==================================================

        currentGroup =
            data.group ||
            currentGroup;


        showMessage(
            "✅ Group settings updated successfully."
        );


        // ==================================================
        // UPDATE PREVIEWS
        // ==================================================

        if(avatarPreview){

            avatarPreview.src =
                currentGroup.avatar ||
                avatarPreview.src;

        }


        if(coverPreview){

            coverPreview.src =
                currentGroup.cover ||
                coverPreview.src;

        }


    }catch(err){

        console.error(
            "SAVE GROUP SETTINGS ERROR:",
            err
        );

        showMessage(
            "Failed to update group settings.",
            true
        );

    }finally{

        saveSettingsBtn.disabled =
            false;

        saveSettingsBtn.textContent =
            "Save Changes";

    }

}


// ==================================================
// BACK BUTTON
// ==================================================

if(backButton){

    backButton.addEventListener(
        "click",
        function(){

            history.back();

        }
    );

}


// ==================================================
// START
// ==================================================

loadGroup();
