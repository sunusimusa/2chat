/* ==================================================
2CHAT GROUP PAGE
GROUP LINK
JOIN
REGISTER REDIRECT
================================================== */


/* ==========================
GET USER
========================== */

const user =
    JSON.parse(
        localStorage.getItem("user")
    );


/* ==========================
GET GROUP ID
========================== */

const params =
    new URLSearchParams(
        window.location.search
    );

const groupId =
    params.get("id");


/* ==========================
ELEMENTS
========================== */

const loading =
    document.getElementById("loading");

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

const privacyText =
    document.getElementById("privacyText");

const groupLink =
    document.getElementById("groupLink");

const joinGroupBtn =
    document.getElementById("joinGroupBtn");

const joinSection =
    document.getElementById("joinSection");

const openGroupSection =
    document.getElementById("openGroupSection");

const openGroupBtn =
    document.getElementById("openGroupBtn");

const copyLinkBtn =
    document.getElementById("copyLinkBtn");

const shareBtn =
    document.getElementById("shareBtn");

const groupMessage =
    document.getElementById("groupMessage");


/* ==========================
CURRENT GROUP
========================== */

let currentGroup = null;


/* ==================================================
CHECK GROUP ID
================================================== */

if (!groupId) {

    showMessage(
        "Invalid group link.",
        "error"
    );

    loading.style.display = "none";

} else {

    loadGroup();

}


/* ==================================================
LOAD GROUP
================================================== */

async function loadGroup() {

    try {

        loading.style.display = "flex";


        const res =
            await fetch(
                "/api/groups/" +
                encodeURIComponent(groupId)
            );


        const data =
            await res.json();


        if (!data.success) {

            loading.style.display = "none";

            showMessage(
                data.message ||
                "Group not found.",
                "error"
            );

            joinSection.style.display = "none";

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

        showMessage(
            "Unable to load group.",
            "error"
        );

    } finally {

        loading.style.display = "none";

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
        currentGroup.name ||
        "2Chat Group";


    /* ==========================
    DESCRIPTION
    ========================== */

    groupDescription.innerText =
        currentGroup.description ||
        "No group description.";


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
    MEMBERS
    ========================== */

    memberCount.innerText =
        currentGroup.members
            ? currentGroup.members.length
            : 0;


    /* ==========================
    PRIVACY
    ========================== */

    if (
        currentGroup.privacy ===
        "private"
    ) {

        privacyText.innerText =
            "Private";

    } else {

        privacyText.innerText =
            "Public";

    }


    /* ==========================
    GROUP LINK
    ========================== */

    const link =
        createGroupLink();


    groupLink.innerText =
        link;


    /* ==========================
    CHECK USER
    ========================== */

    updateUserState();

}


/* ==================================================
CREATE SHAREABLE GROUP LINK
================================================== */

function createGroupLink() {

    return (
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(groupId)
    );

}


/* ==================================================
UPDATE USER STATE
================================================== */

function updateUserState() {

    /* ==========================
    USER NOT LOGGED IN
    ========================== */

    if (!user || !user.username) {

        joinSection.style.display =
            "block";

        openGroupSection.style.display =
            "none";

        joinGroupBtn.innerHTML = `

            <i class="fa-solid fa-user-plus"></i>

            Join Group

        `;

        return;

    }


    /* ==========================
    CHECK MEMBERSHIP
    ========================== */

    const isMember =
        currentGroup.members &&
        currentGroup.members.includes(
            user.username
        );


    if (isMember) {

        joinSection.style.display =
            "none";

        openGroupSection.style.display =
            "block";

    } else {

        joinSection.style.display =
            "block";

        openGroupSection.style.display =
            "none";

        joinGroupBtn.innerHTML = `

            <i class="fa-solid fa-user-plus"></i>

            Join Group

        `;

    }

}


/* ==================================================
JOIN GROUP
================================================== */

joinGroupBtn.addEventListener(
    "click",
    joinGroup
);


async function joinGroup() {

    /* ==================================================
    USER NOT REGISTERED / NOT LOGGED IN

    SAVE GROUP LINK
    THEN SEND USER TO REGISTER
    ================================================== */

    if (!user || !user.username) {

        const returnUrl =
            window.location.href;


        localStorage.setItem(
            "pendingGroupJoin",
            returnUrl
        );


        window.location.href =
            "/register.html";


        return;

    }


    /* ==========================
    ALREADY MEMBER
    ========================== */

    if (
        currentGroup.members &&
        currentGroup.members.includes(
            user.username
        )
    ) {

        openGroup();

        return;

    }


    /* ==========================
    JOIN
    ========================== */

    joinGroupBtn.disabled = true;

    joinGroupBtn.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Joining...

    `;


    try {

        const res =
            await fetch(
                "/api/groups/join",
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            groupId:
                                groupId,

                            username:
                                user.username

                        })

                }
            );


        const data =
            await res.json();


        /* ==========================
        SUCCESS
        ========================== */

        if (data.success) {

            currentGroup =
                data.group;


            showMessage(
                "✅ You joined the group successfully.",
                "success"
            );


            updateUserState();


            /*
            Ƙaramin delay domin
            user ya ga success message
            */

            setTimeout(
                () => {

                    openGroup();

                },
                700
            );


            return;

        }


        /* ==========================
        PRIVATE GROUP
        ========================== */

        if (data.private) {

            showMessage(
                "🔒 This is a private group. You need an invitation to join.",
                "error"
            );


            resetJoinButton();

            return;

        }


        /* ==========================
        ERROR
        ========================== */

        showMessage(
            data.message ||
            "Unable to join group.",
            "error"
        );


        resetJoinButton();


    } catch (error) {

        console.error(
            "JOIN GROUP ERROR:",
            error
        );


        showMessage(
            "Network error. Please try again.",
            "error"
        );


        resetJoinButton();

    }

}


/* ==================================================
OPEN GROUP
================================================== */

openGroupBtn.addEventListener(
    "click",
    openGroup
);


function openGroup() {

    /*
    Wannan route ɗin ne za mu yi amfani da shi
    idan group chat ɗinka yana da:
    
    /group-chat.html?id=GROUP_ID
    */

    window.location.href =
        "/group-chat.html?id=" +
        encodeURIComponent(groupId);

}


/* ==================================================
COPY GROUP LINK
================================================== */

copyLinkBtn.addEventListener(
    "click",
    copyGroupLink
);


async function copyGroupLink() {

    const link =
        createGroupLink();


    try {

        await navigator.clipboard.writeText(
            link
        );


        showMessage(
            "🔗 Group link copied.",
            "success"
        );


    } catch (error) {

        /*
        FALLBACK
        */

        const textarea =
            document.createElement("textarea");

        textarea.value =
            link;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();


        showMessage(
            "🔗 Group link copied.",
            "success"
        );

    }

}


/* ==================================================
SHARE GROUP
================================================== */

shareBtn.addEventListener(
    "click",
    shareGroup
);


async function shareGroup() {

    const link =
        createGroupLink();


    const text =
        "Join my group on 2Chat: " +
        currentGroup.name;


    /* ==========================
    NATIVE SHARE
    ========================== */

    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    currentGroup.name,

                text:
                    text,

                url:
                    link

            });

            return;

        } catch (error) {

            /*
            User cancelled share.
            */

            console.log(
                "Share cancelled."
            );

        }

    }


    /* ==========================
    FALLBACK COPY
    ========================== */

    await copyGroupLink();

}


/* ==================================================
SHOW MESSAGE
================================================== */

function showMessage(
    message,
    type
) {

    groupMessage.innerText =
        message;


    groupMessage.className =
        "group-message " +
        type;


    groupMessage.style.display =
        "block";


    setTimeout(
        () => {

            groupMessage.style.display =
                "none";

        },
        3500
    );

}


/* ==================================================
RESET JOIN BUTTON
================================================== */

function resetJoinButton() {

    joinGroupBtn.disabled =
        false;


    joinGroupBtn.innerHTML = `

        <i class="fa-solid fa-user-plus"></i>

        Join Group

    `;

}


/* ==================================================
REGISTER RETURN SYSTEM
================================================== */

/*
    Bayan register ya gama,
    register.js zai duba wannan:

    localStorage.pendingGroupJoin

    sannan ya mayar da user
    zuwa group link ɗin da ya fara.
*/


console.log(
    "2Chat Group ID:",
    groupId
);
