
const path = require("path");
const dotenv = require("dotenv");

// Load root .env
dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const {
    verifyEmailConnection,
} = require("./src/services/email.service");

const testEmailConnection = async () => {
    try {
        await verifyEmailConnection();

        console.log("SMTP TEST: SUCCESS");
    } catch (error) {
        console.error("SMTP TEST: FAILED");
        process.exitCode = 1;
    }
};

testEmailConnection();
