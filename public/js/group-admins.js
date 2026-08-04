// ==================================================
// 2CHAT GROUP ADMIN MANAGEMENT
// ==================================================

const user =
    JSON.parse(localStorage.getItem("user"));

const backButton =
    document.getElementById("backButton");

const groupAvatar =
    document.getElementById("groupAvatar");

const groupName =
    document.getElementById("groupName");

const groupMembersCount =
    document.getElementById("groupMembersCount");

const membersList =
    document.getElementById("membersList");

const adminMessage =
    document.getElementById("adminMessage");


// ==================================================
// GET GROUP ID FROM URL
// ==================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const groupId =
    params.get("id");


// ==================================================
// CHECK USER
// ==================================================

if(!user || !user.username){

    alert("Please login first.");

    location.href = "/login.html";

}


// ==================================================
// CHECK GROUP ID
// ==================================================

if(!groupId){

    alert("Group ID is missing.");

    history.back();

}


// ==================================================
// BACK BUTTON
// ==================================================

if(backButton){

    backButton.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


// ==================================================
// MESSAGE
// ==================================================

function showAdminMessage(
    message,
    isError = false
){

    if(!adminMessage){
        return;
    }

    adminMessage.textContent =
        message;

    adminMessage.classList.add(
        "show"
    );

    if(isError){

        adminMessage.classList.add(
            "error"
        );

    }else{

        adminMessage.classList.remove(
            "error"
        );

    }

    setTimeout(() => {

        adminMessage.classList.remove(
            "show"
        );

    },3000);

}


// ==================================================
// LOAD GROUP
// ==================================================

async function loadGroup(){

    try{

        const res =
            await fetch(
                "/api/groups/" + groupId
            );

        const data =
            await res.json();

        if(
            !res.ok ||
            !data.success ||
            !data.group
        ){

            showAdminMessage(
                data.message ||
                "Group not found.",
                true
            );

            return;

        }

        const group =
            data.group;


        // ==========================
        // GROUP INFO
        // ==========================

        if(groupName){

            groupName.textContent =
                group.name;

        }


        if(groupAvatar){

            groupAvatar.src =
                group.avatar ||
                "/images/default-group.png";

        }


        if(groupMembersCount){

            groupMembersCount.textContent =
                group.members.length +
                " Members";

        }


        // ==========================
        // RENDER MEMBERS
        // ==========================

        renderMembers(group);


    }catch(err){

        console.error(
            "LOAD GROUP ADMIN ERROR:",
            err
        );

        showAdminMessage(
            "Failed to load group.",
            true
        );

    }

}


// ==================================================
// RENDER MEMBERS
// ==================================================

function renderMembers(group){

    if(!membersList){
        return;
    }

    membersList.innerHTML = "";


    if(
        !group.members ||
        group.members.length === 0
    ){

        membersList.innerHTML = `

            <div class="empty-members">

                No members found.

            </div>

        `;

        return;

    }


    group.members.forEach(
        username => {

            const isOwner =
                group.owner === username;

            const isAdmin =
                Array.isArray(group.admins) &&
                group.admins.includes(
                    username
                );


            let roleHTML = "";

            let actionHTML = "";


            // ==========================
            // OWNER
            // ==========================

            if(isOwner){

                roleHTML = `

                    <span
                        class="member-role owner-badge"
                    >

                        Owner

                    </span>

                `;

                actionHTML = "";

            }


            // ==========================
            // ADMIN
            // ==========================

            else if(isAdmin){

                roleHTML = `

                    <span
                        class="member-role admin-badge"
                    >

                        Admin

                    </span>

                `;

                actionHTML = `

                    <button
                        class="remove-admin"
                        onclick="removeAdmin('${username}')"
                    >

                        Remove Admin

                    </button>

                `;

            }


            // ==========================
            // NORMAL MEMBER
            // ==========================

            else{

                roleHTML = `

                    <span
                        class="member-role member-badge"
                    >

                        Member

                    </span>

                `;

                actionHTML = `

                    <button
                        onclick="makeAdmin('${username}')"
                    >

                        Make Admin

                    </button>

                `;

            }


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "member-card";


            card.innerHTML = `

                <img
                    src="/images/default-avatar.png"
                    alt="${username}"
                    onerror="
                        this.src='/images/default-avatar.png'
                    "
                >

                <div class="member-info">

                    <div class="member-name">

                        ${username}

                    </div>

                    ${roleHTML}

                </div>

                <div class="admin-action">

                    ${actionHTML}

                </div>

            `;


            membersList.appendChild(
                card
            );

        }
    );

}


// ==================================================
// MAKE ADMIN
// ==================================================

async function makeAdmin(
    username
){

    if(!username){
        return;
    }


    const confirmed =
        confirm(
            "Make " +
            username +
            " an admin?"
        );


    if(!confirmed){
        return;
    }


    try{

        const res =
            await fetch(
                "/api/groups/make-admin",
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

                            user.username,

                        member:

                            username

                    })

                }
            );


        const data =
            await res.json();


        if(
            !res.ok ||
            !data.success
        ){

            showAdminMessage(
                data.message ||
                "Failed to make admin.",
                true
            );

            return;

        }


        showAdminMessage(
            "Admin added successfully."
        );


        // Reload group

        loadGroup();


    }catch(err){

        console.error(
            "MAKE ADMIN ERROR:",
            err
        );

        showAdminMessage(
            "Failed to make admin.",
            true
        );

    }

}


// ==================================================
// REMOVE ADMIN
// ==================================================

async function removeAdmin(
    username
){

    if(!username){
        return;
    }


    const confirmed =
        confirm(
            "Remove admin permission from " +
            username +
            "?"
        );


    if(!confirmed){
        return;
    }


    try{

        const res =
            await fetch(
                "/api/groups/remove-admin",
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

                            user.username,

                        member:

                            username

                    })

                }
            );


        const data =
            await res.json();


        if(
            !res.ok ||
            !data.success
        ){

            showAdminMessage(
                data.message ||
                "Failed to remove admin.",
                true
            );

            return;

        }


        showAdminMessage(
            "Admin removed successfully."
        );


        // Reload group

        loadGroup();


    }catch(err){

        console.error(
            "REMOVE ADMIN ERROR:",
            err
        );

        showAdminMessage(
            "Failed to remove admin.",
            true
        );

    }

}


// ==================================================
// START
// ==================================================

loadGroup();
