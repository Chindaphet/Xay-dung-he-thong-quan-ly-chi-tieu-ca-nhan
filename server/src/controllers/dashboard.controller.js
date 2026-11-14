
const dashboardService = require("../services/dashboard.service");

// Get dashboard overview
const getDashboardOverview = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const dashboard = await dashboardService.getDashboardOverview(
            req.user.user_id,
            startDate,
            endDate
        );

        return res.status(200).json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    getDashboardOverview,
};
