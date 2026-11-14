
import { useEffect, useRef, useState } from "react";
import useLanguage from "../hooks/useLanguage";
import Header from "../components/layout/Header";
import {
    getBudgetOverview,
    createBudget,
    updateBudget,
    getCategories,
    createCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
} from "../services/api";
import "../styles/Budget.css";

function Budget({
    user,
    isSidebarOpen,
    onToggleSidebar,
}) {
    const { t, language } = useLanguage();

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;
    });

    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [budgetAmount, setBudgetAmount] = useState("");
    const [savingBudget, setSavingBudget] = useState(false);
    const [formError, setFormError] = useState("");
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const budgetEditFormRef = useRef(null);
    const [editingBudgetAmount, setEditingBudgetAmount] = useState("");
    const [updatingBudget, setUpdatingBudget] = useState(false);
    const [editBudgetError, setEditBudgetError] = useState("");
    // Category Budget states
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const categoryAddFormRef = useRef(null);
    const [isAddingCategoryBudget, setIsAddingCategoryBudget] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [categoryBudgetAmount, setCategoryBudgetAmount] = useState("");
    const [savingCategoryBudget, setSavingCategoryBudget] = useState(false);
    const [categoryBudgetError, setCategoryBudgetError] = useState("");
    // Edit Category Budget
    const [editingCategoryBudgetId, setEditingCategoryBudgetId] = useState("");
    const categoryEditFormRef = useRef(null);
    const [editingCategoryBudgetAmount, setEditingCategoryBudgetAmount] = useState("");
    const [updatingCategoryBudget, setUpdatingCategoryBudget] = useState(false);
    // Delete Category Budget
    const [deletingCategoryBudgetId, setDeletingCategoryBudgetId] = useState("");

    const formatMoney = (value) => {
        return new Intl.NumberFormat(
            language === "vi" ? "vi-VN" : "en-US",
            {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
            }
        ).format(Number(value) || 0);
    };

    const formatMonth = (month) => {
        if (!month) return "";

        const [year, monthNumber] = month.split("-");

        return new Intl.DateTimeFormat(
            language === "vi" ? "vi-VN" : "en-US",
            {
                month: "long",
                year: "numeric",
            }
        ).format(new Date(Number(year), Number(monthNumber) - 1, 1));
    };

    useEffect(() => {
        let cancelled = false;

        const loadBudget = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getBudgetOverview(selectedMonth);
                console.log("CATEGORY BUDGET API:", response.data.categoryBudgets);

                if (!cancelled) {
                    setBudgetData(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || t("budget.loadFailed")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBudget();

        return () => {
            cancelled = true;
        };
    }, [selectedMonth,reloadKey, t]);
    // Load expense categories
useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);

            const response = await getCategories();

            if (!cancelled) {
                const expenseCategories = (response.data || []).filter(
                    (category) => category.type === "expense"
                );

                setCategories(expenseCategories);
            }
        } catch (err) {
            if (!cancelled) {
                setCategoryBudgetError(
                    err.message || "Failed to load categories."
                );
            }
        } finally {
            if (!cancelled) {
                setLoadingCategories(false);
            }
        }
    };

    loadCategories();

    return () => {
        cancelled = true;
    };
}, []);
useEffect(() => {
    if (isEditingBudget && budgetEditFormRef.current) {
        budgetEditFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
}, [isEditingBudget,t]);
useEffect(() => {
    if (editingCategoryBudgetId && categoryEditFormRef.current) {
        categoryEditFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
}, [editingCategoryBudgetId,t]);
useEffect(() => {
    if (isAddingCategoryBudget && categoryAddFormRef.current) {
        categoryAddFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
}, [isAddingCategoryBudget,t]);

    const handleCreateBudget = async (event) => {
    event.preventDefault();

    const amount = Number(budgetAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        setFormError(t("budget.amountRequired"));
        return;
    }

    try {
        setSavingBudget(true);
        setFormError("");

        await createBudget({
            month: selectedMonth,
            totalAmount: amount,
        });

        setBudgetAmount("");
        setReloadKey((prev) => prev + 1);
    } catch (err) {
        setFormError(err.message || t("budget.saveFailed"));
    } finally {
        setSavingBudget(false);
    }
};
    const handleUpdateBudget = async (event) => {
    event.preventDefault();

    const amount = Number(editingBudgetAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        setEditBudgetError(t("budget.amountRequired"));
        return;
    }

    try {
        setUpdatingBudget(true);
        setEditBudgetError("");

        await updateBudget(budget.budgetId, {
            totalAmount: amount,
        });

        setIsEditingBudget(false);
        setEditingBudgetAmount("");
        setReloadKey((prev) => prev + 1);
    } catch (err) {
        setEditBudgetError(
            err.message || t("budget.saveFailed")
        );
    } finally {
        setUpdatingBudget(false);
    }
};
    const handleCreateCategoryBudget = async (event) => {
    event.preventDefault();

    const amount = Number(categoryBudgetAmount);

    if (!selectedCategoryId) {
        setCategoryBudgetError(t("budget.categoryRequired"));
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        setCategoryBudgetError(t("budget.amountRequired"));
        return;
    }

    try {
        setSavingCategoryBudget(true);
        setCategoryBudgetError("");

        await createCategoryBudget(budget.budgetId, {
            categoryId: selectedCategoryId,
            amount,
        });

        setIsAddingCategoryBudget(false);
        setSelectedCategoryId("");
        setCategoryBudgetAmount("");
        setReloadKey((prev) => prev + 1);
    } catch (err) {
        setCategoryBudgetError(
            err.message || t("budget.saveFailed")
        );
    } finally {
        setSavingCategoryBudget(false);
    }
};
const handleUpdateCategoryBudget = async (event, categoryId) => {
    event.preventDefault();

    const amount = Number(editingCategoryBudgetAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        setCategoryBudgetError(t("budget.amountRequired"));
        return;
    }

    try {
        setUpdatingCategoryBudget(true);
        setCategoryBudgetError("");

        await updateCategoryBudget(
            budget.budgetId,
            categoryId,
            { amount }
        );

        setEditingCategoryBudgetId("");
        setEditingCategoryBudgetAmount("");
        setReloadKey((prev) => prev + 1);
    } catch (err) {
        setCategoryBudgetError(
            err.message || t("budget.saveFailed")
        );
    } finally {
        setUpdatingCategoryBudget(false);
    }
};
const handleDeleteCategoryBudget = async (categoryId) => {
    const confirmed = window.confirm(
        t("budget.confirmDelete")
    );

    if (!confirmed) return;

    try {
        setDeletingCategoryBudgetId(categoryId);
        setCategoryBudgetError("");

        await deleteCategoryBudget(
            budget.budgetId,
            categoryId
        );

        setReloadKey((prev) => prev + 1);
    } catch (err) {
        setCategoryBudgetError(
            err.message || t("budget.deleteFailed")
        );
    } finally {
        setDeletingCategoryBudgetId("");
    }
};
    const budget = budgetData?.budget;
    const categoryBudgets = budgetData?.categoryBudgets || [];
    const categorySummary = budgetData?.categoryBudgetSummary;

    const spent = Number(budget?.totalSpent || 0);
    const total = Number(budget?.totalAmount || 0);
    const remaining = Number(budget?.remainingAmount || 0);

    const progress = total > 0
        ? Math.min((spent / total) * 100, 100)
        : 0;

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                <Header
                    title={t("budget.title")}
                    subtitle={t("budget.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                />
                <div className="dashboard-content budget-content">
                    <div className="budget-page-heading">
                        <div>
                            <h2>{t("budget.monthlyBudget")}</h2>
                            <p>{formatMonth(selectedMonth)}</p>
                        </div>

                        <div className="budget-month-picker">
                            <label htmlFor="budget-month">
                                {t("budget.selectMonth")}
                            </label>

                            <input
                                id="budget-month"
                                type="month"
                                value={selectedMonth}
                                onChange={(event) =>
                                    setSelectedMonth(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="budget-message">
                            {t("budget.loading")}
                        </div>
                    ) : error ? (
                        <div className="budget-message budget-error">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => setReloadKey((prev) => prev + 1)}>
                                {t("budget.retry")}
                            </button>
                        </div>
                    ) : !budget ? (
    <div className="budget-empty">
        <h3>{t("budget.noBudget")}</h3>
        <p>{t("budget.subtitle")}</p>

        <form
            className="budget-create-form"
            onSubmit={handleCreateBudget}
        >
            <div className="budget-form-group">
                <label htmlFor="budget-amount">
                    {t("budget.budgetAmount")}
                </label>

                <input
                    id="budget-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={budgetAmount}
                    onChange={(event) => {
                        setBudgetAmount(event.target.value);
                        setFormError("");
                    }}
                    placeholder={t("budget.enterBudgetAmount")}
                    required
                />
            </div>

            {formError && (
                <p className="budget-form-error">
                    {formError}
                </p>
            )}

            <button
                type="submit"
                disabled={savingBudget}
            >
                {savingBudget
                    ? t("budget.loading")
                    : t("budget.createBudget")}
            </button>
        </form>
    </div>
                    ) : (
                        <>
                            <section className="budget-summary-grid">
                                <article className="budget-summary-card">
                                <div className="budget-summary-header">
                                    <span>{t("budget.totalBudget")}</span>

                                    <button
                                        type="button"
                                        className="budget-edit-button"
                                        onClick={() => {
                                            setEditingBudgetAmount(String(total));
                                            setEditBudgetError("");
                                            setIsEditingBudget(true);
                                        }}
                                    >
                                        {t("budget.editBudget")}
                                    </button>
                                </div>

                                <strong>{formatMoney(total)}</strong>
                            </article>

                                <article className="budget-summary-card">
                                    <span>{t("budget.totalSpent")}</span>
                                    <strong>{formatMoney(spent)}</strong>
                                </article>

                                <article className="budget-summary-card">
                                    <span>{t("budget.remainingBudget")}</span>
                                    <strong>{formatMoney(remaining)}</strong>
                                </article>
                            </section>
                            {isEditingBudget && (
    <form
        ref={budgetEditFormRef}
        className="budget-edit-form"
        onSubmit={handleUpdateBudget}
    >
        <div className="budget-form-group">
            <label htmlFor="edit-budget-amount">
                {t("budget.budgetAmount")}
            </label>

            <input
                id="edit-budget-amount"
                type="number"
                min="1"
                step="1"
                value={editingBudgetAmount}
                onChange={(event) => {
                    setEditingBudgetAmount(event.target.value);
                    setEditBudgetError("");
                }}
                placeholder={t("budget.enterBudgetAmount")}
                required
            />
        </div>

        {editBudgetError && (
            <p className="budget-form-error">
                {editBudgetError}
            </p>
        )}

        <div className="budget-edit-actions">
            <button type="submit" disabled={updatingBudget}>
                {updatingBudget
                    ? t("budget.loading")
                    : t("budget.updateBudget")}
            </button>

            <button
                type="button"
                onClick={() => {
                    setIsEditingBudget(false);
                    setEditingBudgetAmount("");
                    setEditBudgetError("");
                }}
            >
                Cancel
            </button>
        </div>
    </form>
)}
                            <section className="budget-progress-card">
                                <div className="budget-section-heading">
    <div>
        <h3>{t("budget.categoryBudgets")}</h3>
    </div>

    <div className="budget-category-heading-actions">
        <button
            type="button"
            className="budget-add-category-button"
            onClick={() => {
                setCategoryBudgetError("");
                setIsAddingCategoryBudget(true);
            }}
        >
            + {t("budget.addCategoryBudget")}
        </button>
    </div>
</div>

                                <div className="budget-progress-track">
                                    <div
                                        className={`budget-progress-fill ${
                                            spent > total ? "exceeded" : ""
                                        }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="budget-progress-footer">
                                    <span>{t("budget.totalBudget")}: {formatMoney(total)}</span>
                                    <span>{t("budget.remaining")}: {formatMoney(remaining)}</span>
                                </div>
                            </section>

                            <section className="budget-category-section">
                                <div className="budget-section-heading">
                                    <div>
                                        <h3>{t("budget.categoryBudgets")}</h3>
                                    </div>
                                    <span className="budget-category-count">
                                        Categories: {categoryBudgets.length} 
                                    </span>
                                </div>
                                {isAddingCategoryBudget && (
    <form
        ref={categoryAddFormRef}
        className="budget-category-form"
        onSubmit={handleCreateCategoryBudget}
    >
        <div className="budget-form-group">
            <label htmlFor="category-budget-category">
                {t("budget.selectCategory")}
            </label>

            <select
                id="category-budget-category"
                value={selectedCategoryId}
                onChange={(event) => {
                    setSelectedCategoryId(event.target.value);
                    setCategoryBudgetError("");
                }}
                required
            >
                <option value="">
                    {t("budget.selectCategory")}
                </option>

                {categories.map((category) => (
                    <option
                        key={category.category_id}
                        value={category.category_id}
                    >
                        {category.name}
                    </option>
                ))}
            </select>
        </div>

        <div className="budget-form-group">
            <label htmlFor="category-budget-amount">
                {t("budget.allocatedAmount")}
            </label>

            <input
                id="category-budget-amount"
                type="number"
                min="1"
                step="1"
                value={categoryBudgetAmount}
                onChange={(event) => {
                    setCategoryBudgetAmount(event.target.value);
                    setCategoryBudgetError("");
                }}
                placeholder={t("budget.enterAllocatedAmount")}
                required
            />
        </div>

        {categoryBudgetError && (
            <p className="budget-form-error">
                {categoryBudgetError}
            </p>
        )}

        <div className="budget-edit-actions">
            <button type="submit" disabled={savingCategoryBudget}>
                {savingCategoryBudget
                    ? t("budget.loading")
                    : t("budget.saveBudget")}
            </button>

            <button
                type="button"
                onClick={() => {
                    setIsAddingCategoryBudget(false);
                    setSelectedCategoryId("");
                    setCategoryBudgetAmount("");
                    setCategoryBudgetError("");
                }}
            >
                Cancel
            </button>
        </div>
    </form>
)}

                                {categoryBudgets.length === 0 ? (
                                    <div className="budget-empty-category">
                                        {t("budget.noCategoryBudgets")}
                                    </div>
                                ) : (
                                        <div className="budget-category-list">
                                        {categoryBudgets.map((item) => {
                                        const categoryTotal = Number(item.budgetAmount || 0);
                                        const categorySpent = Number(item.totalSpent || 0);

                                        const categoryPercentage =
                                            categoryTotal > 0
                                                ? (categorySpent / categoryTotal) * 100
                                                : 0;

                                        const categoryProgress = Math.min(categoryPercentage, 100);

                                        return (
                                        <article
                                            className="budget-category-card"
                                            key={item.budgetCategoryId || item.categoryId}
                                        >
                                                <div>
                                                    <h4>{item.categoryName}</h4>
                                                    {editingCategoryBudgetId === item.categoryId && (
    <form
        ref={categoryEditFormRef}
        className="budget-category-edit-form"
        onSubmit={(event) =>
            handleUpdateCategoryBudget(event, item.categoryId)
        }
    >
        <input
            type="number"
            min="1"
            value={editingCategoryBudgetAmount}
            onChange={(event) =>
                setEditingCategoryBudgetAmount(event.target.value)
            }
            placeholder={t("budget.enterAllocatedAmount")}
        />

        {categoryBudgetError && (
            <p className="budget-form-error">{categoryBudgetError}</p>
        )}

        <button type="submit" disabled={updatingCategoryBudget}>
            {updatingCategoryBudget ? t("budget.loading") : t("budget.saveBudget")}
        </button>

        <button
            type="button"
            onClick={() => {
                setEditingCategoryBudgetId("");
                setEditingCategoryBudgetAmount("");
                setCategoryBudgetError("");
            }}
        >
            Cancel
        </button>
    </form>
)}
                                                    
                                                    <p>
                                                        {t("budget.spent")}:{" "}
                                                        {formatMoney(item.totalSpent)}
                                                    </p>
                                                    <div className="budget-category-progress-track">
                                                        <div
                                                            className={`budget-category-progress-fill ${
                                                                categorySpent > categoryTotal ? "exceeded" : ""
                                                            }`}
                                                            style={{
                                                                width: `${categoryProgress}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <p className="budget-category-progress-label">
                                                        {categoryPercentage.toFixed(1)}%
                                                    </p>
                                                    {Number(item.remainingAmount) < 0 && (
                                                    <p className="budget-category-warning">
                                                        ⚠ Over budget by:{" "}
                                                        {formatMoney(Math.abs(Number(item.remainingAmount)))}
                                                    </p>
                                                )}
                                                </div>

                                                <div className="budget-category-amount">
                        <strong>
                            {formatMoney(item.budgetAmount)}
                        </strong>

                        <p className="budget-category-remaining">
                            {t("budget.remaining")}:{" "}
                            {formatMoney(item.remainingAmount)}
                        </p>

                        <p
                            className={
                                Number(item.remainingAmount) < 0
                                    ? "budget-category-exceeded"
                                    : "budget-category-within"
                            }
                        >
                            {Number(item.remainingAmount) < 0
                                ? t("budget.exceeded")
                                : t("budget.withinBudget")}
                        </p>

                        <div className="budget-category-actions">
                            <button
                                type="button"
                                className="budget-edit-category-button"
                                onClick={() => {
                                    setEditingCategoryBudgetId(item.categoryId);
                                    setEditingCategoryBudgetAmount(item.budgetAmount);
                                    setCategoryBudgetError("");
                                }}
                            >
                                {t("budget.editBudget")}
                            </button>

                            <button
                                type="button"
                                className="budget-delete-category-button"
                                disabled={deletingCategoryBudgetId === item.categoryId}
                                onClick={() =>
                                    handleDeleteCategoryBudget(item.categoryId)
                                }
                            >
                                {deletingCategoryBudgetId === item.categoryId
                                    ? t("budget.loading")
                                    : "Delete"}
                            </button>
                        </div>
                    </div>
                                            </article>
                                        );
                                    })}

                                    </div>
                                    )}

                                {categorySummary?.isExceeded && (
                                    <div className="budget-allocation-warning">
                                        {t("budget.allocationWarning")}
                                        {" "}
                                        {formatMoney(
                                            categorySummary.exceededAmount
                                        )}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Budget;