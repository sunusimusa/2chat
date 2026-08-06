// ==================================================
// 2CHAT GROUP INVITE MEMBERS
// ==================================================


// ==================================================
// GET USER
// ==================================================

const user = JSON.parse(
    localStorage.getItem("user")
);


// ==================================================
// GET GROUP ID
// ==================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const groupId =
    params.get("id");


// ==================================================
// CHECK LOGIN
// ==================================================

if (!user || !user.username) {

    alert("Please login first.");

    window.location.href =
        "/login.html";

    throw new Error(
        "User is not logged in."
    );

}


// ==================================================
// CHECK GROUP ID
// ==================================================

if (!groupId) {

    alert("Group ID is missing.");

    window.location.href =
        "/groups.html";

    throw new Error(
        "Group ID is missing."
    );

}


// ==================================================
// ELEMENTS
// ==================================================

const backButton =
    document.getElementById(
        "backButton"
    );


const usernameInput =
    document.getElementById(
        "usernameInput"
    );


const inviteButton =
    document.getElementById(
        "inviteButton"
    );


const inviteMessage =
    document.getElementById(
        "inviteMessage"
    );


const inviteResult =
    document.getElementById(
        "inviteResult"
    );


// ==================================================
// SHOW MESSAGE
// ==================================================

function showMessage(
    message,
    type = "success"
) {

    if (!inviteMessage) return;


    inviteMessage.textContent =
        message;


    inviteMessage.className =
        "invite-message show " +
        type;


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(() => {

            inviteMessage.className =
                "invite-message";

        }, 4000);

}


// ==================================================
// CLEAR RESULT
// ==================================================

function clearResult() {

    if (!inviteResult) return;

    inviteResult.innerHTML = "";

}


// ==================================================
// SHOW SUCCESS RESULT
// ==================================================

function showSuccess(
    username
) {

    if (!inviteResult) return;


    const card =
        document.createElement("div");


    card.className =
        "invited-card";


    card.innerHTML = `

        <div class="invited-avatar">

            <i class="fa-solid fa-user"></i>

        </div>


        <div class="invited-info">

            <strong></strong>

            <span>
                Invitation sent successfully
            </span>

        </div>


        <div class="invited-check">

            <i class="fa-solid fa-circle-check"></i>

        </div>

    `;


    const strong =
        card.querySelector("strong");


    strong.textContent =
        username;


    inviteResult.innerHTML = "";


    inviteResult.appendChild(
        card
    );

}


// ==================================================
// INVITE USER
// ==================================================

async function inviteUser() {

    if (!usernameInput) return;


    const invitee =
        usernameInput.value.trim();


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!invitee) {

        showMessage(
            "Please enter a username.",
            "error"
        );

        usernameInput.focus();

        return;

    }


    if (invitee.length < 2) {

        showMessage(
            "Username is too short.",
            "error"
        );

        usernameInput.focus();

        return;

    }


    if (invitee === user.username) {

        showMessage(
            "You cannot invite yourself.",
            "error"
        );

        usernameInput.focus();

        return;

    }


    // ==================================================
    // BUTTON LOADING
    // ==================================================

    inviteButton.disabled =
        true;


    inviteButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Sending...

    `;


    clearResult();


    try {

        // ==================================================
        // SEND INVITATION
        // ==================================================

        const res =
            await fetch(
                "/api/groups/invite",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        groupId:
                            groupId,

                        username:
                            user.username,

                        invitee:
                            invitee

                    })

                }
            );


        // ==================================================
        // READ RESPONSE
        // ==================================================

        let data = {};


        try {

            data =
                await res.json();

        } catch (jsonError) {

            throw new Error(
                "Server returned an invalid response."
            );

        }


        // ==================================================
        // ERROR
        // ==================================================

        if (
            !res.ok ||
            !data.success
        ) {

            showMessage(
                data.message ||
                "Failed to send invitation.",
                "error"
            );

            return;

        }


        // ==================================================
        // SUCCESS
        // ==================================================

        showMessage(
            "✅ Invitation sent successfully to @" +
            invitee,
            "success"
        );


        showSuccess(
            invitee
        );


        usernameInput.value = "";


    } catch (error) {

        console.error(
            "SEND GROUP INVITATION ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Network error. Please try again.",
            "error"
        );


    } finally {

        // ==================================================
        // RESTORE BUTTON
        // ==================================================

        inviteButton.disabled =
            false;


        inviteButton.innerHTML = `

            <i class="fa-solid fa-paper-plane"></i>

            Invite

        `;

    }

}


// ==================================================
// INVITE BUTTON
// ==================================================

if (inviteButton) {

    inviteButton.addEventListener(
        "click",
        inviteUser
    );

}


// ==================================================
// ENTER KEY
// ==================================================

if (usernameInput) {

    usernameInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                inviteUser();

            }

        }
    );

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

if (usernameInput) {

    usernameInput.focus();

}
