// ==================================================
// 2CHAT GROUP INVITE MEMBERS
// ==================================================


// ==================================================
// GET LOGGED-IN USER
// ==================================================

let user = null;

try {

    user = JSON.parse(
        localStorage.getItem("user")
    );

} catch (error) {

    console.error(
        "USER DATA ERROR:",
        error
    );

}


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

    history.back();

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

const searchInput =
    document.getElementById(
        "searchInput"
    );

const usersList =
    document.getElementById(
        "usersList"
    );

const loading =
    document.getElementById(
        "loading"
    );

const message =
    document.getElementById(
        "inviteMessage"
    );


// ==================================================
// INVITED USERS
// ==================================================

// Wannan yana taimaka mana kada button ya koma
// "Invite" bayan search ko reload na list.

const invitedUsers =
    new Set();


// ==================================================
// SHOW MESSAGE
// ==================================================

function showMessage(
    text,
    error = false
) {

    if (!message) return;


    message.textContent =
        text;


    message.className =
        error
            ? "invite-message error show"
            : "invite-message success show";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(() => {

            message.classList.remove(
                "show"
            );

        }, 3000);

}


// ==================================================
// LOAD ALL USERS
// ==================================================

async function loadUsers(
    search = ""
) {

    if (!usersList) {

        console.error(
            "usersList element not found."
        );

        return;

    }


    try {

        // ------------------------------------------
        // LOADING
        // ------------------------------------------

        if (loading) {

            loading.style.display =
                "block";

        }


        usersList.innerHTML =
            "";


        // ------------------------------------------
        // GET USERS
        // ------------------------------------------

        const res =
            await fetch(
                "/api/users/all",
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await res.json();


        // ------------------------------------------
        // CHECK RESPONSE
        // ------------------------------------------

        if (
            !res.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load users."
            );

        }


        let users =
            Array.isArray(data.users)
                ? data.users
                : [];


        // ------------------------------------------
        // REMOVE CURRENT USER
        // ------------------------------------------

        users =
            users.filter(
                targetUser => {

                    return (
                        targetUser &&
                        targetUser.username &&
                        targetUser.username !==
                            user.username
                    );

                }
            );


        // ------------------------------------------
        // SEARCH
        // ------------------------------------------

        const searchText =
            String(search || "")
                .trim()
                .toLowerCase();


        if (searchText) {

            users =
                users.filter(
                    targetUser => {

                        const username =
                            String(
                                targetUser.username ||
                                ""
                            ).toLowerCase();

                        return username.includes(
                            searchText
                        );

                    }
                );

        }


        // ------------------------------------------
        // NO USERS
        // ------------------------------------------

        if (!users.length) {

            usersList.innerHTML = `

                <div class="empty-users">

                    <i
                        class="fa-solid fa-user-slash"
                    ></i>

                    <p>
                        ${
                            searchText
                                ? "No users found."
                                : "No users available."
                        }
                    </p>

                </div>

            `;

            return;

        }


        // ------------------------------------------
        // DISPLAY USERS
        // ------------------------------------------

        users.forEach(
            renderUser
        );


    } catch (error) {

        console.error(
            "LOAD USERS ERROR:",
            error
        );


        usersList.innerHTML = `

            <div class="empty-users">

                <i
                    class="fa-solid fa-circle-exclamation"
                ></i>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Failed to load users."
                    )}
                </p>

            </div>

        `;


        showMessage(
            error.message ||
            "Failed to load users.",
            true
        );


    } finally {

        if (loading) {

            loading.style.display =
                "none";

        }

    }

}


// ==================================================
// RENDER USER
// ==================================================

function renderUser(
    targetUser
) {

    if (
        !targetUser ||
        !targetUser.username
    ) {

        return;

    }

    console.log(
    "USER:",
    targetUser.username,
    "AVATAR:",
    targetUser.avatar
);

    // ------------------------------------------
    // DON'T SHOW YOURSELF
    // ------------------------------------------

    if (
        targetUser.username ===
        user.username
    ) {

        return;

    }


    // ------------------------------------------
    // CREATE CARD
    // ------------------------------------------

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "user-card";
    
    // ==================================================
// USER AVATAR
// ==================================================

let avatar = String(
    targetUser.avatar || ""
).trim();


// Idan babu avatar ko URL ɗin ba daidai ba,
// yi amfani da default avatar
if (
    !avatar ||
    avatar === "undefined" ||
    avatar === "null"
) {

    avatar =
        "/images/default.png";

}
    
    // ------------------------------------------
    // ONLINE STATUS
    // ------------------------------------------

    const onlineText =
        targetUser.online
            ? "Online"
            : "Offline";


    card.innerHTML = `

        <img
    class="user-avatar"
    src="${escapeHtml(avatar)}"
    alt="${escapeHtml(targetUser.username)}"
    onerror="this.onerror=null; this.src='/images/default.png';"
>

        <div class="user-info">

            <strong>
                ${escapeHtml(
                    targetUser.username
                )}
            </strong>

            <small>
                ${onlineText}
            </small>

        </div>


        <button
            type="button"
            class="invite-btn"
        >

            <i
                class="fa-solid fa-user-plus"
            ></i>

            Invite

        </button>

    `;


    // ------------------------------------------
    // INVITE BUTTON
    // ------------------------------------------

    const inviteButton =
        card.querySelector(
            ".invite-btn"
        );


    if (!inviteButton) {

        return;

    }


    // ------------------------------------------
    // ALREADY INVITED IN THIS SESSION
    // ------------------------------------------

    if (
        invitedUsers.has(
            targetUser.username
        )
    ) {

        setInvitedButton(
            inviteButton
        );

    }


    // ------------------------------------------
    // CLICK
    // ------------------------------------------

    inviteButton.addEventListener(
        "click",
        () => {

            sendInvitation(
                targetUser.username,
                inviteButton
            );

        }
    );


    usersList.appendChild(
        card
    );

}


// ==================================================
// SEND GROUP INVITATION
// ==================================================

async function sendInvitation(
    invitee,
    button
) {

    if (!invitee) {

        return;

    }


    // ------------------------------------------
    // PREVENT DOUBLE CLICK
    // ------------------------------------------

    if (
        button &&
        button.disabled
    ) {

        return;

    }


    // ------------------------------------------
    // BUTTON LOADING
    // ------------------------------------------

    if (button) {

        button.disabled =
            true;


        button.innerHTML = `

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            Sending...

        `;

    }


    try {

        // ------------------------------------------
        // SEND REQUEST
        // ------------------------------------------

        const res =
            await fetch(
                "/api/groups/invite",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
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


        // ------------------------------------------
        // READ RESPONSE
        // ------------------------------------------

        const data =
            await res.json();


        // ------------------------------------------
        // CHECK RESPONSE
        // ------------------------------------------

        if (
            !res.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to send invitation."
            );

        }


        // ------------------------------------------
        // SAVE INVITED USER
        // ------------------------------------------

        invitedUsers.add(
            invitee
        );


        // ------------------------------------------
        // BUTTON SUCCESS
        // ------------------------------------------

        if (button) {

            setInvitedButton(
                button
            );

        }


        // ------------------------------------------
        // MESSAGE
        // ------------------------------------------

        showMessage(
            "✅ Invitation sent successfully."
        );


    } catch (error) {

        console.error(
            "SEND INVITATION ERROR:",
            error
        );


        // ------------------------------------------
        // ERROR MESSAGE
        // ------------------------------------------

        showMessage(
            error.message ||
            "Failed to send invitation.",
            true
        );


        // ------------------------------------------
        // RESTORE BUTTON
        // ------------------------------------------

        if (button) {

            button.disabled =
                false;


            button.innerHTML = `

                <i
                    class="fa-solid fa-user-plus"
                ></i>

                Invite

            `;

        }

    }

}


// ==================================================
// SET INVITED BUTTON
// ==================================================

function setInvitedButton(
    button
) {

    if (!button) return;


    button.disabled =
        true;


    button.innerHTML = `

        <i
            class="fa-solid fa-check"
        ></i>

        Invited

    `;


    button.classList.add(
        "invited"
    );

}


// ==================================================
// SEARCH
// ==================================================

let searchTimer =
    null;


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    () => {

                        loadUsers(
                            searchInput.value
                        );

                    },
                    300
                );

        }
    );

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(
    value
) {

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

loadUsers();
