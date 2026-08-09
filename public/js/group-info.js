/* ==================================================
   2CHAT GROUP INFO
================================================== */

const user =
    JSON.parse(localStorage.getItem("user"));

const params =
    new URLSearchParams(window.location.search);

const groupId =
    params.get("id");

let currentGroup = null;


/* ==================================================
   ELEMENTS
================================================== */

const groupName =
    document.getElementById("groupName");

const groupDescription =
    document.getElementById("groupDescription");

const groupAvatar =
    document.getElementById("groupAvatar");

const groupCover =
    document.getElementById("groupCover");

const memberCount =
    document.getElementById("memberCount");

const adminCount =
    document.getElementById("adminCount");

const membersList =
    document.getElementById("membersList");

const deleteBtn =
    document.getElementById("deleteGroupBtn");

const addMemberBtn =
    document.getElementById("addMemberBtn");

const adminManagementBtn =
    document.getElementById("adminManagementBtn");

const groupSettingsBtn =
    document.getElementById("groupSettingsBtn");

const leaveGroupBtn =
    document.getElementById("leaveGroupBtn");

const groupLinkText =
    document.getElementById("groupLinkText");

const copyGroupLinkBtn =
    document.getElementById("copyGroupLinkBtn");

const shareGroupLinkBtn =
    document.getElementById("shareGroupLinkBtn");


/* ==================================================
   CHECK GROUP ID
================================================== */

if (!groupId) {

    alert("Group ID is missing.");

    window.location.href =
        "/groups.html";

}


/* ==================================================
   LOAD GROUP
================================================== */

loadGroup();


async function loadGroup() {

    try {

        const res =
            await fetch(
                "/api/groups/" +
                encodeURIComponent(groupId)
            );

        const data =
            await res.json();


        if (!data.success) {

            alert(
                data.message ||
                "Group not found."
            );

            history.back();

            return;

        }


        currentGroup =
            data.group;


        renderGroup();


    } catch (error) {

        console.error(
            "LOAD GROUP ERROR:",
            error
        );

        alert(
            "Unable to load group."
        );

    }

}


/* ==================================================
   RENDER GROUP
================================================== */

function renderGroup() {

    if (!currentGroup) return;


    /* ==========================
       NAME
    ========================== */

    groupName.innerText =
        currentGroup.name || "Group";


    /* ==========================
       DESCRIPTION
    ========================== */

    groupDescription.innerText =
        currentGroup.description ||
        "No description";


    /* ==========================
       AVATAR
    ========================== */

    groupAvatar.src =
        currentGroup.avatar &&
        currentGroup.avatar.trim() !== ""

        ? currentGroup.avatar

        : "/images/default-group.png";


    /* ==========================
       COVER
    ========================== */

    groupCover.src =
        currentGroup.cover &&
        currentGroup.cover.trim() !== ""

        ? currentGroup.cover

        : "/images/default-group-cover.jpg";


    /* ==========================
       STATS
    ========================== */

    const members =
        Array.isArray(currentGroup.members)
            ? currentGroup.members
            : [];

    const admins =
        Array.isArray(currentGroup.admins)
            ? currentGroup.admins
            : [];


    memberCount.innerText =
        members.length;


    adminCount.innerText =
        admins.length;


    /* ==========================
       MEMBERS
    ========================== */

    renderMembers();


    /* ==========================
       GROUP LINK
    ========================== */

    renderGroupLink();


    /* ==========================
       PERMISSIONS
    ========================== */

    updatePermissions();

}


/* ==================================================
   RENDER MEMBERS
================================================== */

function renderMembers() {

    membersList.innerHTML = "";


    const members =
        Array.isArray(currentGroup.members)
            ? currentGroup.members
            : [];


    if (members.length === 0) {

        membersList.innerHTML = `

            <p style="
                text-align:center;
                color:#777;
                padding:20px;
            ">
                No members found.
            </p>

        `;

        return;

    }


    members.forEach(member => {

        const isOwner =
            member === currentGroup.owner;


        const isAdmin =
            Array.isArray(currentGroup.admins) &&
            currentGroup.admins.includes(member);


        let role =
            "Member";


        if (isOwner) {

            role =
                "Owner 👑";

        } else if (isAdmin) {

            role =
                "Admin ⭐";

        }


        const card =
            document.createElement("div");


        card.className =
            "member-card";


        card.innerHTML = `

            <img
                src="/images/default-group.png"
                alt="Member"
            >

            <div class="member-info">

                <div class="member-name">
                    ${escapeHTML(member)}
                </div>

                <div class="member-role">
                    ${role}
                </div>

            </div>

        `;


        membersList.appendChild(card);

    });

}


/* ==================================================
   GROUP LINK
================================================== */

function getGroupLink() {

    return (
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(groupId)
    );

}


function renderGroupLink() {

    if (!groupLinkText) return;


    const link =
        getGroupLink();


    groupLinkText.innerText =
        link;

}


/* ==================================================
   COPY GROUP LINK
================================================== */

if (copyGroupLinkBtn) {

    copyGroupLinkBtn.addEventListener(
        "click",
        copyGroupLink
    );

}


async function copyGroupLink() {

    const link =
        getGroupLink();


    try {

        await navigator.clipboard.writeText(
            link
        );


        alert(
            "✅ Group link copied."
        );


    } catch (error) {

        console.error(
            "COPY LINK ERROR:",
            error
        );


        /* fallback */

        const input =
            document.createElement("input");

        input.value =
            link;

        document.body.appendChild(
            input
        );

        input.select();

        document.execCommand(
            "copy"
        );

        input.remove();


        alert(
            "✅ Group link copied."
        );

    }

}


/* ==================================================
   SHARE GROUP LINK
================================================== */

if (shareGroupLinkBtn) {

    shareGroupLinkBtn.addEventListener(
        "click",
        shareGroupLink
    );

}


async function shareGroupLink() {

    const link =
        getGroupLink();


    const shareData = {

        title:
            currentGroup.name ||
            "2Chat Group",

        text:
            "Join my group on 2Chat.",

        url:
            link

    };


    try {

        if (
            navigator.share
        ) {

            await navigator.share(
                shareData
            );

            return;

        }


        await navigator.clipboard.writeText(
            link
        );


        alert(
            "✅ Group link copied. You can now share it."
        );


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            return;

        }

        console.error(
            "SHARE GROUP ERROR:",
            error
        );

    }

}


/* ==================================================
   PERMISSIONS
================================================== */

function updatePermissions() {

    if (!currentGroup) return;


    const username =
        user &&
        user.username
            ? user.username
            : "";


    const isOwner =
        username ===
        currentGroup.owner;


    const isAdmin =
        Array.isArray(currentGroup.admins) &&
        currentGroup.admins.includes(
            username
        );


    /* ==========================
       DELETE
    ========================== */

    if (deleteBtn) {

        deleteBtn.style.display =
            isOwner
                ? "block"
                : "none";

    }


    /* ==========================
       ADD MEMBER
    ========================== */

    if (addMemberBtn) {

        addMemberBtn.style.display =
            (isOwner || isAdmin)
                ? "block"
                : "none";

    }


    /* ==========================
       ADMIN MANAGEMENT
    ========================== */

    if (adminManagementBtn) {

        adminManagementBtn.style.display =
            isOwner
                ? "block"
                : "none";

    }


    /* ==========================
       GROUP SETTINGS
    ========================== */

    if (groupSettingsBtn) {

        groupSettingsBtn.style.display =
            isOwner
                ? "block"
                : "none";

    }

}


/* ==================================================
   ADD MEMBER
================================================== */

if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        addMember
    );

}


async function addMember() {

    if (!currentGroup) return;


    if (!user) {

        alert(
            "Please login first."
        );

        window.location.href =
            "/login.html";

        return;

    }


    const isOwner =
        user.username ===
        currentGroup.owner;


    const isAdmin =
        currentGroup.admins &&
        currentGroup.admins.includes(
            user.username
        );


    if (!isOwner && !isAdmin) {

        alert(
            "Only Owner or Admin can add members."
        );

        return;

    }


    const member =
        prompt(
            "Enter username to add:"
        );


    if (!member) return;


    const username =
        member.trim();


    if (!username) return;


    try {

        const res =
            await fetch(
                "/api/groups/add-member",
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        groupId,

                        username:
                            user.username,

                        member:
                            username

                    })

                }
            );


        const data =
            await res.json();


        if (data.success) {

            alert(
                "✅ Member added successfully."
            );


            currentGroup =
                data.group;


            renderGroup();


        } else {

            alert(
                data.message ||
                "Failed to add member."
            );

        }


    } catch (error) {

        console.error(
            "ADD MEMBER ERROR:",
            error
        );

        alert(
            "Network error."
        );

    }

}


/* ==================================================
   ADMIN MANAGEMENT
================================================== */

if (adminManagementBtn) {

    adminManagementBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "/group-admins.html?id=" +
                encodeURIComponent(groupId);

        }
    );

}


/* ==================================================
   GROUP SETTINGS
================================================== */

if (groupSettingsBtn) {

    groupSettingsBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "/group-settings.html?id=" +
                encodeURIComponent(groupId);

        }
    );

}


/* ==================================================
   LEAVE GROUP
================================================== */

if (leaveGroupBtn) {

    leaveGroupBtn.addEventListener(
        "click",
        leaveGroup
    );

}


async function leaveGroup() {

    if (!user) {

        alert(
            "Please login first."
        );

        window.location.href =
            "/login.html";

        return;

    }


    if (
        user.username ===
        currentGroup.owner
    ) {

        alert(
            "The group owner cannot leave the group. Transfer ownership or delete the group."
        );

        return;

    }


    const confirmLeave =
        confirm(
            "Are you sure you want to leave this group?"
        );


    if (!confirmLeave) return;


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

/* Update local group immediately */
currentGroup.members =
    currentGroup.members.filter(
        member =>
            member !== user.username
    );

currentGroup.memberCount =
    currentGroup.members.length;

/* Remove user from admins too, if necessary */
currentGroup.admins =
    (currentGroup.admins || []).filter(
        admin =>
            admin !== user.username
    );

/* Refresh UI immediately */
renderGroup();

        } else {

            alert(
                data.message ||
                "Unable to leave group."
            );

        }


    } catch (error) {

        console.error(
            "LEAVE GROUP ERROR:",
            error
        );

        alert(
            "Network error."
        );

    }

}


/* ==================================================
   DELETE GROUP
================================================== */

if (deleteBtn) {

    deleteBtn.addEventListener(
        "click",
        deleteGroup
    );

}


async function deleteGroup() {

    if (!user || !currentGroup) return;


    if (
        user.username !==
        currentGroup.owner
    ) {

        alert(
            "Only the group owner can delete this group."
        );

        return;

    }


    const confirmed =
        confirm(
            "⚠️ Delete this group permanently?"
        );


    if (!confirmed) return;


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
                "🗑️ Group deleted successfully."
            );


            window.location.href =
                "/groups.html";


        } else {

            alert(
                data.message ||
                "Failed to delete group."
            );

        }


    } catch (error) {

        console.error(
            "DELETE GROUP ERROR:",
            error
        );

        alert(
            "Network error."
        );

    }

}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
