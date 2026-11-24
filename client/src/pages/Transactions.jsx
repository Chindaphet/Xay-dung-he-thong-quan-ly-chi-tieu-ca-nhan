
import {
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../styles/transactions.css";
import Header from "../components/layout/Header";
import SummaryCards from "../components/dashboard/SummaryCards";
import useLanguage from "../hooks/useLanguage";
import {
    getTransactions,
    getCategories,
    getPaymentMethods,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from "../services/api";

function Transactions({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t } = useLanguage();
    // State
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const transactionFormRef = useRef(null);

    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    // Add Transaction Form State
    const [showForm, setShowForm] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTransaction, setDeletingTransaction] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        type: "expense",
        categoryId: "",
        paymentMethodId: "",
        amount: "",
        transactionDate: new Date().toISOString().split("T")[0],
        description: "",
    });

    // Load transactions, categories and payment methods
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    transactionResponse,
                    categoryResponse,
                    paymentMethodResponse,
                ] = await Promise.all([
                    getTransactions(),
                    getCategories(),
                    getPaymentMethods(),
                ]);

                if (!cancelled) {
                    setTransactions(
                        transactionResponse.data.transactions || []
                    );

                    setCategories(
                        categoryResponse.data || []
                    );

                    setPaymentMethods(
                        paymentMethodResponse.data || []
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error.message ||
                        t("transactions.loadFailed")
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [retryCount,t]);

    // Retry loading transactions
    const handleRetry = () => {
        setRetryCount((count) => count + 1);
    };

    // Open Add Transaction Form
    const handleOpenForm = () => {
        setShowForm(true);
    };
    const handleEditTransaction = (transaction) => {
    setEditingTransactionId(transaction.transactions_id);
    setFormData({
        type: transaction.type,
        categoryId: transaction.category_id,
        paymentMethodId: transaction.payment_method_id || "",
        amount: transaction.amount,
        transactionDate: transaction.transaction_date.split("T")[0],
        description: transaction.description || "",
    });

    setShowForm(true);
    setTimeout(() => {
        transactionFormRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, 100);
};
// Open Delete Confirmation Modal
const handleDeleteTransaction = (transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
};

// Confirm Delete Transaction
const handleConfirmDelete = async () => {
    if (!deletingTransaction || deleting) {
        return;
    }

    setDeleting(true);
    setError("");

    try {
        await deleteTransaction(
            deletingTransaction.transactions_id
        );

        setShowDeleteModal(false);
        setDeletingTransaction(null);
        setRetryCount((count) => count + 1);
    } catch (error) {
        setError(error.message || t("transactions.deleteFailed"));
    } finally {
        setDeleting(false);
    }
};

// Cancel Delete
const handleCancelDelete = () => {
    if (deleting) {
        return;
    }
    setShowDeleteModal(false);
    setDeletingTransaction(null);
};
    // Close Add Transaction Form
    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTransactionId(null);
        setFormData({
            type: "expense",
            categoryId: "",
            paymentMethodId: "",
            amount: "",
            transactionDate: new Date().toISOString().split("T")[0],
            description: "",
        });
    };

    // Create a new transaction
    const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const transactionData = {
        type: formData.type,
        categoryId: formData.categoryId,
        paymentMethodId: formData.paymentMethodId || null,
        amount: Number(formData.amount),
        transactionDate: formData.transactionDate,
        description: formData.description.trim() || null,
    };

    try {
        if (editingTransactionId) {
            await updateTransaction(
                editingTransactionId,
                transactionData
            );
        } else {
            await createTransaction(transactionData);
        }

        setShowForm(false);
        setEditingTransactionId(null);

        setFormData({
            type: "expense",
            categoryId: "",
            paymentMethodId: "",
            amount: "",
            transactionDate: new Date().toISOString().split("T")[0],
            description: "",
        });

        setRetryCount((count) => count + 1);
    } catch (error) {
        setError(error.message || t("transactions.saveFailed"));
    }
};

    // Calculate transaction summary
    const totalIncome = transactions.reduce(
        (total, transaction) => {
            return transaction.type === "income"
                ? total + Number(transaction.amount)
                : total;
        },
        0
    );

    const totalExpenses = transactions.reduce(
        (total, transaction) => {
            return transaction.type === "expense"
                ? total + Number(transaction.amount)
                : total;
        },
        0
    );

    const netBalance = totalIncome - totalExpenses;

    // Filter transactions
    const filteredTransactions = transactions.filter((transaction) => {
        const matchesCategory =
            selectedCategory === "all" ||
            transaction.category_id === selectedCategory;

        const matchesType =
            selectedType === "all" ||
            transaction.type === selectedType;

        const matchesSearch =
            (transaction.description || "")
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase());

        const matchesStartDate =
            !startDate ||
            transaction.transaction_date >= startDate;

        const matchesEndDate =
            !endDate ||
            transaction.transaction_date <= endDate;

        return (
            matchesCategory &&
            matchesType &&
            matchesSearch &&
            matchesStartDate &&
            matchesEndDate
        );
    });
    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                <Header
                    title={t("transactions.title")}
                    subtitle={t("transactions.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />

                <div className="dashboard-content">
                    {loading && (
                        <div className="dashboard-message">
                            <div className="loading-spinner" />
                            <p>{t("transactions.loading")}</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="dashboard-error">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                {t("transactions.retry")}
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <SummaryCards
                                summary={{
                                    total_income: totalIncome,
                                    total_expenses: totalExpenses,
                                    net_balance: netBalance,
                                }}
                            />

                            <section className="transactions-content">
                                {/* Transactions Header */}
                                <div className="transactions-header">
                                    <h2>{t("transactions.allTransactions")}</h2>

                                    <button
                                        type="button"
                                        className="add-transaction-button"
                                        onClick={handleOpenForm}
                                    >
                                        <Plus size={18} strokeWidth={2} />{t("transactions.addTransaction")}
                                    </button>
                                </div>

                                {/* Add Transaction Form */}
                                {showForm && (
                                    <div className="transaction-form-container" ref={transactionFormRef} >
                                        <div className="transaction-form-header">
                                            <h3>{editingTransactionId
                                                    ? t("transactions.editTransaction")
                                                    : t("transactions.addNewTransaction")}
                                            </h3>

                                            <button
                                                type="button"
                                                onClick={handleCloseForm}
                                            >
                                                {t("transactions.cancel")}
                                            </button>
                                        </div>

                                        <form
                                            className="transaction-form"
                                            onSubmit={handleSubmit}
                                        >
                                            {/* Transaction Type - Row 1, Column 1 */}
                                            <div className="form-group">
                                                <label htmlFor="transaction-type">
                                                    {t("transactions.transactionType")}
                                                </label>

                                                <select
                                                    id="transaction-type"
                                                    value={formData.type}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            type: event.target.value,
                                                            categoryId: "",
                                                        })
                                                    }
                                                >
                                                    <option value="expense">
                                                        {t("transactions.expense")}
                                                    </option>

                                                    <option value="income">
                                                        {t("transactions.income")}
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Category - Row 2, Column 1 */}
                                            <div className="form-group">
                                                <label htmlFor="transaction-category">
                                                    {t("transactions.category")}

                                                </label>

                                                <select
                                                    id="transaction-category"
                                                    value={formData.categoryId}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            categoryId: event.target.value,
                                                        })
                                                    }
                                                    required
                                                >
                                                    <option value="">
                                                        {t("transactions.selectCategory")}
                                                    </option>

                                                    {categories
                                                        .filter(
                                                            (category) =>
                                                                category.type === formData.type
                                                        )
                                                        .map((category) => (
                                                            <option
                                                                key={category.category_id}
                                                                value={category.category_id}
                                                            >
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            {/* Payment Method - Row 1, Column 2 */}
                                            <div className="form-group">
                                                <label htmlFor="transaction-payment-method">
                                                    {t("transactions.selectPaymentMethod")}
                                                </label>

                                                <select
                                                    id="transaction-payment-method"
                                                    value={formData.paymentMethodId}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            paymentMethodId: event.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="">
                                                        {t("transactions.selectPaymentMethod")}
                                                    </option>

                                                    {paymentMethods.map((method) => (
                                                        <option
                                                            key={method.payment_method_id}
                                                            value={method.payment_method_id}
                                                        >
                                                            {method.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Amount - Row 2, Column 2 */}
                                            <div className="form-group">
                                                <label htmlFor="transaction-amount">
                                                    {t("transactions.amount")}
                                                </label>

                                                <input
                                                    id="transaction-amount"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder={t("transactions.enterAmount")}
                                                    value={formData.amount}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            amount: event.target.value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>

                                            {/* Date - Row 3, Column 1 */}
                                            <div className="form-group">
                                                <label htmlFor="transaction-date">
                                                    {t("transactions.date")}
                                                </label>

                                                <input
                                                    id="transaction-date"
                                                    type="date"
                                                    value={formData.transactionDate}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            transactionDate: event.target.value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>

                                            {/* Description - Row 3, Column 2 */}
                                            <div className="form-group">
                                                <label htmlFor="transaction-description">
                                                    {t("transactions.description")}
                                                </label>

                                                <textarea
                                                    id="transaction-description"
                                                    placeholder={t("transactions.enterDescription")}
                                                    rows="3"
                                                    maxLength="1000"
                                                    value={formData.description}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            description: event.target.value,
                                                        })
                                                    }
                                                />
                                            </div>

                                            {/* Form Actions */}
                                            <div className="transaction-form-actions">
                                                <button
                                                    type="button"
                                                    className="cancel-transaction-button"
                                                    onClick={handleCloseForm}
                                                >
                                                    {t("transactions.cancel")}
                                                </button>

                                                <button
                                                    type="submit"
                                                    className="save-transaction-button"
                                                >
                                                    {editingTransactionId
                                                        ? t("transactions.updateTransaction")
                                                        : t("transactions.saveTransaction")}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Transaction Filters */}
                                <div className="transactions-filters">
                                    {/* Search */}
                                    <input
                                        type="text"
                                        className="transaction-filter-select"
                                        placeholder={t("transactions.search")}
                                        value={searchTerm}
                                        onChange={(event) =>
                                            setSearchTerm(event.target.value)
                                        }
                                    />

                                    {/* Start Date Filter */}
                                    <input
                                        type="date"
                                        className="transaction-filter-select"
                                        value={startDate}
                                        onChange={(event) =>
                                            setStartDate(event.target.value)
                                        }
                                    />

                                    {/* End Date Filter */}
                                    <input
                                        type="date"
                                        className="transaction-filter-select"
                                        value={endDate}
                                        min={startDate || undefined}
                                        onChange={(event) =>
                                            setEndDate(event.target.value)
                                        }
                                    />

                                    {/* Transaction Type Filter */}
                                    <select
                                        className="transaction-filter-select"
                                        value={selectedType}
                                        onChange={(event) =>
                                            setSelectedType(event.target.value)
                                        }
                                    >
                                        <option value="all">{t("transactions.allTypes")}</option>
                                        <option value="income">{t("transactions.income")}</option>
                                        <option value="expense">{t("transactions.expense")}</option>
                                    </select>

                                    {/* Category Filter */}
                                    <select
                                        className="transaction-filter-select"
                                        value={selectedCategory}
                                        onChange={(event) =>
                                            setSelectedCategory(event.target.value)
                                        }
                                    >
                                        <option value="all">
                                            {t("transactions.allCategories")}
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

                                {/* Transactions Table */}
                                <div className="transactions-table-container">
                                    <table className="transactions-table">
                                        <thead>
    <tr>
        <th></th>
        <th>{t("transactions.date")}</th>
        <th>{t("transactions.description")}</th>
        <th>{t("transactions.category")}</th>
        <th>{t("transactions.transactionType")}</th>
        <th>{t("transactions.amount")}</th>
    </tr>
</thead>

                                        <tbody>
                                            {filteredTransactions.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        className="transactions-empty"
                                                    >
                                                        <div>
                                                            <p>{t("transactions.noTransactions")}</p>

                                                            <span>
                                                                {t("transactions.filterHint")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTransactions.map((transaction) => {
                                                    const category = categories.find(
                                                        (item) =>
                                                            item.category_id === transaction.category_id
                                                    );

                                                    return (
                                                        <tr key={transaction.transactions_id}>
                                                            <td className="transaction-actions">
                                                                {transaction.recurring_id ? (
                                                                    <span>-</span>
                                                                ) : (    
                                                                    <>
                                                                        <button 
                                                                            type="button"
                                                                            className="transaction-icon-button edit-icon-button"
                                                                            onClick={() => handleEditTransaction(transaction)}
                                                                            title={t("transactions.edit")}
                                                                            aria-label={t("transactions.edit")}>
                                                                                <Pencil size={16} strokeWidth={2} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                         className="transaction-icon-button delete-icon-button"
                                                                            onClick={() => handleDeleteTransaction(transaction)}
                                                                            title={t("transactions.delete")}
                                                                            aria-label={t("transactions.delete")}>
                                                                                <Trash2 size={16} strokeWidth={2} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td>{new Date(transaction.transaction_date).toLocaleDateString("en-GB")}</td>
                                                            <td>{transaction.description || "-"}</td>
                                                            <td>{category?.name || t("transactions.unknown")}</td>
                                                            <td>{transaction.type}</td>
                                                            <td>{Number(transaction.amount).toLocaleString("vi-VN")} ₫</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Delete Confirmation Modal */}
{showDeleteModal && (
    <div className="delete-modal-overlay">
        <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
            <div className="delete-modal-icon">
                <Trash2 size={24} strokeWidth={2} />
            </div>

            <h3 id="delete-modal-title">
                {t("transactions.deleteTitle")}
            </h3>

            <p>
                {t("transactions.deleteConfirmation")}
            </p>

            <div className="delete-modal-actions">
                <button
                    type="button"
                    className="cancel-delete-button"
                    onClick={handleCancelDelete}
                    disabled={deleting}
                >
                    {t("transactions.cancel")}
                </button>

                <button
                    type="button"
                    className="confirm-delete-button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                >
                    {deleting
    ? t("transactions.deleting")
    : t("transactions.delete")}
                </button>
            </div>
        </div>
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

export default Transactions;
