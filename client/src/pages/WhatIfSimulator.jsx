
import {
    TrendingDown,
    Wallet,
    PiggyBank,
    RotateCcw,
    Play,
    RefreshCw,
    GitCompareArrows,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useLanguage from "../hooks/useLanguage";
import Header from "../components/layout/Header";
import {
    getBudgetOverview,
    getCategories,
    runSimulator,
} from "../services/api";
import "../styles/what-if-simulator.css";

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
};

// Format money in VND
const formatCurrency = (value, language = "vi") => {
    return new Intl.NumberFormat(
        language === "vi" ? "vi-VN" : "en-US",
        {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }
    ).format(Number(value) || 0);
};

// Format percentage
const formatPercentage = (value) => {
    return `${(Number(value) || 0).toFixed(2)}%`;
};

// Convert a numeric input safely
const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
};

function WhatIfSimulator({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t, language } = useLanguage();

    // Selected simulation month
    const [selectedMonth, setSelectedMonth] = useState(
        getCurrentMonth
    );

    // Source data
    const [budgetData, setBudgetData] = useState(null);
    const [categories, setCategories] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    // Expense reduction settings
    const [expenseReductions, setExpenseReductions] = useState({});

    // Budget adjustment settings
    const [adjustedTotalBudget, setAdjustedTotalBudget] = useState("");
    const [adjustedCategoryBudgets, setAdjustedCategoryBudgets] =
        useState({});

    // Monthly savings target
    const [monthlySavingsTarget, setMonthlySavingsTarget] =
        useState("");

    // Simulation result
    const [simulationResult, setSimulationResult] = useState(null);
    const [simulating, setSimulating] = useState(false);
    const [simulationError, setSimulationError] = useState("");

    // Format currency according to selected language
    const formatMoney = (value) => {
        return formatCurrency(value, language);
    };

    // Get current budget information
    const budget = budgetData?.budget;
    const categoryBudgets = budgetData?.categoryBudgets || [];

    // Only active expense categories
    const expenseCategories = useMemo(() => {
        return categories.filter(
            (category) =>
                category.type === "expense"
        );
    }, [categories]);
    
    // Load budget and expense categories
    useEffect(() => {
        let cancelled = false;

        const loadSimulatorData = async () => {
            try {
                setLoading(true);
                setError("");
                setSimulationError("");
                setSimulationResult(null);

                const [budgetResponse, categoryResponse] =
                    await Promise.all([
                        getBudgetOverview(selectedMonth),
                        getCategories(),
                    ]);

                if (!cancelled) {
                    setBudgetData(budgetResponse.data);
                    setCategories(categoryResponse.data || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || t("whatIfSimulator.loadFailed")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadSimulatorData();

        return () => {
            cancelled = true;
        };
    }, [selectedMonth, retryCount, t]);


    // Get category budget by category ID
    const categoryBudgetMap = useMemo(() => {
        return Object.fromEntries(
            categoryBudgets.map((item) => [
                item.categoryId,
                Number(item.budgetAmount) || 0,
            ])
        );
    }, [categoryBudgets]);

    // Handle expense reduction percentage changes
    const handleExpenseReductionChange = (categoryId, value) => {
        setExpenseReductions((previous) => ({
            ...previous,
            [categoryId]: value,
        }));

        setSimulationResult(null);
        setSimulationError("");
    };

    // Handle total budget adjustment
    const handleTotalBudgetChange = (value) => {
        setAdjustedTotalBudget(value);

        setSimulationResult(null);
        setSimulationError("");
    };

    // Handle category budget adjustment
    const handleCategoryBudgetChange = (categoryId, value) => {
        setAdjustedCategoryBudgets((previous) => ({
            ...previous,
            [categoryId]: value,
        }));

        setSimulationResult(null);
        setSimulationError("");
    };

    // Handle monthly savings target
    const handleSavingsTargetChange = (value) => {
        setMonthlySavingsTarget(value);

        setSimulationResult(null);
        setSimulationError("");
    };

    // Reset all simulation settings
    const handleResetSimulation = () => {
        setExpenseReductions({});
        setAdjustedTotalBudget("");
        setAdjustedCategoryBudgets({});
        setMonthlySavingsTarget("");
        setSimulationResult(null);
        setSimulationError("");
    };

    // Run financial simulation
    const handleRunSimulation = async () => {
        try {
            setSimulating(true);
            setSimulationError("");
            setSimulationResult(null);

            const reductions = Object.entries(expenseReductions)
                .filter(([, percentage]) => {
                    return percentage !== "" &&
                        Number(percentage) > 0;
                })
                .map(([categoryId, percentage]) => ({
                    categoryId,
                    reductionPercentage: toNumber(percentage),
                }));

            const categoryAdjustments = Object.entries(
                adjustedCategoryBudgets
            )
                .filter(([, amount]) => {
                    return amount !== "" &&
                        Number(amount) >= 0;
                })
                .map(([categoryId, amount]) => ({
                    categoryId,
                    amount: toNumber(amount),
                }));

            const simulationData = {
                month: selectedMonth,
                expenseReductions: reductions,
                budgetAdjustment: {
                    ...(adjustedTotalBudget !== "" && {
                        totalAmount: toNumber(adjustedTotalBudget),
                    }),
                    ...(categoryAdjustments.length > 0 && {
                        categoryBudgets: categoryAdjustments,
                    }),
                },
                monthlySavingsTarget:
                    toNumber(monthlySavingsTarget),
            };

            const response = await runSimulator(simulationData);

            setSimulationResult(response.data);
        } catch (err) {
            setSimulationError(
                err.message || t("whatIfSimulator.simulationFailed")
            );
        } finally {
            setSimulating(false);
        }
    };

    // Actual financial data
    const actual = simulationResult?.actual;

    // Simulated financial data
    const simulation = simulationResult?.simulation;

    // Budget comparison data
    const budgetComparison = simulationResult?.budgetComparison;

    // Check whether budget data is available
    const hasBudget = Boolean(budget);

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                <Header
                    title={t("whatIfSimulator.title")}
                    subtitle={t("whatIfSimulator.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />

                <div className="what-if-simulator-content">

                    {/* Page Heading */}
                    <section className="simulator-page-heading">
                        <div>
                            <h2>{t("whatIfSimulator.overview")}</h2>
                            <p>{t("whatIfSimulator.description")}</p>
                        </div>

                        <div className="simulator-month-picker">
                            <label htmlFor="simulator-month">
                                {t("whatIfSimulator.selectMonth")}
                            </label>

                            <input
                                id="simulator-month"
                                type="month"
                                value={selectedMonth}
                                onChange={(event) => {
                                    setSelectedMonth(event.target.value);
                                    handleResetSimulation();
                                }}
                            />
                        </div>
                    </section>

                    {/* Loading */}
                    {loading && (
                        <div className="simulator-message">
                            <div className="loading-spinner" />
                            <p>{t("whatIfSimulator.loading")}</p>
                        </div>
                    )}

                    {/* Loading Error */}
                    {!loading && error && (
                        <div className="simulator-error">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() =>
                                    setRetryCount((count) => count + 1)
                                }
                            >
                                <RefreshCw size={16} strokeWidth={2} />
                                {t("whatIfSimulator.retry")}
                            </button>
                        </div>
                    )}

                    {/* Main Simulator Content */}
                    {!loading && !error && (
                        <div className="simulator-sections">
                        {/* Expense Reduction Section */}
                        <section className="simulator-section">
                            <div className="simulator-section-heading">
                                <div className="simulator-section-title">
                                    <TrendingDown size={22} strokeWidth={2} />
                                    <div>
                                        <h2>{t("whatIfSimulator.reduceExpenses")}</h2>
                                        <p>{t("whatIfSimulator.reduceExpensesDescription")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="simulator-category-list">
                                {expenseCategories.length > 0 ? (
                                    expenseCategories.map((category) => (
                                        <div
                                            className="simulator-category-card"
                                            key={category.category_id}
                                        >
                                            <div className="simulator-category-info">
                                                <strong>{category.name}</strong>

                                                <span>
                                                    {t("whatIfSimulator.currentCategoryBudget")}:{" "}
                                                    {formatMoney(
                                                        categoryBudgetMap[category.category_id] || 0
                                                    )}
                                                </span>
                                            </div>

                                            <div className="simulator-percentage-input">
                                                <label
                                                    htmlFor={`reduction-${category.category_id}`}
                                                >
                                                    {t("whatIfSimulator.reductionPercentage")}
                                                </label>

                                                <div className="simulator-input-with-suffix">
                                                    <input
                                                        id={`reduction-${category.category_id}`}
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        placeholder="0"
                                                        value={
                                                            expenseReductions[category.category_id] ?? ""
                                                        }
                                                        onChange={(event) =>
                                                            handleExpenseReductionChange(
                                                                category.category_id,
                                                                event.target.value
                                                            )
                                                        }
                                                    />

                                                    <span>%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="simulator-empty">
                                        {t("whatIfSimulator.noExpenseCategories")}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Budget Adjustment Section */}
                        <section className="simulator-section">
                            <div className="simulator-section-heading">
                            <div className="simulator-section-title">
                                <Wallet size={22} strokeWidth={2} />
                                <div>
                                    <h2>{t("whatIfSimulator.adjustBudget")}</h2>
                                    <p>{t("whatIfSimulator.adjustBudgetDescription")}</p>
                                </div>
                            </div>
                        </div>

    {!hasBudget ? (
        <p className="simulator-empty">
            {t("whatIfSimulator.noBudget")}
        </p>
    ) : (
        <>
            {/* Total Budget */}
            <div className="simulator-budget-total">
                <div className="simulator-category-info">
                    <strong>{t("whatIfSimulator.totalBudget")}</strong>
                    <span>
                        {t("whatIfSimulator.currentBudget")}:{" "}
                        {formatMoney(budget.totalAmount)}
                    </span>
                </div>

                <div className="simulator-budget-input">
                    <label htmlFor="adjusted-total-budget">
                        {t("whatIfSimulator.newTotalBudget")}
                    </label>

                    <input
                        id="adjusted-total-budget"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={String(budget.totalAmount)}
                        value={adjustedTotalBudget}
                        onChange={(event) =>
                            handleTotalBudgetChange(event.target.value)
                        }
                    />
                </div>
            </div>

            {/* Category Budgets */}
            <div className="simulator-category-list">
                <h3>{t("whatIfSimulator.categoryBudgets")}</h3>

                {categoryBudgets.map((item) => (
                    <div
                        className="simulator-category-card"
                        key={item.categoryId}
                    >
                        <div className="simulator-category-info">
                            <strong>{item.categoryName}</strong>
                            <span>
                                {t("whatIfSimulator.currentBudget")}:{" "}
                                {formatMoney(item.budgetAmount)}
                            </span>
                        </div>

                        <div className="simulator-budget-input">
                            <label
                                htmlFor={`budget-${item.categoryId}`}
                            >
                                {t("whatIfSimulator.newCategoryBudget")}
                            </label>

                            <input
                                id={`budget-${item.categoryId}`}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={String(item.budgetAmount)}
                                value={
                                    adjustedCategoryBudgets[item.categoryId] ?? ""
                                }
                                onChange={(event) =>
                                    handleCategoryBudgetChange(
                                        item.categoryId,
                                        event.target.value
                                    )
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
        </>
    )}
</section>

{/* Monthly Savings Goal Section */}
<section className="simulator-section">
    <div className="simulator-section-heading">
        <div className="simulator-section-title">
            <PiggyBank size={22} strokeWidth={2} />
            <div>
                <h2>{t("whatIfSimulator.monthlySavings")}</h2>
                <p>{t("whatIfSimulator.monthlySavingsDescription")}</p>
            </div>
        </div>
    </div>

    <div className="simulator-savings-input">
        <label htmlFor="monthly-savings-target">
            {t("whatIfSimulator.savingsTarget")}
        </label>

        <input
            id="monthly-savings-target"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={monthlySavingsTarget}
            onChange={(event) =>
                handleSavingsTargetChange(event.target.value)
            }
        />

        <p>
            {t("whatIfSimulator.savingsTargetHint")}
        </p>
    </div>
</section>

{/* Simulation Actions */}
<div className="simulator-actions">
    <button
        type="button"
        className="simulator-reset-button"
        onClick={handleResetSimulation}
        disabled={simulating}
    >
        <RotateCcw size={17} strokeWidth={2} />
        {t("whatIfSimulator.reset")}
    </button>

    <button
        type="button"
        className="simulator-run-button"
        onClick={handleRunSimulation}
        disabled={simulating}
    >
        <Play size={17} strokeWidth={2} />
        {simulating
            ? t("whatIfSimulator.simulating")
            : t("whatIfSimulator.runSimulation")}
    </button>
</div>

{/* Compare Results Section */}
{simulationResult && actual && simulation && (
    <section className="simulator-section simulator-results">
        <div className="simulator-section-heading">
            <div className="simulator-section-title">
                <GitCompareArrows size={22} strokeWidth={2} />
                <div>
                    <h2>{t("whatIfSimulator.compareResults")}</h2>
                    <p>{t("whatIfSimulator.compareResultsDescription")}</p>
                </div>
            </div>
        </div>

        {/* Financial Summary */}
        <div className="simulator-results-grid">
            <div className="simulator-result-card">
                <span>{t("whatIfSimulator.totalIncome")}</span>
                <strong>{formatMoney(actual.totalIncome)}</strong>
                <small>{t("whatIfSimulator.actual")}</small>
            </div>

            <div className="simulator-result-card">
                <span>{t("whatIfSimulator.actualExpenses")}</span>
                <strong>{formatMoney(actual.totalExpenses)}</strong>
                <small>{t("whatIfSimulator.actual")}</small>
            </div>

            <div className="simulator-result-card">
                <span>{t("whatIfSimulator.projectedExpenses")}</span>
                <strong>{formatMoney(simulation.projectedExpenses)}</strong>
                <small>{t("whatIfSimulator.simulated")}</small>
            </div>

            <div className="simulator-result-card">
                <span>{t("whatIfSimulator.expenseReduction")}</span>
                <strong>
                    {formatMoney(simulation.totalExpenseReduction)}
                </strong>
                <small>{t("whatIfSimulator.simulated")}</small>
            </div>
        </div>

        {/* Balance Comparison */}
        <div className="simulator-comparison">
            <h3>{t("whatIfSimulator.balanceComparison")}</h3>

            <div className="simulator-comparison-row">
                <span>{t("whatIfSimulator.actualBalance")}</span>
                <strong>{formatMoney(actual.netBalance)}</strong>
            </div>

            <div className="simulator-comparison-row">
                <span>{t("whatIfSimulator.projectedBalance")}</span>
                <strong>{formatMoney(simulation.projectedBalance)}</strong>
            </div>

            <div className="simulator-comparison-row">
                <span>{t("whatIfSimulator.savingsTarget")}</span>
                <strong>
                    {formatMoney(simulation.monthlySavingsTarget)}
                </strong>
            </div>

            <div className="simulator-comparison-row">
                <span>{t("whatIfSimulator.balanceAfterSavings")}</span>
                <strong>
                    {formatMoney(simulation.balanceAfterSavings)}
                </strong>
            </div>

            <div className="simulator-savings-status">
                <strong>
                    {simulation.canReachSavingsGoal
                        ? t("whatIfSimulator.savingsGoalAchievable")
                        : t("whatIfSimulator.savingsGoalNotAchievable")}
                </strong>
            </div>
        </div>

        {/* Expense Reduction Details */}
        {simulationResult.expenseReductions.length > 0 && (
            <div className="simulator-comparison">
                <h3>{t("whatIfSimulator.expenseReductionDetails")}</h3>

                {simulationResult.expenseReductions.map((item) => (
                    <div
                        className="simulator-comparison-row"
                        key={item.categoryId}
                    >
                        <span>
                            {item.categoryName} (
                            {formatPercentage(item.reductionPercentage)})
                        </span>

                        <strong>
                            {formatMoney(item.reductionAmount)}
                        </strong>
                    </div>
                ))}
            </div>
        )}

        {/* Budget Comparison */}
        {budgetComparison && (
            <div className="simulator-comparison">
                <h3>{t("whatIfSimulator.budgetComparison")}</h3>

                <div className="simulator-comparison-row">
                    <span>{t("whatIfSimulator.originalTotalBudget")}</span>
                    <strong>
                        {formatMoney(budgetComparison.originalTotalBudget)}
                    </strong>
                </div>

                <div className="simulator-comparison-row">
                    <span>{t("whatIfSimulator.adjustedTotalBudget")}</span>
                    <strong>
                        {formatMoney(budgetComparison.adjustedTotalBudget)}
                    </strong>
                </div>

                <div className="simulator-comparison-row">
                    <span>{t("whatIfSimulator.originalAllocatedBudget")}</span>
                    <strong>
                        {formatMoney(budgetComparison.originalAllocatedBudget)}
                    </strong>
                </div>

                <div className="simulator-comparison-row">
                    <span>{t("whatIfSimulator.adjustedAllocatedBudget")}</span>
                    <strong>
                        {formatMoney(budgetComparison.adjustedAllocatedBudget)}
                    </strong>
                </div>

                {budgetComparison.isTotalBudgetExceeded && (
                    <p className="simulator-budget-warning">
                        {t("whatIfSimulator.budgetExceeded")}
                    </p>
                )}
            </div>
        )}
    </section>
)}

{/* Simulation Error */}
{simulationError && (
    <div className="simulator-error">
        <p>{simulationError}</p>
    </div>
)}


                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default WhatIfSimulator;

    // Continue in the next step
