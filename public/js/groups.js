const user =
JSON.parse(localStorage.getItem("user"));

const myGroups =
document.getElementById("myGroups");

const groupsList =
document.getElementById("groupsList");

const searchInput =
document.getElementById("searchGroup");

let allGroups = [];
let ownedGroup = null;
let invitationCount = 0;

/* ==========================
LOAD GROUPS
========================== */

async function loadGroups(){

    try{

        const res =
        await fetch("/api/groups/all");

        const data =
        await res.json();

        if(!data.success){

            return;

        }

        allGroups = data.groups;

        renderGroups(allGroups);

    }catch(err){

        console.error(err);

    }

}

/* ==========================
RENDER GROUPS
========================== */

function renderGroups(groups){

    myGroups.innerHTML = "";

    groupsList.innerHTML = "";

    ownedGroup = groups.find(
    group =>
        group.owner === user.username
);

const adminManagementSection =
    document.getElementById(
        "adminManagementSection"
    );

if(adminManagementSection){

    adminManagementSection.style.display =
        ownedGroup
        ? "block"
        : "none";

}

    groups.forEach(group=>{

        const joined =
        group.members.includes(user.username);

        const card = `

        <div class="group-card">

            <img
            src="${
            group.avatar || "/images/default-group.png"
            }">

            <div class="group-details">

                <div class="group-name">

                    ${group.name}

                </div>

                <div class="group-desc">

                    ${group.description || "No description"}

                </div>

                <div class="group-members">

                    👥 ${group.memberCount} Members

                </div>

            </div>

            <div class="group-action">

            ${
            joined ?

            `<button
            onclick="openGroup('${group._id}')">

            Open

            </button>`

            :

            `<button
            onclick="joinGroup('${group._id}')">

            Join

            </button>`

            }

            </div>

        </div>

        `;

        if(joined){

            myGroups.innerHTML += card;

        }else{

            groupsList.innerHTML += card;

        }

    });

}

/* ==========================
SEARCH
========================== */

searchInput.addEventListener("input",()=>{

    const value =
    searchInput.value
    .toLowerCase();

    const filtered =
    allGroups.filter(group=>

        group.name
        .toLowerCase()
        .includes(value)

    );

    renderGroups(filtered);

});

/* ==========================
OPEN GROUP
========================== */

function openGroup(id){

    location.href =
    "/group-chat.html?id="+id;

}

/* ==========================
ADMIN MANAGEMENT
========================== */

function manageGroupAdmins(){

    if(!ownedGroup || !ownedGroup._id){

        return;

    }

    location.href =
    "/group-admins.html?id=" +
    encodeURIComponent(
        ownedGroup._id
    );

}

const openAdminManagement =
    document.getElementById(
        "openAdminManagement"
    );

if(openAdminManagement){

    openAdminManagement.addEventListener(
        "click",
        manageGroupAdmins
    );

}

/* ==========================
JOIN GROUP
========================== */

async function joinGroup(groupId){

    try{

        const res =
        await fetch("/api/groups/join",{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                groupId,

                username:user.username

            })

        });

        const data =
        await res.json();

        if(data.success){

            loadGroups();

        }else{

            alert(data.message);

        }

    }catch(err){

        console.error(err);

    }

}

/* ==========================
GROUP INVITATION NOTIFICATION
========================== */

async function loadInvitationNotification(){

    try{

        if(!user || !user.username){
            return;
        }

        const res =
        await fetch(
            "/api/groups/invitations/" +
            encodeURIComponent(user.username)
        );

        const data =
        await res.json();

        if(
            !res.ok ||
            !data.success
        ){
            return;
        }

        const invitations =
            Array.isArray(data.invitations)
            ? data.invitations
            : [];

        invitationCount =
            invitations.length;

        renderInvitationNotification();

    }catch(err){

        console.error(
            "INVITATION NOTIFICATION ERROR:",
            err
        );

    }

}

/* ==========================
RENDER INVITATION NOTIFICATION
========================== */

function renderInvitationNotification(){

    let section =
        document.getElementById(
            "groupInvitationNotification"
        );

    if(!section){

        section =
        document.createElement("div");

        section.id =
            "groupInvitationNotification";

        const myGroupsSection =
            document.getElementById("myGroups");

        if(
            myGroupsSection &&
            myGroupsSection.parentNode
        ){

            myGroupsSection.parentNode.insertBefore(
                section,
                myGroupsSection.nextSibling
            );

        }

    }

    section.innerHTML = `

        <div class="section-title">
            Group Invitations
        </div>

        <div
            class="admin-management-card"
            style="
                position:relative;
                cursor:pointer;
            "
            onclick="
                location.href='/group-invitations.html'
            "
        >

            <div class="admin-management-icon">

                <i class="fa-solid fa-envelope"></i>

            </div>

            <div class="admin-management-info">

                <h3>
                    Group Invitations
                </h3>

                <p>
                    View and respond to invitations you've received.
                </p>

            </div>

            ${
                invitationCount > 0
                ?

                `
                <span
                    style="
                        position:absolute;
                        top:-6px;
                        left:48px;
                        min-width:24px;
                        height:24px;
                        padding:0 7px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#ff1744;
                        color:#fff;
                        border-radius:50%;
                        font-size:12px;
                        font-weight:bold;
                        border:3px solid #fff;
                        box-shadow:0 2px 6px rgba(0,0,0,.2);
                    "
                >
                    ${invitationCount}
                </span>
                `

                :

                ""
            }

            <button
                class="admin-management-btn"
                type="button"
                onclick="
                    event.stopPropagation();
                    location.href='/group-invitations.html';
                "
            >

                <i class="fa-solid fa-arrow-right"></i>

                View

            </button>

        </div>

    `;

}

// ==========================
// START
// ==========================

loadGroups();

// ==========================
// GROUP INVITATION NOTIFICATION
// ==========================

setInterval(
    loadInvitationNotification,
    15000
);
