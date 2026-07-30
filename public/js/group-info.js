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

        const res =
        await fetch("/api/groups/" + groupId);

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
    currentGroup.avatar ||
    "/images/default-group.png";

    document.getElementById("groupCover").src =
    currentGroup.cover ||
    "/images/default-cover.jpg";

    document.getElementById("memberCount").innerText =
    currentGroup.members.length;

    document.getElementById("adminCount").innerText =
    currentGroup.admins.length;

    renderMembers();

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
            src="/images/default-avatar.png">

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

