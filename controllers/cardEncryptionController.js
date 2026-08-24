const crypto = require("crypto");
// ===================================================== // AES-256-GCM ENCRYPTION // =====================================================
function encryptCardField( value, key, nonce ) {
const keyBuffer =
    Buffer.from(
        key,
        "base64"
    );


if (
    keyBuffer.length !== 32
) {

    throw new Error(
        "FLW_ENCRYPTION_KEY must be a valid 32-byte base64 key."
    );

}


const nonceBuffer =
    Buffer.from(
        nonce,
        "utf8"
    );


const cipher =
    crypto.createCipheriv(
        "aes-256-gcm",
        keyBuffer,
        nonceBuffer
    );


const encrypted =
    Buffer.concat([

        cipher.update(
            String(value),
            "utf8"
        ),

        cipher.final()

    ]);


const authTag =
    cipher.getAuthTag();


return Buffer.concat([

    encrypted,

    authTag

]).toString(
    "base64"
);
}
// ===================================================== // CREATE NONCE // =====================================================

function generateNonce() {
return crypto
    .randomBytes(12)
    .toString("base64");
}
// ===================================================== // ENCRYPT CARD // =====================================================
exports.encryptCard = async ( req, res ) => {
try {

    const {
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv
    } =
        req.body || {};


    if (
        !cardNumber ||
        !expiryMonth ||
        !expiryYear ||
        !cvv
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Complete card details are required."

        });

    }


    const encryptionKey =
        process.env.FLW_ENCRYPTION_KEY;


    if (!encryptionKey) {

        return res.status(500).json({

            success: false,

            message:
                "Flutterwave encryption key is not configured."

        });

    }


    const nonce =
        generateNonce();


    return res.json({

        success: true,

        card: {

            encrypted_card_number:
                encryptCardField(
                    cardNumber,
                    encryptionKey,
                    Buffer.from(
                        nonce,
                        "base64"
                    ).toString("utf8")
                ),

            encrypted_expiry_month:
                encryptCardField(
                    expiryMonth,
                    encryptionKey,
                    Buffer.from(
                        nonce,
                        "base64"
                    ).toString("utf8")
                ),

            encrypted_expiry_year:
                encryptCardField(
                    expiryYear,
                    encryptionKey,
                    Buffer.from(
                        nonce,
                        "base64"
                    ).toString("utf8")
                ),

            encrypted_cvv:
                encryptCardField(
                    cvv,
                    encryptionKey,
                    Buffer.from(
                        nonce,
                        "base64"
                    ).toString("utf8")
                ),

            nonce

        }

    });


} catch (err) {

    console.error(
        "CARD ENCRYPTION ERROR:",
        err
    );


    return res.status(500).json({

        success: false,

        message:
            "Unable to secure card information."

    });

}
};
