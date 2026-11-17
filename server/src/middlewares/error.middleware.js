
const errorMiddleware = (err, req, res, next) => {
    console.error("========================================");
    console.error("Server Error:");
    console.error("Message:", err.message);
    console.error("Status:", err.status || 500);
    console.error("Method:", req.method);
    console.error("URL:", req.originalUrl);
    console.error("Stack:", err.stack);
    console.error("========================================");

    const statusCode = err.status || 500;
    const response = {
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error."
                : err.message || "Unknown server error.",
    };

    if (
        process.env.NODE_ENV !== "production" &&
        err.details
    ) {
        response.details = err.details;
    }

    res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
