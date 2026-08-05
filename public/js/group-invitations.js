// ==================================================
// 2CHAT GROUP INVITATIONS
// ==================================================


// ==================================================
// USER
// ==================================================

const user =
    JSON.parse(
        localStorage.getItem("user")
    );


// ==================================================
// CHECK LOGIN
// ==================================================

if(
    !user ||
    !user.username
){

    alert("Please login first.");

    location.href =
        "/login.html";

}


// ==================================================
// ELEMENTS
// ==================================================

const invitationsList =
    document.getElementById(
        "invitationsList"
    );

const loading =
    document.getElementById(
        "loading"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


// ==================================================
// LOAD INVITATIONS
// ==================================================

async function loadInvitations(){

    if(
        !user ||
        !user.username
    ){

        return;

    }

    try{

        if(loading){

            loading.style.display =
                "block";

        }

        if(emptyState){

            emptyState.style.display =
                "none";

        }

        if(invitationsList){

            invitationsList.innerHTML =
                "";

        }


        const res =
            await fetch(
                "/api/groups/invitations/" +
                encodeURIComponent(
                    user.username
                )
            );


        const data =
            await res.json();


        if(
            !res.ok ||
            !data.success
        ){

            throw new Error(
                data.message ||
                "Failed to load invitations."
            );

        }


        const invitations =
            data.invitations || [];


        if(loading){

            loading.style.display =
                "none";

        }


        if(
            invitations.length === 0
        ){

            if(emptyState){

                emptyState.style.display =
                    "block";

            }

            return;

        }


        renderInvitations(
            invitations
        );


    }catch(err){

        console.error(
            "LOAD INVITATIONS ERROR:",
            err
        );


        if(loading){

            loading.style.display =
                "none";

        }


        if(invitationsList){

            invitationsList.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-circle-exclamation"></i>

                    <h3>
                        Error
                    </h3>

                    <p>
                        ${escapeHTML(
                            err.message ||
                            "Failed to load invitations."
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// ==================================================
// RENDER INVITATIONS
// ==================================================

function renderInvitations(
    invitations
){

    if(!invitationsList){

        return;

    }


    invitationsList.innerHTML =
        "";


    invitations.forEach(
        invitation => {

            const group =
                invitation.groupId || {};


            const groupName =
                group.name ||
                "2Chat Group";


            const groupAvatar =
                group.avatar &&
                group.avatar.trim() !== ""
                    ? group.avatar
                    : "/images/default-group.png";


            const inviter =
                invitation.inviter ||
                "Someone";


            const invitationId =
                invitation._id;


            invitationsList.innerHTML += `

                <div
                    class="invitation-card"
                    data-id="${escapeHTML(
                        invitationId
                    )}"
                >

                    <img
                        class="invitation-avatar"
                        src="${escapeHTML(
                            groupAvatar
                        )}"
                        alt="Group"
                        onerror="this.src='/images/default-group.png'"
                    >


                    <div class="invitation-info">

                        <h3>

                            ${escapeHTML(
                                groupName
                            )}

                        </h3>

                        <p>

                            Invited by

                            <span class="inviter">

                                ${escapeHTML(
                                    inviter
                                )}

                            </span>

                        </p>

                        <p>

                            Join this group on 2Chat

                        </p>

                    </div>


                    <div
                        class="invitation-actions"
                    >

                        <button
                            class="accept-btn"
                            onclick="acceptInvitation('${escapeHTML(
                                invitationId
                            )}')"
                        >

                            <i class="fa-solid fa-check"></i>

                            Accept

                        </button>


                        <button
                            class="reject-btn"
                            onclick="rejectInvitation('${escapeHTML(
                                invitationId
                            )}')"
                        >

                            <i class="fa-solid fa-xmark"></i>

                            Reject

                        </button>

                    </div>

                </div>

            `;

        }
    );

}


// ==================================================
// ACCEPT INVITATION
// ==================================================

async function acceptInvitation(
    invitationId
){

    if(!invitationId){

        return;

    }


    if(
        !confirm(
            "Accept this group invitation?"
        )
    ){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/groups/invite/accept",
                {

                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        invitationId,

                        username:
                            user.username

                    })

                }
            );


        const data =
            await res.json();


        if(
            !res.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Failed to accept invitation."
            );

            return;

        }


        alert(
            "✅ You joined the group successfully."
        );


        loadInvitations();


    }catch(err){

        console.error(
            "ACCEPT INVITATION ERROR:",
            err
        );

        alert(
            "Network error."
        );

    }

}


// ==================================================
// REJECT INVITATION
// ==================================================

async function rejectInvitation(
    invitationId
){

    if(!invitationId){

        return;

    }


    if(
        !confirm(
            "Reject this group invitation?"
        )
    ){

        return;

    }


    try{

        const res =
            await fetch(
                "/api/groups/invite/reject",
                {

                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        invitationId,

                        username:
                            user.username

                    })

                }
            );


        const data =
            await res.json();


        if(
            !res.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Failed to reject invitation."
            );

            return;

        }


        alert(
            "Invitation rejected."
        );


        loadInvitations();


    }catch(err){

        console.error(
            "REJECT INVITATION ERROR:",
            err
        );

        alert(
            "Network error."
        );

    }

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHTML(
    value
){

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;

}


// ==================================================
// BACK
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
// START
// ==================================================

loadInvitations();
