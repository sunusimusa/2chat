/* =====================================================
   2CHAT FCM TOKEN REGISTRATION
===================================================== */

(function () {

    let registeredToken = null;
    let registrationInProgress = false;

    window.on2ChatFCMToken = async function (fcmToken) {

        try {

            // Validate FCM token
            if (
                typeof fcmToken !== "string" ||
                !fcmToken.trim()
            ) {
                console.warn("2Chat: Invalid FCM token.");
                return;
            }

            fcmToken = fcmToken.trim();

            // Prevent duplicate registration
            if (
                registeredToken === fcmToken ||
                registrationInProgress
            ) {
                return;
            }

            // Get authenticated user JWT
            const authToken = localStorage.getItem("token");

            if (!authToken) {
                console.warn(
                    "2Chat: Login required before registering FCM token."
                );
                return;
            }

            registrationInProgress = true;

            // Send FCM token to backend
            const response = await fetch(
                "/api/auth/fcm-token",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + authToken
                    },

                    body: JSON.stringify({
                        token: fcmToken
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                console.error(
                    "2Chat FCM registration failed:",
                    data.message || response.status
                );

                return;
            }

            registeredToken = fcmToken;

            console.log(
                "2Chat FCM token registered successfully."
            );

        } catch (error) {

            console.error(
                "2Chat FCM registration error:",
                error
            );

        } finally {

            registrationInProgress = false;

        }

    };

})();
          
