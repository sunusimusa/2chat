/* =========================================================
   2CHAT GROUP PAGE
   ========================================================= */


/* ==========================
USER
========================== */

let user = null;

try {

    user =
        JSON.parse(
            localStorage.getItem("user")
        );

} catch (error) {

    console.error(
        "USER PARSE ERROR:",
        error
    );

    user = null;

}


/* ==========================
GROUP ID
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

const errorBox =
    document.getElementById("errorBox");

const errorMessage =
    document.getElementById("errorMessage");

const groupContent =
    document.getElementById("groupContent");

const authNotice =
    document.getElementById("authNotice");

const groupCover =
    document.getElementById("groupCover");

const groupAvatar =
    document.getElementById("groupAvatar");

const groupName =
    document.getElementById("groupName");

const groupDescription =
    document.getElementById("groupDescription");

const groupPrivacyIcon =
    document.getElementById("groupPrivacyIcon");

const groupPrivacyText =
    document.getElementById("groupPrivacyText");

const memberCount =
    document.getElementById("memberCount");

const groupLinkText =
    document.getElementById("groupLinkText");

const groupOwner =
    document.getElementById("groupOwner");

const adminCount =
    document.getElementById("adminCount");

const createdDate =
    document.getElementById("createdDate");

const membersPreview =
    document.getElementById("membersPreview");

const membersPreviewCount =
    document.getElementById(
        "membersPreviewCount"
    );

const joinGroupBtn =
    document.getElementById(
        "joinGroupBtn"
    );

const joinButtonText =
    document.getElementById(
        "joinButtonText"
    );

const joinMessage =
    document.getElementById(
        "joinMessage"
    );

const copyLinkBtn =
    document.getElementById(
        "copyLinkBtn"
    );

const shareLinkBtn =
    document.getElementById(
        "shareLinkBtn"
    );

const shareTopBtn =
    document.getElementById(
        "shareTopBtn"
    );

const registerBtn =
    document.getElementById(
        "registerBtn"
    );

const loginBtn =
    document.getElementById(
        "loginBtn"
    );

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById(
        "toastMessage"
    );

const toastIcon =
    document.getElementById(
        "toastIcon"
    );


/* ==========================
CURRENT GROUP
========================== */

let currentGroup = null;


/* ==========================
CHECK GROUP ID
========================== */

if (!groupId) {

    showError(
        "No group link was provided."
    );

} else {

    loadGroup();

}


/* =========================================================
LOAD GROUP
========================================================= */

async function loadGroup() {

    showLoading();

    try {

        const res =
            await fetch(
                "/api/groups/" +
                encodeURIComponent(groupId)
            );


        const data =
            await res.json();


        if (!res.ok || !data.success) {

            showError(
                data.message ||
                "Group not found."
            );

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


        showError(
            "Unable to load this group. Please check your internet connection."
        );

    }

}


/* =========================================================
RENDER GROUP
========================================================= */

function renderGroup() {

    if (!currentGroup) {

        showError(
            "Group not found."
        );

        return;

    }


    /* ==========================
    COVER
    ========================== */

    groupCover.src =
        currentGroup.cover &&
        String(
            currentGroup.cover
        ).trim() !== ""

            ? currentGroup.cover

            : "/images/default-group-cover.jpg";


    groupCover.onerror =
        function () {

            this.onerror = null;

            this.src =
                "/images/default-group-cover.jpg";

        };


    /* ==========================
    AVATAR
    ========================== */

    groupAvatar.src =
        currentGroup.avatar &&
        String(
            currentGroup.avatar
        ).trim() !== ""

            ? currentGroup.avatar

            : "/images/default-group.png";


    groupAvatar.onerror =
        function () {

            this.onerror = null;

            this.src =
                "/images/default-group.png";

        };


    /* ==========================
    NAME
    ========================== */

    groupName.innerText =
        currentGroup.name ||
        "Unnamed Group";


    /* ==========================
    DESCRIPTION
    ========================== */

    groupDescription.innerText =
        currentGroup.description ||
        "No description";


    /* ==========================
    MEMBERS
    ========================== */

    const members =
        Array.isArray(
            currentGroup.members
        )

            ? currentGroup.members

            : [];


    memberCount.innerText =
        members.length;


    membersPreviewCount.innerText =
        members.length;


    /* ==========================
    OWNER
    ========================== */

    groupOwner.innerText =
        currentGroup.owner ||
        "Unknown";


    /* ==========================
    ADMINS
    ========================== */

    const admins =
        Array.isArray(
            currentGroup.admins
        )

            ? currentGroup.admins

            : [];


    adminCount.innerText =
        admins.length;


    /* ==========================
    CREATED DATE
    ========================== */

    if (currentGroup.createdAt) {

        const date =
            new Date(
                currentGroup.createdAt
            );


        if (!isNaN(date.getTime())) {

            createdDate.innerText =
                date.toLocaleDateString(
                    "en-US",
                    {
                        year:"numeric",
                        month:"short",
                        day:"numeric"
                    }
                );

        } else {

            createdDate.innerText =
                "Unknown";

        }

    } else {

        createdDate.innerText =
            "Unknown";

    }


    /* ==========================
    PRIVACY
    ========================== */

    renderPrivacy();


    /* ==========================
    GROUP LINK
    ========================== */

    renderGroupLink();


    /* ==========================
    MEMBERS PREVIEW
    ========================== */

    renderMembersPreview();


    /* ==========================
    AUTH / JOIN
    ========================== */

    updateJoinState();


    /* ==========================
    SHOW PAGE
    ========================== */

    loading.style.display =
        "none";

    errorBox.style.display =
        "none";

    groupContent.style.display =
        "block";

}


/* =========================================================
PRIVACY
========================================================= */

function renderPrivacy() {

    if (
        currentGroup.privacy ===
        "private"
    ) {

        groupPrivacyText.innerText =
            "Private Group";


        groupPrivacyIcon.innerHTML =
            `
            <i class="fa-solid fa-lock"></i>
            `;

    } else {

        groupPrivacyText.innerText =
            "Public Group";


        groupPrivacyIcon.innerHTML =
            `
            <i class="fa-solid fa-earth-americas"></i>
            `;

    }

}


/* =========================================================
GROUP LINK
========================================================= */

function getGroupLink() {

    return (
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(
            currentGroup._id
        )
    );

}


function renderGroupLink() {

    const link =
        getGroupLink();


    groupLinkText.innerText =
        link;

}


/* =========================================================
COPY GROUP LINK
========================================================= */

copyLinkBtn.addEventListener(
    "click",
    async function () {

        if (!currentGroup) {

            return;

        }


        const link =
            getGroupLink();


        try {

            await navigator.clipboard.writeText(
                link
            );


            showToast(
                "Group link copied!",
                "success"
            );


        } catch (error) {

            console.error(
                "COPY ERROR:",
                error
            );


            /* FALLBACK */

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                link;

            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            document.body.appendChild(
                textarea
            );

            textarea.select();

            try {

                document.execCommand(
                    "copy"
                );

                showToast(
                    "Group link copied!",
                    "success"
                );

            } catch (err) {

                showToast(
                    "Could not copy the link.",
                    "error"
                );

            }

            textarea.remove();

        }

    }
);


/* =========================================================
SHARE GROUP
========================================================= */

shareLinkBtn.addEventListener(
    "click",
    shareGroup
);


shareTopBtn.addEventListener(
    "click",
    shareGroup
);


async function shareGroup() {

    if (!currentGroup) {

        return;

    }


    const link =
        getGroupLink();


    const shareData = {

        title:
            currentGroup.name ||
            "2Chat Group",

        text:
            "Join this group on 2Chat",

        url:
            link

    };


    /* ==========================
    NATIVE SHARE
    ========================== */

    if (
        navigator.share
    ) {

        try {

            await navigator.share(
                shareData
            );

            return;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                return;

            }

        }

    }


    /* ==========================
    FALLBACK COPY
    ========================== */

    try {

        await navigator.clipboard.writeText(
            link
        );


        showToast(
            "Group link copied. You can now share it.",
            "success"
        );


    } catch (error) {

        showToast(
            "Unable to share group link.",
            "error"
        );

    }

}


/* =========================================================
AUTH CHECK
========================================================= */

function isLoggedIn() {

    return (
        user &&
        user.username
    );

}


/* =========================================================
UPDATE JOIN STATE
========================================================= */

function updateJoinState() {

    if (!currentGroup) {

        return;

    }


    /* ==========================
    NOT LOGGED IN
    ========================== */

    if (!isLoggedIn()) {

        joinGroupBtn.style.display =
            "none";

        authNotice.style.display =
            "block";

        return;

    }


    /* ==========================
    LOGGED IN
    ========================== */

    authNotice.style.display =
        "none";

    joinGroupBtn.style.display =
        "block";


    const username =
        String(
            user.username
        ).trim();


    const members =
        Array.isArray(
            currentGroup.members
        )

            ? currentGroup.members

            : [];


    /* ==========================
    ALREADY MEMBER
    ========================== */

    if (
        members.includes(
            username
        )
    ) {

        joinGroupBtn.disabled =
            false;

        joinGroupBtn.classList.add(
            "joined"
        );

        joinGroupBtn.classList.remove(
            "private"
        );

        joinButtonText.innerText =
            "Open Group";


        joinMessage.innerText =
            "You are already a member of this group.";

        return;

    }


    /* ==========================
    PRIVATE GROUP
    ========================== */

    if (
        currentGroup.privacy ===
        "private"
    ) {

        joinGroupBtn.disabled =
            true;

        joinGroupBtn.classList.remove(
            "joined"
        );

        joinGroupBtn.classList.add(
            "private"
        );

        joinButtonText.innerText =
            "Private Group";


        joinMessage.innerText =
            "This is a private group. You need an invitation to join.";

        return;

    }


    /* ==========================
    PUBLIC GROUP
    ========================== */

    joinGroupBtn.disabled =
        false;

    joinGroupBtn.classList.remove(
        "joined",
        "private"
    );

    joinButtonText.innerText =
        "Join Group";


    joinMessage.innerText =
        "Anyone can join this public group.";

}


/* =========================================================
JOIN GROUP
========================================================= */

joinGroupBtn.addEventListener(
    "click",
    handleJoinGroup
);


async function handleJoinGroup() {

    if (!currentGroup) {

        return;

    }


    if (!isLoggedIn()) {

        showAuthNotice();

        return;

    }


    const username =
        String(
            user.username
        ).trim();


    const members =
        Array.isArray(
            currentGroup.members
        )

            ? currentGroup.members

            : [];


    /* ==========================
    ALREADY MEMBER
    ========================== */

    if (
        members.includes(
            username
        )
    ) {

        openGroup();

        return;

    }


    /* ==========================
    PRIVATE GROUP
    ========================== */

    if (
        currentGroup.privacy ===
        "private"
    ) {

        showToast(
            "This is a private group. You need an invitation.",
            "error"
        );

        return;

    }


    /* ==========================
    DISABLE BUTTON
    ========================== */

    joinGroupBtn.disabled =
        true;

    joinButtonText.innerText =
        "Joining...";


    try {

        const res =
            await fetch(
                "/api/groups/join",
                {

                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            groupId:
                                currentGroup._id,

                            username:
                                username

                        })

                }
            );


        const data =
            await res.json();


        if (!res.ok || !data.success) {

            showToast(
                data.message ||
                "Unable to join group.",
                "error"
            );


            updateJoinState();

            return;

        }


        /* ==========================
        UPDATE LOCAL GROUP
        ========================== */

        if (data.group) {

            currentGroup =
                data.group;

        } else {

            currentGroup.members.push(
                username
            );

        }


        memberCount.innerText =
            currentGroup.members.length;


        membersPreviewCount.innerText =
            currentGroup.members.length;


        renderMembersPreview();


        joinGroupBtn.classList.remove(
            "private"
        );

        joinGroupBtn.classList.add(
            "joined"
        );

        joinButtonText.innerText =
            "Open Group";


        joinMessage.innerText =
            "You joined this group successfully.";


        showToast(
            "You joined the group!",
            "success"
        );


    } catch (error) {

        console.error(
            "JOIN GROUP ERROR:",
            error
        );


        showToast(
            "Network error. Please try again.",
            "error"
        );


        updateJoinState();

    }

}


/* =========================================================
OPEN GROUP
========================================================= */

function openGroup() {

    /*
       Wannan shi ne inda daga baya
       za mu kai user group chat page.
    */

    window.location.href =
        "/group-chat.html?id=" +
        encodeURIComponent(
            currentGroup._id
        );

}


/* =========================================================
MEMBERS PREVIEW
========================================================= */

function renderMembersPreview() {

    if (!membersPreview) {

        return;

    }


    membersPreview.innerHTML =
        "";


    const members =
        Array.isArray(
            currentGroup.members
        )

            ? currentGroup.members

            : [];


    const preview =
        members.slice(
            0,
            8
        );


    preview.forEach(
        function(member) {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "member-preview";


            const img =
                document.createElement(
                    "img"
                );

            img.src =
                "/images/default-group.png";

            img.alt =
                member;


            img.onerror =
                function() {

                    this.onerror =
                        null;

                    this.src =
                        "/images/default-group.png";

                };


            const span =
                document.createElement(
                    "span"
                );

            span.innerText =
                member;


            div.appendChild(
                img
            );

            div.appendChild(
                span
            );


            membersPreview.appendChild(
                div
            );

        }
    );


    /* ==========================
    MORE MEMBERS
    ========================== */

    if (
        members.length > 8
    ) {

        const more =
            document.createElement(
                "div"
            );

        more.className =
            "more-members";


        more.innerText =
            "+" +
            (
                members.length -
                8
            ) +
            " more";


        membersPreview.appendChild(
            more
        );

    }


    /* ==========================
    NO MEMBERS
    ========================== */

    if (
        members.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "more-members";

        empty.innerText =
            "No members yet";

        membersPreview.appendChild(
            empty
        );

    }

}


/* =========================================================
AUTH NOTICE
========================================================= */

function showAuthNotice() {

    if (!authNotice) {

        return;

    }


    authNotice.style.display =
        "block";


    authNotice.scrollIntoView({

        behavior:"smooth",

        block:"center"

    });

}


/* =========================================================
REGISTER
========================================================= */

registerBtn.addEventListener(
    "click",
    function() {

        const returnUrl =
            window.location.href;


        localStorage.setItem(
            "groupReturnUrl",
            returnUrl
        );


        window.location.href =
            "/register.html";

    }
);


/* =========================================================
LOGIN
========================================================= */

loginBtn.addEventListener(
    "click",
    function() {

        const returnUrl =
            window.location.href;


        localStorage.setItem(
            "groupReturnUrl",
            returnUrl
        );


        window.location.href =
            "/login.html";

    }
);


/* =========================================================
LOADING
========================================================= */

function showLoading() {

    loading.style.display =
        "flex";

    errorBox.style.display =
        "none";

    groupContent.style.display =
        "none";

    authNotice.style.display =
        "none";

}


/* =========================================================
ERROR
========================================================= */

function showError(message) {

    loading.style.display =
        "none";

    groupContent.style.display =
        "none";

    authNotice.style.display =
        "none";

    errorBox.style.display =
        "block";


    errorMessage.innerText =
        message ||
        "Group not found.";

}


/* =========================================================
TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    if (!toast) {

        return;

    }


    clearTimeout(
        toastTimer
    );


    toastMessage.innerText =
        message;


    if (
        type === "error"
    ) {

        toastIcon.className =
            "fa-solid fa-circle-exclamation";

        toastIcon.style.color =
            "#f44336";

    } else {

        toastIcon.className =
            "fa-solid fa-check";

        toastIcon.style.color =
            "#4caf50";

    }


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.visibilityState ===
            "visible"
        ) {

            /*
               Idan user ya dawo daga
               register/login, mu sake
               duba user.
            */

            try {

                user =
                    JSON.parse(
                        localStorage.getItem(
                            "user"
                        )
                    );

            } catch (error) {

                user = null;

            }


            if (currentGroup) {

                updateJoinState();

            }

        }

    }
);
