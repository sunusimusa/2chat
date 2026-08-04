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
        "/group-admins.html?groupId=" +
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

loadGroups();
