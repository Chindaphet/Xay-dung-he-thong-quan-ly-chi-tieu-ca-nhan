
const simulatorService = require("../services/simulator.service");

// Run a what-if financial simulation
const simulate = async (req, res, next) => {
    try {
        const result = await simulatorService.simulate(
            req.user.user_id,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Financial simulation completed successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    simulate,
};
