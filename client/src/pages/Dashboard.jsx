
import { useEffect, useState } from "react";
import useLanguage from "../hooks/useLanguage";
import "../styles/dashboard.css";
import Header from "../components/layout/Header";

import SummaryCards from "../components/dashboard/SummaryCards";
import IncomeExpenseChart from "../components/dashboard/IncomeExpenseChart";
import ExpenseCategoryChart from "../components/dashboard/ExpenseCategoryChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";

import { getDashboardOverview } from "../services/api";

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

function Dashboard({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t } = useLanguage();

    const [startDate, setStartDate] = useState(getMonthStart);
    const [endDate, setEndDate] = useState(getLocalDate);

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    // Load dashboard data whenever the date range or retry count changes
    useEffect(() => {
        let cancelled = false;

        const fetchDashboard = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getDashboardOverview(
                    startDate,
                    endDate
                );

                if (!cancelled) {
                    setDashboardData(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error.message ||
                        t("dashboard.loadFailed")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDashboard();

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

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                <Header
                    title={t("dashboard.title")}
                    subtitle={t("dashboard.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />

                <div className="dashboard-content">
                    {/* Date Filter */}
                    <section className="dashboard-filter">
                        <div className="filter-heading">
                            <h2>{t("dashboard.financialOverview")}</h2>
                            <p>
                                {t("dashboard.reviewDescription")}
                            </p>
                        </div>

                        <div className="date-filter">
                            <div className="date-filter-group">
                                <label htmlFor="start-date">
                                    {t("dashboard.from")}
                                </label>

                                <input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    max={endDate}
                                    onChange={handleStartDateChange}
                                />
                            </div>

                            <div className="date-filter-group">
                                <label htmlFor="end-date">
                                    {t("dashboard.to")}
                                </label>

                                <input
                                    id="end-date"
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
                        <div className="dashboard-message">
                            <div className="loading-spinner" />
                            <p>{t("dashboard.loading")}</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="dashboard-error">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                {t("dashboard.retry")}
                            </button>
                        </div>
                    )}

                    {/* Dashboard Content */}
                    {!loading && !error && dashboardData && (
                        <div className="dashboard-sections">

                            <SummaryCards
                                summary={dashboardData.summary}
                            />

                            <div className="dashboard-chart-grid">
                                <IncomeExpenseChart
                                    data={
                                        dashboardData.incomeExpenseTrend
                                    }
                                />

                                <ExpenseCategoryChart
                                    data={
                                        dashboardData.expenseByCategory
                                    }
                                />
                            </div>

                            <RecentTransactions
                                data={
                                    dashboardData.recentTransactions
                                }
                            />

                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default Dashboard;
