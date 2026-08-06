// ==================================================
// 2CHAT GROUP INVITE MEMBERS
// ==================================================

const user = JSON.parse(
    localStorage.getItem("user")
);

// ==================================================
// GET GROUP ID
// ==================================================

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
// CHECK GROUP ID
// ==================================================

if (!groupId) {

    alert("Group ID is missing.");

    history.back();

    throw new Error("Group ID is missing.");

}

// ==================================================
// ELEMENTS
// ==================================================

const backButton =
    document.getElementById("backButton");

const searchInput =
    document.getElementById("searchInput");

const usersList =
    document.getElementById("usersList");

const loading =
    document.getElementById("loading");

const message =
    document.getElementById("inviteMessage");


// ==================================================
// SHOW MESSAGE
// ==================================================

function showMessage(
    text,
    error = false
) {

    if (!message) return;

    message.textContent = text;

    message.className =
        error
        ? "invite-message error show"
        : "invite-message success show";

    setTimeout(() => {

        message.classList.remove("show");

    }, 3000);

}


// ==================================================
// LOAD USERS
// ==================================================

async function loadUsers(search = "") {

    try {

        if (loading) {

            loading.style.display =
                "block";

        }

        if (usersList) {

            usersList.innerHTML = "";

        }

        const url =
            "/api/users/search?query=" +
            encodeURIComponent(search);

        const res =
            await fetch(url);

        const data =
            await res.json();

        if (
            !res.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load users."
            );

        }

        const users =
            data.users || [];


        if (!users.length) {

            if (usersList) {

                usersList.innerHTML = `

                    <div class="empty-users">

                        <i class="fa-solid fa-user-slash"></i>

                        <p>
                            No users found.
                        </p>

                    </div>

                `;

            }

            return;

        }


        users.forEach(
            renderUser
        );


    } catch (error) {

        console.error(
            "LOAD USERS ERROR:",
            error
        );

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

function renderUser(targetUser) {

    if (
        !targetUser ||
        !targetUser.username
    ) {

        return;

    }


    // Don't show yourself

    if (
        targetUser.username ===
        user.username
    ) {

        return;

    }


    const card =
        document.createElement("div");

    card.className =
        "user-card";


    const avatar =
        targetUser.avatar ||
        "/images/default-avatar.png";


    card.innerHTML = `

        <img
            class="user-avatar"
            src="${escapeHtml(avatar)}"
            alt="Avatar"
        >

        <div class="user-info">

            <strong>
                ${escapeHtml(
                    targetUser.username
                )}
            </strong>

        </div>

        <button
            type="button"
            class="invite-btn"
        >

            <i class="fa-solid fa-user-plus"></i>

            Invite

        </button>

    `;


    const inviteButton =
        card.querySelector(
            ".invite-btn"
        );


    inviteButton.addEventListener(
        "click",
        () => {

            sendInvitation(
                targetUser.username,
                inviteButton
            );

        }
    );


    usersList.appendChild(card);

}


// ==================================================
// SEND INVITATION
// ==================================================

async function sendInvitation(
    invitee,
    button
) {

    if (!invitee) return;


    if (button) {

        button.disabled = true;

        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Sending...

        `;

    }


    try {

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

                        groupId,

                        username:
                            user.username,

                        invitee

                    })

                }
            );


        const data =
            await res.json();


        if (
            !res.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to send invitation."
            );

        }


        showMessage(
            "✅ Invitation sent successfully."
        );


        if (button) {

            button.disabled = true;

            button.innerHTML = `

                <i class="fa-solid fa-check"></i>

                Invited

            `;

            button.classList.add(
                "invited"
            );

        }


    } catch (error) {

        console.error(
            "SEND INVITATION ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to send invitation.",
            true
        );


        if (button) {

            button.disabled = false;

            button.innerHTML = `

                <i class="fa-solid fa-user-plus"></i>

                Invite

            `;

        }

    }

}


// ==================================================
// SEARCH
// ==================================================

let searchTimer;

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
                            searchInput.value.trim()
                        );

                    },
                    400
                );

        }
    );

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value || "";

    return div.innerHTML;

}


// ==================================================
// BACK
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
