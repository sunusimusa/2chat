// ==================================================
// 2CHAT GROUP SETTINGS
// ==================================================

const user = JSON.parse(
    localStorage.getItem("user")
);


// ==================================================
// CHECK LOGIN
// ==================================================

if (!user || !user.username) {

    alert("Please login first.");

    location.href = "/login.html";

    throw new Error("User not logged in.");

}


// ==================================================
// GET GROUP ID
// ==================================================

const params =
    new URLSearchParams(
        window.location.search
    );

// Support both:
// group-settings.html?id=...
// group-settings.html?groupId=...

const groupId =
    params.get("id") ||
    params.get("groupId");


if (!groupId) {

    alert("Group ID is missing.");

    history.back();

    throw new Error("Group ID missing.");

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

const groupAvatar =
    document.getElementById(
        "groupAvatar"
    );

const groupCover =
    document.getElementById(
        "groupCover"
    );

const avatarInput =
    document.getElementById(
        "avatarInput"
    );

const coverInput =
    document.getElementById(
        "coverInput"
    );

const changeAvatarBtn =
    document.getElementById(
        "changeAvatarBtn"
    );

const changeCoverBtn =
    document.getElementById(
        "changeCoverBtn"
    );

const previewGroupName =
    document.getElementById(
        "previewGroupName"
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

const publicGroup =
    document.getElementById(
        "publicGroup"
    );

const privateGroup =
    document.getElementById(
        "privateGroup"
    );

const leaveGroupBtn =
    document.getElementById(
        "leaveGroupBtn"
    );

const deleteGroupBtn =
    document.getElementById(
        "deleteGroupBtn"
    );


let currentGroup = null;


// ==================================================
// MESSAGE
// ==================================================

function showMessage(
    message,
    isError = false
) {

    if (!settingsMessage) {

        alert(message);

        return;

    }

    settingsMessage.textContent =
        message;

    settingsMessage.style.display =
        "block";

    settingsMessage.classList.toggle(
        "error",
        isError
    );

    setTimeout(() => {

        settingsMessage.style.display =
            "none";

    }, 3000);

}


// ==================================================
// LOAD GROUP
// ==================================================

async function loadGroup() {

    try {

        console.log(
            "Loading group:",
            groupId
        );


        const res =
            await fetch(
                "/api/groups/" +
                encodeURIComponent(groupId)
            );


        console.log(
            "GET GROUP STATUS:",
            res.status
        );


        const data =
            await res.json();


        console.log(
            "GET GROUP RESPONSE:",
            data
        );


        if (
            !res.ok ||
            !data.success ||
            !data.group
        ) {

            throw new Error(
                data.message ||
                "Group not found."
            );

        }


        currentGroup =
            data.group;


        // ==================================================
        // CHECK OWNER
        // ==================================================

        if (
            currentGroup.owner !==
            user.username
        ) {

            alert(
                "Only the group owner can access Group Settings."
            );

            history.back();

            return;

        }


        // ==================================================
        // GROUP NAME
        // ==================================================

        if (groupNameInput) {

            groupNameInput.value =
                currentGroup.name || "";

        }


        if (previewGroupName) {

            previewGroupName.textContent =
                currentGroup.name ||
                "Group";

        }


        // ==================================================
        // DESCRIPTION
        // ==================================================

        if (groupDescriptionInput) {

            groupDescriptionInput.value =
                currentGroup.description || "";

        }


        // ==================================================
        // AVATAR
        // ==================================================

        if (groupAvatar) {

            groupAvatar.src =
                currentGroup.avatar ||
                "/images/default-group.png";

        }


        // ==================================================
        // COVER
        // ==================================================

        if (groupCover) {

            groupCover.src =
                currentGroup.cover ||
                "/images/default-group-cover.jpg";

        }


        // ==================================================
        // PRIVACY
        // ==================================================

        if (
            currentGroup.privacy ===
            "private"
        ) {

            if (privateGroup) {

                privateGroup.checked =
                    true;

            }

        } else {

            if (publicGroup) {

                publicGroup.checked =
                    true;

            }

        }


        console.log(
            "GROUP SETTINGS LOADED SUCCESSFULLY"
        );


    } catch (error) {

        console.error(
            "LOAD GROUP SETTINGS ERROR:",
            error
        );


        if (previewGroupName) {

            previewGroupName.textContent =
                "Failed to load";

        }


        showMessage(
            error.message ||
            "Failed to load group settings.",
            true
        );

    }

}


// ==================================================
// CHANGE AVATAR BUTTON
// ==================================================

if (changeAvatarBtn && avatarInput) {

    changeAvatarBtn.addEventListener(
        "click",
        () => {

            avatarInput.click();

        }
    );

}


// ==================================================
// CHANGE COVER BUTTON
// ==================================================

if (changeCoverBtn && coverInput) {

    changeCoverBtn.addEventListener(
        "click",
        () => {

            coverInput.click();

        }
    );

}


// ==================================================
// AVATAR PREVIEW
// ==================================================

if (avatarInput) {

    avatarInput.addEventListener(
        "change",
        () => {

            const file =
                avatarInput.files[0];

            if (!file) {

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image."
                );

                avatarInput.value = "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload = () => {

                if (groupAvatar) {

                    groupAvatar.src =
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

if (coverInput) {

    coverInput.addEventListener(
        "change",
        () => {

            const file =
                coverInput.files[0];

            if (!file) {

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image."
                );

                coverInput.value = "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload = () => {

                if (groupCover) {

                    groupCover.src =
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

if (saveSettingsBtn) {

    saveSettingsBtn.addEventListener(
        "click",
        saveSettings
    );

}


async function saveSettings() {

    if (!currentGroup) {

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


    const privacy =
        privateGroup &&
        privateGroup.checked
            ? "private"
            : "public";


    if (!name) {

        showMessage(
            "Group name cannot be empty.",
            true
        );

        return;

    }


    saveSettingsBtn.disabled =
        true;

    saveSettingsBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';


    try {

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


        formData.append(
            "privacy",
            privacy
        );


        // Avatar

        if (
            avatarInput &&
            avatarInput.files[0]
        ) {

            formData.append(
                "avatar",
                avatarInput.files[0]
            );

        }


        // Cover

        if (
            coverInput &&
            coverInput.files[0]
        ) {

            formData.append(
                "cover",
                coverInput.files[0]
            );

        }


        const res =
            await fetch(
                "/api/groups/settings",
                {

                    method: "PUT",

                    body: formData

                }
            );


        const data =
            await res.json();


        console.log(
            "UPDATE GROUP RESPONSE:",
            data
        );


        if (
            !res.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to update group settings."
            );

        }


        currentGroup =
            data.group ||
            currentGroup;


        showMessage(
            "✅ Group settings updated successfully."
        );


        // Update preview name

        if (previewGroupName) {

            previewGroupName.textContent =
                currentGroup.name;

        }


        // Update avatar

        if (
            groupAvatar &&
            currentGroup.avatar
        ) {

            groupAvatar.src =
                currentGroup.avatar +
                "?t=" +
                Date.now();

        }


        // Update cover

        if (
            groupCover &&
            currentGroup.cover
        ) {

            groupCover.src =
                currentGroup.cover +
                "?t=" +
                Date.now();

        }


    } catch (error) {

        console.error(
            "SAVE GROUP SETTINGS ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to update group settings.",
            true
        );


    } finally {

        saveSettingsBtn.disabled =
            false;

        saveSettingsBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Changes';

    }

}


// ==================================================
// BACK BUTTON
// ==================================================

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


// ==================================================
// START
// ==================================================

loadGroup();
