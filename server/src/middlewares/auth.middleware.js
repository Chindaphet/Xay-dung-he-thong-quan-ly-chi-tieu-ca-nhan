
const { verifyAccessToken } = require("../utils/token.util");
// Verify JWT access token
const authMiddleware = (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;
        // Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is required.",
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach authenticated user information
        req.user = {
            user_id: decoded.user_id,
            username: decoded.username,
        };

        // Continue to next middleware/controller
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token.",
        });
    }
};

module.exports = authMiddleware;

