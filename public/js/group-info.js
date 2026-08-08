const user =
    JSON.parse(localStorage.getItem("user"));

const params =
    new URLSearchParams(location.search);

const groupId =
    params.get("id");

let currentGroup = null;


/* ==========================
CHECK GROUP ID
========================== */

if(!groupId){

    alert("Group ID is missing.");

    history.back();

}


/* ==========================
ELEMENTS
========================== */

const deleteBtn =
    document.getElementById("deleteGroupBtn");

const copyGroupLinkBtn =
    document.getElementById("copyGroupLinkBtn");

const shareGroupLinkBtn =
    document.getElementById("shareGroupLinkBtn");

const groupLinkText =
    document.getElementById("groupLinkText");


/* ==========================
LOAD GROUP
========================== */

loadGroup();


async function loadGroup(){

    try{

        const res =
            await fetch(
                "/api/groups/" +
                encodeURIComponent(groupId)
            );

        const data =
            await res.json();


        if(!data.success){

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

        generateGroupLink();


    }catch(err){

        console.error(
            "LOAD GROUP ERROR:",
            err
        );

        alert(
            "Failed to load group."
        );

    }

}


/* ==========================
RENDER GROUP
========================== */

function renderGroup(){

    document.getElementById(
        "groupName"
    ).innerText =
        currentGroup.name;


    document.getElementById(
        "groupDescription"
    ).innerText =
        currentGroup.description ||
        "No description";


    /* AVATAR */

    document.getElementById(
        "groupAvatar"
    ).src =

        currentGroup.avatar &&
        currentGroup.avatar.trim() !== ""

            ? currentGroup.avatar

            : "/images/default-group.png";


    /* COVER */

    document.getElementById(
        "groupCover"
    ).src =

        currentGroup.cover &&
        currentGroup.cover.trim() !== ""

            ? currentGroup.cover

            : "/images/default-group-cover.jpg";


    /* MEMBERS */

    document.getElementById(
        "memberCount"
    ).innerText =

        Array.isArray(currentGroup.members)

            ? currentGroup.members.length

            : 0;


    /* ADMINS */

    document.getElementById(
        "adminCount"
    ).innerText =

        Array.isArray(currentGroup.admins)

            ? currentGroup.admins.length

            : 0;


    renderMembers();


    /* DELETE BUTTON */

    if(
        user &&
        user.username === currentGroup.owner
    ){

        deleteBtn.style.display =
            "block";

    }else{

        deleteBtn.style.display =
            "none";

    }

}


/* ==========================
GENERATE GROUP LINK
========================== */

function generateGroupLink(){

    if(!groupLinkText){

        return;

    }


    const groupLink =
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(
            currentGroup._id
        );


    groupLinkText.innerText =
        groupLink;


    groupLinkText.dataset.link =
        groupLink;

}


/* ==========================
COPY GROUP LINK
========================== */

if(copyGroupLinkBtn){

    copyGroupLinkBtn.addEventListener(
        "click",
        copyGroupLink
    );

}


async function copyGroupLink(){

    if(!currentGroup){

        return;

    }


    const link =
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(
            currentGroup._id
        );


    try{

        await navigator.clipboard.writeText(
            link
        );


        showCopySuccess();


    }catch(error){

        /* FALLBACK */

        const textarea =
            document.createElement("textarea");

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

        try{

            document.execCommand(
                "copy"
            );

            showCopySuccess();

        }catch(err){

            alert(
                "Could not copy group link."
            );

        }

        textarea.remove();

    }

}


/* ==========================
COPY SUCCESS
========================== */

function showCopySuccess(){

    if(!copyGroupLinkBtn){

        return;

    }


    const oldHTML =
        copyGroupLinkBtn.innerHTML;


    copyGroupLinkBtn.innerHTML =
        '<i class="fa-solid fa-check"></i>';

    copyGroupLinkBtn.style.background =
        "#1877f2";

    copyGroupLinkBtn.style.color =
        "#fff";


    setTimeout(()=>{

        copyGroupLinkBtn.innerHTML =
            oldHTML;

        copyGroupLinkBtn.style.background =
            "";

        copyGroupLinkBtn.style.color =
            "";

    },1500);

}


/* ==========================
SHARE GROUP LINK
========================== */

if(shareGroupLinkBtn){

    shareGroupLinkBtn.addEventListener(
        "click",
        shareGroupLink
    );

}


async function shareGroupLink(){

    if(!currentGroup){

        return;

    }


    const link =
        window.location.origin +
        "/group.html?id=" +
        encodeURIComponent(
            currentGroup._id
        );


    const shareData = {

        title:
            currentGroup.name +
            " - 2Chat Group",

        text:
            "Join " +
            currentGroup.name +
            " on 2Chat.",

        url:
            link

    };


    /* NATIVE SHARE */

    if(
        navigator.share
    ){

        try{

            await navigator.share(
                shareData
            );

            return;

        }catch(error){

            /*
            User cancelled share.
            Do nothing.
            */

            if(
                error.name ===
                "AbortError"
            ){

                return;

            }

        }

    }


    /* FALLBACK */

    try{

        await navigator.clipboard.writeText(
            link
        );

        alert(
            "Group link copied. You can now share it."
        );

    }catch(error){

        alert(
            link
        );

    }

}


/* ==========================
CLICK LINK
========================== */

if(groupLinkText){

    groupLinkText.addEventListener(
        "click",
        ()=>{

            if(
                groupLinkText.dataset.link
            ){

                window.open(
                    groupLinkText.dataset.link,
                    "_blank"
                );

            }

        }
    );

}


/* ==========================
RENDER MEMBERS
========================== */

function renderMembers(){

    const list =
        document.getElementById(
            "membersList"
        );


    list.innerHTML = "";


    if(
        !Array.isArray(
            currentGroup.members
        ) ||
        currentGroup.members.length === 0
    ){

        list.innerHTML = `
            <p style="
                text-align:center;
                color:#888;
                padding:20px;
            ">
                No members yet.
            </p>
        `;

        return;

    }


    currentGroup.members.forEach(
        member => {

            const isOwner =
                member ===
                currentGroup.owner;


            const isAdmin =
                Array.isArray(
                    currentGroup.admins
                ) &&
                currentGroup.admins.includes(
                    member
                );


            let role =
                "Member";


            if(isOwner){

                role =
                    "Owner 👑";

            }else if(isAdmin){

                role =
                    "Admin ⭐";

            }


            list.innerHTML += `

                <div class="member-card">

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

                </div>

            `;

        }
    );

}


/* ==========================
HTML ESCAPE
========================== */

function escapeHTML(value){

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


/* ==========================
LEAVE GROUP
========================== */

document
    .getElementById("leaveGroupBtn")
    .addEventListener(
        "click",
        leaveGroup
    );


async function leaveGroup(){

    if(
        !currentGroup ||
        !user
    ){

        return;

    }


    if(
        !confirm(
            "Leave this group?"
        )
    ){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/groups/leave",
                {

                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        groupId:

                            groupId,

                        username:

                            user.username

                    })

                }
            );


        const data =
            await res.json();


        if(data.success){

            alert(
                "✅ You left the group."
            );


            location.href =
                "/groups.html";

        }else{

            alert(
                data.message
            );

        }


    }catch(err){

        console.error(err);

        alert(
            "Network Error"
        );

    }

}


/* ==========================
DELETE GROUP
========================== */

if(deleteBtn){

    deleteBtn.addEventListener(
        "click",
        deleteGroup
    );

}


async function deleteGroup(){

    if(
        !user ||
        !currentGroup
    ){

        return;

    }


    if(
        user.username !==
        currentGroup.owner
    ){

        return;

    }


    if(
        !confirm(
            "Delete this group permanently?"
        )
    ){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/groups/delete",
                {

                    method:"DELETE",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        groupId,

                        username:
                            user.username

                    })

                }
            );


        const data =
            await res.json();


        if(data.success){

            alert(
                "🗑️ Group deleted."
            );


            location.href =
                "/groups.html";

        }else{

            alert(
                data.message
            );

        }


    }catch(err){

        console.error(err);

        alert(
            "Network Error"
        );

    }

}


/* ==========================
ADD MEMBER
========================== */

document
    .getElementById("addMemberBtn")
    .addEventListener(
        "click",
        addMember
    );


async function addMember(){

    if(
        !currentGroup ||
        !user
    ){

        return;

    }


    if(

        user.username !==
        currentGroup.owner &&

        !currentGroup.admins.includes(
            user.username
        )

    ){

        alert(
            "Only Owner or Admin can add members."
        );

        return;

    }


    const member =
        prompt(
            "Enter username to add:"
        );


    if(!member){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/groups/add-member",
                {

                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        groupId,

                        username:
                            user.username,

                        member:
                            member.trim()

                    })

                }
            );


        const data =
            await res.json();


        if(data.success){

            alert(
                "✅ Member added successfully."
            );


            loadGroup();

        }else{

            alert(
                data.message
            );

        }


    }catch(err){

        console.error(err);

        alert(
            "Network Error"
        );

    }

}


/* ==========================
ADMIN MANAGEMENT
========================== */

const adminManagementBtn =
    document.getElementById(
        "adminManagementBtn"
    );


if(adminManagementBtn){

    adminManagementBtn.addEventListener(
        "click",
        ()=>{

            location.href =
                "/group-admins.html?id=" +
                encodeURIComponent(
                    groupId
                );

        }
    );

}


/* ==========================
GROUP SETTINGS
========================== */

const groupSettingsBtn =
    document.getElementById(
        "groupSettingsBtn"
    );


if(groupSettingsBtn){

    groupSettingsBtn.addEventListener(
        "click",
        ()=>{

            location.href =
                "/group-settings.html?id=" +
                encodeURIComponent(
                    groupId
                );

        }
    );

}
