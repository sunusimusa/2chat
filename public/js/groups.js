const groupList =
document.getElementById("groupList");

async function loadGroups(){

    try{

        const res =
        await fetch("/api/groups/all");

        const data =
        await res.json();

        if(!data.success){

            groupList.innerHTML =
            "<p>No groups found.</p>";

            return;

        }

        let html = "";

        data.groups.forEach(group=>{

            html += `

            <div class="group-card"
            onclick="openGroup('${group._id}')">

                <img
                src="${group.avatar || '/images/default-group.png'}">

                <div>

                    <div class="group-name">

                        ${group.name}

                    </div>

                    <div class="group-members">

                        ${group.memberCount} Members

                    </div>

                </div>

            </div>

            `;

        });

        groupList.innerHTML = html;

    }catch(err){

        console.error(err);

    }

}

function openGroup(id){

    location.href =
    "/group-chat.html?id=" + id;

}

loadGroups();
