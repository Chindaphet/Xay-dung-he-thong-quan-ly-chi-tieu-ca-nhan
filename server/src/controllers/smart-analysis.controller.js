
const smartAnalysisService = require(
    "../services/smart-analysis.service"
);


// Get smart analysis overview
const getSmartAnalysis = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const analysis = await smartAnalysisService.getSmartAnalysis(
            req.user.user_id,
            startDate,
            endDate
        );

        return res.status(200).json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    getSmartAnalysis,
};
