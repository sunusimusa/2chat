const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error("RESEND_API_KEY is missing");
        }

        const response = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: "2Chat <onboarding@resend.dev>",
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    text,
                    html
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error(
                "Resend API Error:",
                result.message || result.name || response.status
            );

            throw new Error(
                result.message || "Email delivery failed"
            );
        }

        console.log(
            "Email sent successfully:",
            result.id
        );

        return result;

    } catch (error) {
        console.error(
            "Email sending failed:",
            error.message
        );

        throw error;
    }
};

module.exports = sendEmail;
              
