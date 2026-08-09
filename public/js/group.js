/* ==================================================
   2CHAT GROUP SYSTEM
   group.html
================================================== */


const params =
    new URLSearchParams(window.location.search);


/* ==================================================
   GET INVITE CODE
================================================== */

const inviteCode =
    params.get("invite");


/* ==================================================
   GET GROUP ID
   Wannan yana taimakawa idan an bude group
   kai tsaye daga groupId.
================================================== */

const groupId =
    params.get("id");


/* ==================================================
   USER
================================================== */

let user = null;

try {

    user =
        JSON.parse(
            localStorage.getItem("user")
        );

} catch (error) {

    user = null;

}


/* ==================================================
   CURRENT GROUP
================================================== */

let currentGroup = null;


/* ==================================================
   ELEMENTS
================================================== */

const loading =
    document.getElementById("groupLoading");

const content =
    document.getElementById("groupContent");

const errorBox =
    document.getElementById("groupError");

const errorMessage =
    document.getElementById("groupErrorMessage");

const joinSection =
    document.getElementById("joinSection");

const openGroupSection =
    document.getElementById("openGroupSection");

const joinBtn =
    document.getElementById("joinGroupBtn");

const openGroupBtn =
    document.getElementById("openGroupBtn");

const shareBtn =
    document.getElementById("shareGroupBtn");

const copyBtn =
    document.getElementById("copyGroupLinkBtn");


/* ==================================================
   START
================================================== */

loadGroup();


/* ==================================================
   LOAD GROUP
================================================== */

async function loadGroup() {

    try {

        let url = "";


        /* ==========================================
           PRIORITY:
           invite code
        ========================================== */

        if (inviteCode) {

            url =
                "/api/groups/invite/" +
                encodeURIComponent(inviteCode);

        }

        /* ==========================================
           FALLBACK:
           group ID
        ========================================== */

        else if (groupId) {

            url =
                "/api/groups/" +
                encodeURIComponent(groupId);

        }

        else {

            showError(
                "No group link or group ID was provided."
            );

            return;

        }


        const res =
            await fetch(url);


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
            "Unable to load this group. Please try again."
        );

    }

}


/* ==================================================
   RENDER GROUP
================================================== */

function renderGroup() {

    loading.style.display =
        "none";

    errorBox.style.display =
        "none";

    content.style.display =
        "block";


    /* ==========================================
       NAME
    ========================================== */

    document.getElementById(
        "groupName"
    ).innerText =
        currentGroup.name || "2Chat Group";


    /* ==========================================
       DESCRIPTION
    ========================================== */

    document.getElementById(
        "groupDescription"
    ).innerText =
        currentGroup.description ||
        "No description";


    /* ==========================================
       AVATAR
    ========================================== */

    document.getElementById(
        "groupAvatar"
    ).src =

        currentGroup.avatar &&
        currentGroup.avatar.trim() !== ""

            ? currentGroup.avatar

            : "/images/default-group.png";


    /* ==========================================
       COVER
    ========================================== */

    document.getElementById(
        "groupCover"
    ).src =

        currentGroup.cover &&
        currentGroup.cover.trim() !== ""

            ? currentGroup.cover

            : "/images/default-group-cover.jpg";


    /* ==========================================
       MEMBERS
    ========================================== */

    document.getElementById(
        "memberCount"
    ).innerText =

        currentGroup.memberCount ??
        currentGroup.members?.length ??
        0;


    /* ==========================================
       PRIVACY
    ========================================== */

    document.getElementById(
        "groupPrivacy"
    ).innerText =

        currentGroup.privacy === "private"
            ? "Private"
            : "Public";


    /* ==========================================
       GROUP LINK
    ========================================== */

    updateGroupLink();


    /* ==========================================
       CHECK MEMBERSHIP
    ========================================== */

    updateMembershipUI();

}


/* ==================================================
   GROUP SHARE LINK
================================================== */

function getGroupLink() {

    if (!currentGroup) {

        return "";

    }


    /*
       Sabon link format:

       /group.html?invite=INVITECODE
    */

    if (currentGroup.inviteCode) {

        return (
            window.location.origin +
            "/group.html?invite=" +
            encodeURIComponent(
                currentGroup.inviteCode
            )
        );

    }


    /* ==========================================
       FALLBACK
    ========================================== */

    return (
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(
            currentGroup._id
        )
    );

}


/* ==================================================
   DISPLAY GROUP LINK
================================================== */

function updateGroupLink() {

    const link =
        getGroupLink();


    document.getElementById(
        "groupLinkText"
    ).innerText =
        link;

}


/* ==================================================
   CHECK MEMBERSHIP
================================================== */

function updateMembershipUI() {

    if (!user) {

        joinSection.style.display =
            "block";

        openGroupSection.style.display =
            "none";

        joinBtn.innerHTML = `

            <i class="fa-solid fa-user-plus"></i>

            Join Group

        `;

        return;

    }


    const username =
        String(
            user.username || ""
        ).trim();


    const members =
        currentGroup.members || [];


    if (
        members.includes(username)
    ) {

        /*
           Already member
        */

        joinSection.style.display =
            "none";

        openGroupSection.style.display =
            "block";

        return;

    }


    /*
       Logged in but not member
    */

    joinSection.style.display =
        "block";

    openGroupSection.style.display =
        "none";

}


/* ==================================================
   JOIN GROUP
================================================== */

joinBtn.addEventListener(
    "click",
    joinGroup
);


async function joinGroup() {


    /* ==========================================
       NOT LOGGED IN
    ========================================== */

    if (!user) {

        /*
           Save the exact group destination.

           Bayan register/login za mu dawo nan.
        */

        const redirectUrl =
            window.location.pathname +
            window.location.search;


        localStorage.setItem(
            "afterAuthRedirect",
            redirectUrl
        );


        /*
           Aika user Register
        */

        window.location.href =
            "/register.html";

        return;

    }


    /* ==========================================
       CHECK GROUP
    ========================================== */

    if (!currentGroup) {

        alert(
            "Group information is not available."
        );

        return;

    }


    try {

        joinBtn.disabled =
            true;


        joinBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Joining...

        `;


        const res =
            await fetch(
                "/api/groups/join",
                {

                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        groupId:
                            currentGroup._id,

                        username:
                            user.username

                    })

                }
            );


        const data =
            await res.json();


        if (!data.success) {

            /*
               Private group
            */

            if (data.private) {

                alert(
                    data.message ||
                    "This is a private group."
                );

            } else {

                alert(
                    data.message ||
                    "Unable to join group."
                );

            }


            joinBtn.disabled =
                false;


            joinBtn.innerHTML = `

                <i class="fa-solid fa-user-plus"></i>

                Join Group

            `;

            return;

        }


        /* ======================================
           SUCCESS
        ====================================== */

        currentGroup =
            data.group;


        alert(
            "✅ You joined the group successfully."
        );


        /*
           Redirect zuwa group chat.

           Idan group chat page ɗinka yana da
           wani route daban, za mu canza wannan
           daga baya.
        */

        window.location.href =
            "/group-chat.html?id=" +
            encodeURIComponent(
                currentGroup._id
            );


    } catch (error) {

        console.error(
            "JOIN GROUP ERROR:",
            error
        );


        alert(
            "Network error. Please try again."
        );


        joinBtn.disabled =
            false;


        joinBtn.innerHTML = `

            <i class="fa-solid fa-user-plus"></i>

            Join Group

        `;

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

    if (!currentGroup) {

        return;

    }


    window.location.href =
        "/group-chat.html?id=" +
        encodeURIComponent(
            currentGroup._id
        );

}


/* ==================================================
   COPY GROUP LINK
================================================== */

copyBtn.addEventListener(
    "click",
    copyGroupLink
);


async function copyGroupLink() {

    const link =
        getGroupLink();


    if (!link) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            link
        );


        const oldHTML =
            copyBtn.innerHTML;


        copyBtn.innerHTML = `

            <i class="fa-solid fa-check"></i>

        `;


        setTimeout(
            () => {

                copyBtn.innerHTML =
                    oldHTML;

            },
            1500
        );


    } catch (error) {

        console.error(
            "COPY LINK ERROR:",
            error
        );


        /*
           Fallback
        */

        window.prompt(
            "Copy Group Link:",
            link
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
        getGroupLink();


    if (!link) {

        return;

    }


    const shareData = {

        title:
            currentGroup.name +
            " - 2Chat",

        text:
            "Join " +
            currentGroup.name +
            " on 2Chat.",

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

        } else {

            await navigator.clipboard.writeText(
                link
            );


            alert(
                "✅ Group link copied. You can now share it."
            );

        }

    } catch (error) {

        /*
           User cancelled share.
           Kada mu nuna error idan kawai
           ya rufe share sheet.
        */

        if (
            error.name !==
            "AbortError"
        ) {

            console.error(
                "SHARE ERROR:",
                error
            );

        }

    }

}


/* ==================================================
   ERROR
================================================== */

function showError(message) {

    loading.style.display =
        "none";

    content.style.display =
        "none";

    errorBox.style.display =
        "block";

    errorMessage.innerText =
        message;

}
