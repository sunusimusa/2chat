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

if (!user || !user.username) {

    alert("Please login first.");

    location.href =
        "/login.html";

}


// ==================================================
// CHECK GROUP ID
// ==================================================

if (!groupId) {

    alert("Group ID is missing.");

    history.back();

}


// ==================================================
// ELEMENTS
// ==================================================

const groupNameInput =
    document.getElementById("groupName");

const groupDescriptionInput =
    document.getElementById("groupDescription");

const avatarInput =
    document.getElementById("avatarInput");

const coverInput =
    document.getElementById("coverInput");

const groupAvatar =
    document.getElementById("groupAvatar");

const groupCover =
    document.getElementById("groupCover");

const previewGroupName =
    document.getElementById("previewGroupName");

const changeAvatarBtn =
    document.getElementById("changeAvatarBtn");

const changeCoverBtn =
    document.getElementById("changeCoverBtn");

const saveSettingsBtn =
    document.getElementById("saveSettingsBtn");

const backButton =
    document.getElementById("backButton");

const settingsMessage =
    document.getElementById("settingsMessage");

const publicGroup =
    document.getElementById("publicGroup");

const privateGroup =
    document.getElementById("privateGroup");

const leaveGroupBtn =
    document.getElementById("leaveGroupBtn");

const deleteGroupBtn =
    document.getElementById("deleteGroupBtn");

const inviteMembersBtn =
    document.getElementById("inviteMembersBtn");


let currentGroup = null;

// ==================================================
// INVITE MEMBERS BUTTON
// ==================================================

if (inviteMembersBtn) {

    inviteMembersBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "/group-invite-members.html?id=" +
                encodeURIComponent(groupId);

        }
    );

}


// ==================================================
// MESSAGE
// ==================================================

function showMessage(
    message,
    isError = false
) {

    if (!settingsMessage) return;

    settingsMessage.textContent =
        message;

    settingsMessage.classList.add("show");

    if (isError) {

        settingsMessage.classList.add("error");

    } else {

        settingsMessage.classList.remove("error");

    }

    setTimeout(() => {

        settingsMessage.classList.remove("show");

    }, 3000);

}


// ==================================================
// LOAD GROUP
// ==================================================

async function loadGroup() {

    try {

        const res =
            await fetch(
                "/api/groups/" + groupId
            );

        const data =
            await res.json();

        if (
            !res.ok ||
            !data.success ||
            !data.group
        ) {

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
        // CHECK OWNER / ADMIN
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


        if (!isOwner && !isAdmin) {

            alert(
                "Only Owner or Admin can access Group Settings."
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
// GROUP PRIVACY
// ==================================================

const publicGroup =
    document.getElementById("publicGroup");

const privateGroup =
    document.getElementById("privateGroup");

if(currentGroup.privacy === "private"){

    if(privateGroup){
        privateGroup.checked = true;
    }

}else{

    if(publicGroup){
        publicGroup.checked = true;
    }

}

        // ==================================================
        // AVATAR
        // ==================================================

        if (groupAvatar) {

            groupAvatar.src =
                currentGroup.avatar &&
                currentGroup.avatar.trim() !== ""
                    ? currentGroup.avatar
                    : "/images/default-group.png";

        }


        // ==================================================
        // COVER
        // ==================================================

        if (groupCover) {

            groupCover.src =
                currentGroup.cover &&
                currentGroup.cover.trim() !== ""
                    ? currentGroup.cover
                    : "/images/default-group-cover.jpg";

        }


        // ==================================================
        // PRIVACY
        // ==================================================

        if (currentGroup.privacy === "private") {

            if (privateGroup) {

                privateGroup.checked = true;

            }

        } else {

            if (publicGroup) {

                publicGroup.checked = true;

            }

        }


    } catch (err) {

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
// CHANGE AVATAR BUTTON
// ==================================================

if (changeAvatarBtn) {

    changeAvatarBtn.addEventListener(
        "click",
        () => {

            if (avatarInput) {

                avatarInput.click();

            }

        }
    );

}


// ==================================================
// CHANGE COVER BUTTON
// ==================================================

if (changeCoverBtn) {

    changeCoverBtn.addEventListener(
        "click",
        () => {

            if (coverInput) {

                coverInput.click();

            }

        }
    );

}


// ==================================================
// AVATAR PREVIEW
// ==================================================

if (avatarInput) {

    avatarInput.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];

            if (!file) return;


            if (
                !file.type.startsWith("image/")
            ) {

                alert(
                    "Please select an image."
                );

                this.value = "";

                return;

            }


            const reader =
                new FileReader();

            reader.onload =
                function () {

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
        function () {

            const file =
                this.files[0];

            if (!file) return;


            if (
                !file.type.startsWith("image/")
            ) {

                alert(
                    "Please select an image."
                );

                this.value = "";

                return;

            }


            const reader =
                new FileReader();

            reader.onload =
                function () {

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
// LIVE GROUP NAME PREVIEW
// ==================================================

if (groupNameInput) {

    groupNameInput.addEventListener(
        "input",
        () => {

            if (previewGroupName) {

                previewGroupName.textContent =
                    groupNameInput.value ||
                    "Group";

            }

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

    const selectedPrivacy =
    document.querySelector(
        'input[name="groupPrivacy"]:checked'
    );

const privacy =
    selectedPrivacy
        ? selectedPrivacy.value
        : "public";

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!name) {

        showMessage(
            "Group name cannot be empty.",
            true
        );

        return;

    }


    if (name.length < 2) {

        showMessage(
            "Group name is too short.",
            true
        );

        return;

    }


    if (name.length > 100) {

        showMessage(
            "Group name is too long.",
            true
        );

        return;

    }


    if (description.length > 500) {

        showMessage(
            "Description is too long.",
            true
        );

        return;

    }


    // ==================================================
    // BUTTON
    // ==================================================

    saveSettingsBtn.disabled = true;

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


        // ==================================================
        // AVATAR
        // ==================================================

        if (
            avatarInput &&
            avatarInput.files &&
            avatarInput.files[0]
        ) {

            formData.append(
                "avatar",
                avatarInput.files[0]
            );

        }


        // ==================================================
        // COVER
        // ==================================================

        if (
            coverInput &&
            coverInput.files &&
            coverInput.files[0]
        ) {

            formData.append(
                "cover",
                coverInput.files[0]
            );

        }


        // ==================================================
        // SEND
        // ==================================================

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


        if (
            !res.ok ||
            !data.success
        ) {

            showMessage(
                data.message ||
                "Failed to update group.",
                true
            );

            return;

        }


        // ==================================================
        // UPDATE CURRENT GROUP
        // ==================================================

        currentGroup =
            data.group ||
            currentGroup;


        // ==================================================
        // UPDATE UI
        // ==================================================

        if (previewGroupName) {

            previewGroupName.textContent =
                currentGroup.name;

        }

        if (groupAvatar) {

            groupAvatar.src =
                currentGroup.avatar;

        }

        if (groupCover) {

            groupCover.src =
                currentGroup.cover;

        }


        showMessage(
            "✅ Group settings updated successfully."
        );


    } catch (err) {

        console.error(
            "SAVE GROUP SETTINGS ERROR:",
            err
        );

        showMessage(
            "Failed to update group settings.",
            true
        );

    } finally {

        saveSettingsBtn.disabled = false;

        saveSettingsBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Changes';

    }

}


// ==================================================
// BACK
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
// LEAVE GROUP
// ==================================================

if (leaveGroupBtn) {

    leaveGroupBtn.addEventListener(
        "click",
        async () => {

            if (
                !confirm(
                    "Are you sure you want to leave this group?"
                )
            ) return;


            try {

                const res =
                    await fetch(
                        "/api/groups/leave",
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                groupId,

                                username:
                                    user.username

                            })

                        }
                    );


                const data =
                    await res.json();


                if (data.success) {

                    alert(
                        "✅ You left the group."
                    );

                    location.href =
                        "/groups.html";

                } else {

                    alert(
                        data.message
                    );

                }

            } catch (err) {

                console.error(err);

                alert(
                    "Network Error"
                );

            }

        }
    );

}


// ==================================================
// DELETE GROUP
// ==================================================

if (deleteGroupBtn) {

    deleteGroupBtn.addEventListener(
        "click",
        async () => {

            if (
                !confirm(
                    "Delete this group permanently?"
                )
            ) return;


            try {

                const res =
                    await fetch(
                        "/api/groups/delete",
                        {

                            method: "DELETE",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                groupId,

                                username:
                                    user.username

                            })

                        }
                    );


                const data =
                    await res.json();


                if (data.success) {

                    alert(
                        "🗑️ Group deleted."
                    );

                    location.href =
                        "/groups.html";

                } else {

                    alert(
                        data.message
                    );

                }

            } catch (err) {

                console.error(err);

                alert(
                    "Network Error"
                );

            }

        }
    );

}

// ==================================================
// INVITE MEMBERS
// ==================================================

if (inviteMembersBtn) {

    inviteMembersBtn.addEventListener(
        "click",
        () => {

            if (!groupId) {

                alert("Group ID is missing.");

                return;

            }

            window.location.href =
                "/group-invitations.html?id=" +
                encodeURIComponent(groupId);

        }
    );

}


// ==================================================
// START
// ==================================================

loadGroup();
