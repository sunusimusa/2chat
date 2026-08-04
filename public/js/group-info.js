const user =
JSON.parse(localStorage.getItem("user"));

const params =
new URLSearchParams(location.search);

const groupId =
params.get("id");

let currentGroup = null;

loadGroup();

async function loadGroup(){

    try{

        const res = await fetch("/api/groups/" + groupId);
        
        const data =
        await res.json();

        if(!data.success){

            alert(data.message);

            history.back();

            return;

        }

        currentGroup = data.group;

        renderGroup();

    }catch(err){

        console.error(err);

    }

}

function renderGroup(){

    document.getElementById("groupName").innerText =
    currentGroup.name;

    document.getElementById("groupDescription").innerText =
    currentGroup.description || "No description";

document.getElementById("groupAvatar").src =
    currentGroup.avatar && currentGroup.avatar.trim() !== ""
        ? currentGroup.avatar
        : "/images/default-group.png";

document.getElementById("groupCover").src =
    currentGroup.cover && currentGroup.cover.trim() !== ""
        ? currentGroup.cover
        : "/images/default-group-cover.jpg";
    
    document.getElementById("memberCount").innerText =
    currentGroup.members.length;

    document.getElementById("adminCount").innerText =
    currentGroup.admins.length;

    renderMembers();

    // Show Delete button only for Owner
    const deleteBtn =
    document.getElementById("deleteGroupBtn");

    if(user.username === currentGroup.owner){

        deleteBtn.style.display = "block";

    }else{

        deleteBtn.style.display = "none";

    }

}

function renderMembers(){

    const list =
    document.getElementById("membersList");

    list.innerHTML = "";

    currentGroup.members.forEach(member=>{

        const isOwner =
        member === currentGroup.owner;

        const isAdmin =
        currentGroup.admins.includes(member);

        let role = "Member";

        if(isOwner){

            role = "Owner 👑";

        }else if(isAdmin){

            role = "Admin ⭐";

        }

        list.innerHTML += `

        <div class="member-card">

            <img
    src="/images/default-group.png">
    
            <div class="member-info">

                <div class="member-name">

                    ${member}

                </div>

                <div class="member-role">

                    ${role}

                </div>

            </div>

        </div>

        `;

    });

}

/* ==========================
LEAVE GROUP
========================== */

document
.getElementById("leaveGroupBtn")
.addEventListener("click", leaveGroup);

async function leaveGroup(){

    if(!confirm("Leave this group?")) return;

    try{

        const res = await fetch("/api/groups/leave",{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                groupId,

                username:user.username

            })

        });

        const data = await res.json();

        if(data.success){

            alert("✅ You left the group.");

            location.href="/groups.html";

        }else{

            alert(data.message);

        }

    }catch(err){

        console.error(err);

    }

}

/* ==========================
DELETE GROUP
========================== */

deleteBtn.addEventListener("click", deleteGroup);

async function deleteGroup(){

    if(user.username !== currentGroup.owner){

        return;

    }

    if(!confirm("Delete this group permanently?")){

        return;

    }

    try{

        const res = await fetch("/api/groups/delete",{

            method:"DELETE",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                groupId,

                username:user.username

            })

        });

        const data = await res.json();

        if(data.success){

            alert("🗑️ Group deleted.");

            location.href="/groups.html";

        }else{

            alert(data.message);

        }

    }catch(err){

        console.error(err);

    }

}

/* ==========================
ADD MEMBER
========================== */

document
.getElementById("addMemberBtn")
.addEventListener("click", addMember);

async function addMember(){

    // Owner ko Admin ne kawai
    if(
        user.username !== currentGroup.owner &&
        !currentGroup.admins.includes(user.username)
    ){

        alert("Only Owner or Admin can add members.");

        return;

    }

    const member =
    prompt("Enter username to add:");

    if(!member) return;

    try{

        const res = await fetch("/api/groups/add-member",{

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                groupId,

                username:user.username,

                member

            })

        });

        const data = await res.json();

        if(data.success){

            alert("✅ Member added successfully.");

            loadGroup();

        }else{

            alert(data.message);

        }

    }catch(err){

        console.error(err);

        alert("Network Error");

    }

}


/* ==========================
ADMIN MANAGEMENT
========================== */

const adminManagementBtn =
document.getElementById("adminManagementBtn");

if(adminManagementBtn){

    adminManagementBtn.addEventListener(
        "click",
        () => {

            location.href =
                "/group-admins.html?id=" +
                encodeURIComponent(groupId);

        }
    );

}
