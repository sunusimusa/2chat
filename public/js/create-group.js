/* ==================================================
   2CHAT CREATE GROUP
================================================== */

const avatarInput =
    document.getElementById("groupImage");

const avatarPreview =
    document.getElementById("previewImage");

const createBtn =
    document.getElementById("createBtn");

const groupNameInput =
    document.getElementById("groupName");

const groupDescriptionInput =
    document.getElementById("groupDescription");


let avatarBase64 = "";

let isCreatingGroup = false;


/* ==================================================
   AVATAR PREVIEW
================================================== */

avatarInput.addEventListener(
    "change",
    () => {

        const file =
            avatarInput.files[0];

        if (!file) {
            return;
        }


        /* Check image */

        if (!file.type.startsWith("image/")) {

            alert(
                "Please select a valid image."
            );

            avatarInput.value = "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload = () => {

            avatarPreview.src =
                reader.result;

            avatarBase64 =
                reader.result;

        };


        reader.onerror = () => {

            alert(
                "Unable to read the image."
            );

        };


        reader.readAsDataURL(file);

    }
);


/* ==================================================
   CREATE BUTTON
   IMPORTANT:
   Only ONE click listener
================================================== */

createBtn.addEventListener(
    "click",
    createGroup
);


/* ==================================================
   CREATE GROUP
================================================== */

async function createGroup() {


    /* ==============================================
       PREVENT DOUBLE CLICK / DOUBLE REQUEST
    ============================================== */

    if (isCreatingGroup) {

        return;

    }


    /* ==============================================
       USER
    ============================================== */

    let user = null;


    try {

        user =
            JSON.parse(
                localStorage.getItem("user")
            );

    } catch (error) {

        user = null;

    }


    if (
        !user ||
        !user.username
    ) {

        alert(
            "Please login first."
        );

        window.location.href =
            "/login.html";

        return;

    }


    /* ==============================================
       GROUP NAME
    ============================================== */

    const name =
        groupNameInput.value.trim();


    /* ==============================================
       DESCRIPTION
    ============================================== */

    const description =
        groupDescriptionInput.value.trim();


    /* ==============================================
       PRIVACY
    ============================================== */

    const privacyElement =
        document.querySelector(
            'input[name="groupPrivacy"]:checked'
        );


    const privacy =
        privacyElement
            ? privacyElement.value
            : "public";


    /* ==============================================
       VALIDATION
    ============================================== */

    if (!name) {

        alert(
            "Enter group name."
        );

        groupNameInput.focus();

        return;

    }


    if (
        privacy !== "public" &&
        privacy !== "private"
    ) {

        alert(
            "Please select group privacy."
        );

        return;

    }


    /* ==============================================
       START CREATING
    ============================================== */

    isCreatingGroup = true;

    createBtn.disabled = true;

    createBtn.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
            Creating Group...
        </span>

    `;


    try {

        /* ==========================================
           API REQUEST
        ========================================== */

        const res =
            await fetch(
                "/api/groups/create",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        name,

                        description,

                        owner:
                            user.username,

                        avatar:
                            avatarBase64,

                        privacy

                    })

                }
            );


        const data =
            await res.json();


        /* ==========================================
           SUCCESS
        ========================================== */

        if (
            res.ok &&
            data.success
        ) {

            alert(
                "✅ Group created successfully"
            );


            /* --------------------------------------
               Reset form
            -------------------------------------- */

            groupNameInput.value =
                "";

            groupDescriptionInput.value =
                "";

            avatarPreview.src =
                "/images/default-group.png";

            avatarInput.value =
                "";

            avatarBase64 =
                "";


            /* --------------------------------------
               Go to groups
            -------------------------------------- */

            window.location.href =
                "/groups.html";

            return;

        }


        /* ==========================================
           ERROR
        ========================================== */

        alert(
            data.message ||
            "Unable to create group."
        );


    } catch (error) {

        console.error(
            "CREATE GROUP ERROR:",
            error
        );


        alert(
            "Network error. Please try again."
        );


    } finally {

        /* ==========================================
           RESTORE BUTTON
           Only if page is still here
        ========================================== */

        isCreatingGroup = false;

        createBtn.disabled =
            false;

        createBtn.innerHTML = `

            <i class="fa-solid fa-users"></i>

            <span>
                Create Group
            </span>

        `;

    }

}
