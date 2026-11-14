
const nodemailer = require("nodemailer");

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

// Verify Gmail SMTP connection
const verifyEmailConnection = async () => {
    try {
        await transporter.verify();

        console.log("Gmail SMTP connection established.");
        return true;
    } catch (error) {
        console.error(
            "Gmail SMTP connection failed:",
            error.message
        );

        throw error;
    }
};

// Send email
const sendEmail = async ({
    to,
    subject,
    text,
    html,
}) => {
    if (!to || !subject || (!text && !html)) {
        throw new Error("Missing required email fields.");
    }

    const fromName =
        process.env.SMTP_FROM_NAME || "Devo Personal Expense";

    const info = await transporter.sendMail({
        from: {
            name: fromName,
            address: process.env.SMTP_USER,
        },
        to,
        subject,
        text,
        html,
    });

    return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
    };
};

module.exports = {
    transporter,
    verifyEmailConnection,
    sendEmail,
};
