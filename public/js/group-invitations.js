// ==================================================
// 2CHAT GROUP INVITATIONS
// ==================================================

const user = JSON.parse(
    localStorage.getItem("user")
);

const params = new URLSearchParams(
    window.location.search
);

const groupId = params.get("id");


// ==================================================
// CHECK LOGIN
// ==================================================

if (!user || !user.username) {

    alert("Please login first.");

    window.location.href = "/login.html";

    throw new Error("User is not logged in.");

}


// ==================================================
// ELEMENTS
// ==================================================

const backButton =
    document.getElementById("backButton");

const invitationsContainer =
    document.getElementById("invitationsContainer");


// ==================================================
// LOAD INVITATIONS
// ==================================================

async function loadInvitations() {

    try {

        if (!invitationsContainer) return;

        invitationsContainer.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading invitations...
            </div>
        `;


        const res = await fetch(
            "/api/groups/invitations/" +
            encodeURIComponent(user.username)
        );


        const data = await res.json();


        if (!res.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load invitations."
            );

        }


        const invitations =
            data.invitations || [];


        // ==================================================
        // NO INVITATIONS
        // ==================================================

        if (!invitations.length) {

            invitationsContainer.innerHTML = `
                <div class="empty-invitations">

                    <i class="fa-solid fa-envelope-open-text"></i>

                    <h3>No Invitations</h3>

                    <p>
                        You don't have any pending group invitations.
                    </p>

                </div>
            `;

            return;

        }


        // ==================================================
        // DISPLAY INVITATIONS
        // ==================================================

        invitationsContainer.innerHTML = "";


        invitations.forEach(invitation => {

            const card =
                document.createElement("div");

            card.className =
                "invitation-card";


            card.innerHTML = `

                <div class="invitation-icon">

                    <i class="fa-solid fa-users"></i>

                </div>


                <div class="invitation-info">

                    <h3>
                        ${escapeHtml(
                            invitation.groupName ||
                            "Group"
                        )}
                    </h3>

                    <p>
                        <strong>
                            ${escapeHtml(
                                invitation.inviter ||
                                "Someone"
                            )}
                        </strong>
                        invited you to join this group.
                    </p>

                </div>


                <div class="invitation-actions">

                    <button
                        class="accept-btn"
                        data-id="${invitation._id}"
                    >

                        <i class="fa-solid fa-check"></i>

                        Accept

                    </button>


                    <button
                        class="reject-btn"
                        data-id="${invitation._id}"
                    >

                        <i class="fa-solid fa-xmark"></i>

                        Reject

                    </button>

                </div>

            `;


            invitationsContainer.appendChild(card);

        });


        // ==================================================
        // ACCEPT BUTTONS
        // ==================================================

        document
            .querySelectorAll(".accept-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        acceptInvitation(
                            button.dataset.id
                        );

                    }
                );

            });


        // ==================================================
        // REJECT BUTTONS
        // ==================================================

        document
            .querySelectorAll(".reject-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        rejectInvitation(
                            button.dataset.id
                        );

                    }
                );

            });


    } catch (error) {

        console.error(
            "LOAD INVITATIONS ERROR:",
            error
        );


        if (invitationsContainer) {

            invitationsContainer.innerHTML = `

                <div class="error-message">

                    <i class="fa-solid fa-circle-exclamation"></i>

                    <h3>Error</h3>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Failed to load invitations."
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// ==================================================
// ACCEPT INVITATION
// ==================================================

async function acceptInvitation(
    invitationId
) {

    if (!invitationId) return;


    try {

        const res = await fetch(
            "/api/groups/invite/accept",
            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    invitationId,

                    username:
                        user.username

                })

            }
        );


        const data =
            await res.json();


        if (!res.ok || !data.success) {

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


    } catch (error) {

        console.error(
            "ACCEPT INVITATION ERROR:",
            error
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
) {

    if (!invitationId) return;


    try {

        const res = await fetch(
            "/api/groups/invite/reject",
            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    invitationId,

                    username:
                        user.username

                })

            }
        );


        const data =
            await res.json();


        if (!res.ok || !data.success) {

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


    } catch (error) {

        console.error(
            "REJECT INVITATION ERROR:",
            error
        );

        alert(
            "Network error."
        );

    }

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


// ==================================================
// BACK BUTTON
// ==================================================

if (backButton) {

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
