
import { useEffect, useState } from "react";
import useLanguage from "../hooks/useLanguage";
import Header from "../components/layout/Header";
import { getSmartAnalysis } from "../services/api";
import "../styles/smart-analysis.css";

// Get local date in YYYY-MM-DD format
const getLocalDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Get the first day of the current month
const getMonthStart = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
};

// Format money in VND
const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
};

// Format percentage
const formatPercentage = (value) => {
    if (value === null || value === undefined) {
        return "—";
    }

    return `${Number(value).toFixed(2)}%`;
};

function SmartAnalysis({user,isSidebarOpen,onToggleSidebar,}) {
    const { t } = useLanguage();

    const [startDate, setStartDate] = useState(getMonthStart);
    const [endDate, setEndDate] = useState(getLocalDate);

    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    // Fetch Smart Analysis data
    useEffect(() => {
        let cancelled = false;
        const fetchAnalysis = async () => {setLoading(true);setError("");
            try {
                const response = await getSmartAnalysis(startDate,endDate);
                if (!cancelled) {
                    setAnalysisData(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error.message ||
                        t("smartAnalysis.loadFailed")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAnalysis();
        return () => {
            cancelled = true;
        };
    }, [startDate, endDate, retryCount, t]);

    const handleStartDateChange = (event) => {
        setStartDate(event.target.value);
    };

    const handleEndDateChange = (event) => {
        setEndDate(event.target.value);
    };

    const handleRetry = () => {
        setRetryCount((count) => count + 1);
    };

    const summary = analysisData?.summary;
    const comparison = analysisData?.expense_comparison;
    const budget = analysisData?.budget_analysis;

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                <Header
                    title={t("smartAnalysis.title")}
                    subtitle={t("smartAnalysis.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                />

                <div className="smart-analysis-content">

                    {/* Date Filter */}
                    <section className="smart-analysis-filter">
                        <div>
                            <h2>
                                {t("smartAnalysis.overview")}
                            </h2>
                            <p>
                                {t("smartAnalysis.description")}
                            </p>
                        </div>

                        <div className="smart-analysis-date-filter">
                            <div>
                                <label htmlFor="analysis-start-date">
                                    {t("smartAnalysis.from")}
                                </label>

                                <input
                                    id="analysis-start-date"
                                    type="date"
                                    value={startDate}
                                    max={endDate}
                                    onChange={handleStartDateChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="analysis-end-date">
                                    {t("smartAnalysis.to")}
                                </label>

                                <input
                                    id="analysis-end-date"
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    max={getLocalDate()}
                                    onChange={handleEndDateChange}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Loading */}
                    {loading && (
                        <div className="smart-analysis-message">
                            <div className="loading-spinner" />
                            <p>{t("smartAnalysis.loading")}</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="smart-analysis-error">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                {t("smartAnalysis.retry")}
                            </button>
                        </div>
                    )}

                    {/* Analysis Results */}
                    {!loading && !error && analysisData && (
                        <div className="smart-analysis-sections">

                            {/* Summary */}
                            <section className="analysis-section">
                                <h2>
                                    {t("smartAnalysis.financialSummary")}
                                </h2>

                                <div className="analysis-summary-grid">
                                    <div className="analysis-card income">
                                        <span>
                                            {t("smartAnalysis.totalIncome")}
                                        </span>
                                        <strong>
                                            {formatCurrency(summary?.total_income)}
                                        </strong>
                                    </div>

                                    <div className="analysis-card expense">
                                        <span>
                                            {t("smartAnalysis.totalExpenses")}
                                        </span>
                                        <strong>
                                            {formatCurrency(summary?.total_expenses)}
                                        </strong>
                                    </div>

                                    <div className="analysis-card balance">
                                        <span>
                                            {t("smartAnalysis.netBalance")}
                                        </span>
                                        <strong>
                                            {formatCurrency(summary?.net_balance)}
                                        </strong>
                                    </div>
                                </div>
                            </section>

                            {/* Expense Comparison */}
                            <section className="analysis-section">
                                <h2>
                                    {t("smartAnalysis.expenseComparison")}
                                </h2>

                                <div className="analysis-panel">
                                    <div className="comparison-grid">
                                        <div>
                                            <span>
                                                {t("smartAnalysis.currentExpenses")}
                                            </span>
                                            <strong>
                                                {formatCurrency(
                                                    comparison?.current_expenses
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                {t("smartAnalysis.previousExpenses")}
                                            </span>
                                            <strong>
                                                {formatCurrency(
                                                    comparison?.previous_expenses
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                {t("smartAnalysis.percentageChange")}
                                            </span>
                                            <strong>
                                                {formatPercentage(
                                                    comparison?.percentage_change
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Category Analysis */}
                            <section className="analysis-section">
                                <h2>
                                    {t("smartAnalysis.categoryAnalysis")}
                                </h2>

                                <div className="analysis-panel">
                                    {analysisData.category_analysis?.length > 0 ? (
                                        <div className="analysis-category-list">
                                            {analysisData.category_analysis.map(
                                                (category, index) => (
                                                    <div
                                                        className="analysis-category-item"
                                                        key={
                                                            category.category_id ||
                                                            category.category_name ||
                                                            index
                                                        }
                                                    >
                                                        <div className="analysis-category-info">
                                                            <strong>
                                                                {category.category_name ||
                                                                    category.name}
                                                            </strong>

                                                            <span>
                                                                {formatCurrency(
                                                                    category.total_amount
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="analysis-progress">
                                                            <div
                                                                className="analysis-progress-fill"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        Math.max(
                                                                            Number(category.percentage) || 0,
                                                                            0
                                                                        ),
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <span className="analysis-category-percentage">
                                                            {formatPercentage(
                                                                category.percentage
                                                            )}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p>
                                            {t("smartAnalysis.noCategoryData")}
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* Budget Analysis */}
                            <section className="analysis-section">
                                <h2>
                                    {t("smartAnalysis.budgetAnalysis")}
                                </h2>

                                <div className="analysis-panel">
                                    {budget ? (
                                        <>
                                            <div className="budget-analysis-grid">
                                                <div>
                                                    <span>
                                                        {t("smartAnalysis.budgetAmount")}
                                                    </span>
                                                    <strong>
                                                        {formatCurrency(
                                                            budget.budget_amount
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        {t("smartAnalysis.budgetExpenses")}
                                                    </span>
                                                    <strong>
                                                        {formatCurrency(
                                                            budget.total_expenses
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        {t("smartAnalysis.remainingBudget")}
                                                    </span>
                                                    <strong>
                                                        {formatCurrency(
                                                            budget.remaining_budget
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="budget-progress-heading">
                                                <span>
                                                    {t("smartAnalysis.budgetUsage")}
                                                </span>
                                                <strong>
                                                    {formatPercentage(
                                                        budget.usage_percentage
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="analysis-progress budget-progress">
                                                <div
                                                    className="analysis-progress-fill"
                                                    style={{
                                                        width: `${Math.min(
                                                            Math.max(
                                                                Number(budget.usage_percentage) || 0,
                                                                0
                                                            ),
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <p>
                                            {t("smartAnalysis.noBudgetData")}
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* Insights */}
                            <section className="analysis-section">
                                <h2>
                                    {t("smartAnalysis.insights")}
                                </h2>

                                <div className="analysis-insight-list">
                                    {analysisData.insights?.length > 0 ? (
                                        analysisData.insights.map(
                                            (insight, index) => (
                                                <div
                                                    className="analysis-insight-card"
                                                    key={`${insight.type}-${index}`}
                                                >
                                                    <strong>
                                                        {insight.type?.replaceAll(
                                                            "_",
                                                            " "
                                                        )}
                                                    </strong>
                                                    <p>{insight.message}</p>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <p>
                                            {t("smartAnalysis.noInsights")}
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* Recommendations */}
                            <section className="analysis-section">
                                <h2>
                                    {t("smartAnalysis.recommendations")}
                                </h2>

                                <div className="analysis-insight-list">
                                    {analysisData.recommendations?.length > 0 ? (
                                        analysisData.recommendations.map(
                                            (recommendation, index) => (
                                                <div
                                                    className="analysis-recommendation-card"
                                                    key={`${recommendation.type}-${index}`}
                                                >
                                                    <strong>
                                                        {recommendation.type?.replaceAll(
                                                            "_",
                                                            " "
                                                        )}
                                                    </strong>
                                                    <p>
                                                        {recommendation.message}
                                                    </p>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <p>
                                            {t("smartAnalysis.noRecommendations")}
                                        </p>
                                    )}
                                </div>
                            </section>

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SmartAnalysis;
