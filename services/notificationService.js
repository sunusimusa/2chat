/* =====================================================
   2CHAT CENTRAL PUSH NOTIFICATION SERVICE
===================================================== */

const {
    initializeApp,
    getApps,
    cert
} = require("firebase-admin/app");

const {
    getMessaging
} = require("firebase-admin/messaging");

const fs = require("fs");
const User = require("../models/User");

const SERVICE_ACCOUNT_PATH =
    "/etc/secrets/firebase-service-account.json";

let firebaseInitialized = false;


/* =====================================================
   INITIALIZE FIREBASE ADMIN
===================================================== */

function initializeFirebase() {

    if (firebaseInitialized) {
        return true;
    }

    try {

        const existingApp = getApps().find(
            app => app.name === "[DEFAULT]"
        );

        if (existingApp) {
            if (
                existingApp.options.projectId !==
                "graphic-linker-301319"
            ) {
                console.error(
                    "2Chat FCM: Existing Firebase project ID mismatch."
                );
                return false;
            }

            firebaseInitialized = true;
            return true;
        }

        if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {

            console.error(
                "2Chat FCM: Firebase service account file not found."
            );

            return false;
        }

        const serviceAccount = JSON.parse(
            fs.readFileSync(
                SERVICE_ACCOUNT_PATH,
                "utf8"
            )
        );

        if (
            serviceAccount.project_id !==
            "graphic-linker-301319"
        ) {
            console.error(
                "2Chat FCM: Firebase project ID mismatch."
            );

            return false;
        }

        initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        firebaseInitialized = true;

        console.log(
            "2Chat FCM: Firebase Admin initialized successfully."
        );

        return true;

    } catch (error) {

        console.error(
            "2Chat FCM INITIALIZATION ERROR:",
            error.message
        );

        return false;
    }
}


/* =====================================================
   REMOVE INVALID TOKENS
===================================================== */

async function removeInvalidTokens(
    userId,
    invalidTokens
) {

    if (!invalidTokens.length) {
        return;
    }

    try {

        await User.updateOne(
            { _id: userId },
            {
                $pull: {
                    fcmTokens: {
                        $in: invalidTokens
                    }
                }
            }
        );

        console.log(
            "2Chat FCM: Invalid tokens removed:",
            invalidTokens.length
        );

    } catch (error) {

        console.error(
            "2Chat FCM TOKEN CLEANUP ERROR:",
            error.message
        );
    }
}


/* =====================================================
   SEND PUSH NOTIFICATION
===================================================== */

async function sendPushNotification({
    recipientUsername,
    title,
    body,
    data = {},
    dataOnly = false
}) {

    try {

        if (
            typeof recipientUsername !== "string" ||
            !recipientUsername.trim()
        ) {
            return {
                success: false,
                message: "Recipient username is required."
            };
        }

        if (!initializeFirebase()) {
            return {
                success: false,
                message: "Firebase is not initialized."
            };
        }

       const user = await User.findOne({
    username: recipientUsername.trim()
}).select("_id username +fcmTokens notificationsEnabled");

if (!user) {
    return {
        success: false,
        message: "Recipient not found."
    };
}

// Respect user's notification preference
if (user.notificationsEnabled === false) {
    return {
        success: false,
        message: "Recipient has disabled notifications."
    };
}

if (!user.fcmTokens?.length) {

            return {
                success: false,
                message: "Recipient has no registered FCM tokens."
            };
        }

        const tokens = [
            ...new Set(
                user.fcmTokens.filter(
                    token =>
                        typeof token === "string" &&
                        token.trim()
                )
            )
        ];

        if (!tokens.length) {
            return {
                success: false,
                message: "No valid FCM tokens found."
            };
        }

        const safeData = {};

        for (const [key, value] of Object.entries(data)) {

            if (value !== undefined && value !== null) {

                safeData[key] = String(value);
            }
        }

        let successCount = 0;
        let failureCount = 0;

        const invalidTokens = [];

        // FCM supports a maximum of 500 tokens per batch.

        for (
            let i = 0;
            i < tokens.length;
            i += 500
        ) {

            const batch = tokens.slice(i, i + 500);

            const message = {
                tokens: batch,
                data: {
                    ...safeData,
                    title: String(title || "2Chat"),
                    body: String(body || "")
                },
                android: {
                    priority: "high"
                }
            };

            if (!dataOnly) {
                message.notification = {
                    title: String(title || "2Chat"),
                    body: String(body || "")
                };
            }

            const response = await getMessaging().sendEachForMulticast(message);

            successCount += response.successCount;
            failureCount += response.failureCount;

            response.responses.forEach(
                (result, index) => {

                    if (!result.success) {

                        const errorCode =
                            result.error?.code;

                        if (
                            errorCode ===
                                "messaging/invalid-registration-token" ||
                            errorCode ===
                                "messaging/registration-token-not-registered"
                        ) {

                            invalidTokens.push(
                                batch[index]
                            );
                        }

                        console.error(
                            "2Chat FCM SEND ERROR:",
                            errorCode || result.error?.message
                        );
                    }
                }
            );
        }

        await removeInvalidTokens(
            user._id,
            invalidTokens
        );

        console.log(
            "2Chat FCM RESULT:",
            {
                recipient: user.username,
                successCount,
                failureCount
            }
        );

        return {
            success: successCount > 0,
            successCount,
            failureCount
        };

    } catch (error) {

        console.error(
            "2Chat PUSH NOTIFICATION ERROR:",
            error.message
        );

        return {
            success: false,
            message: "Push notification failed."
        };
    }
}


/* =====================================================
   EXPORT SERVICE
===================================================== */

module.exports = {
    initializeFirebase,
    sendPushNotification
};
