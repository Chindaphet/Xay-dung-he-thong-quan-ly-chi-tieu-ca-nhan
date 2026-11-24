
import {
    Repeat,
    CircleCheck,
    CirclePause,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../styles/recurring.css";
import Header from "../components/layout/Header";
import useLanguage from "../hooks/useLanguage";

import {
    getRecurring,
    getCategories,
    getPaymentMethods,
    createRecurring,
    updateRecurring,
    toggleRecurring,
} from "../services/api";

// Get today's date in local timezone
const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Format date for display
const formatDate = (value) => {
    if (!value) return "-";

    const dateString = String(value).split("T")[0];
    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
};

function Recurring({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t } = useLanguage();
    const recurringFormRef = useRef(null);

    // Data states
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingRecurringId, setEditingRecurringId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    // Filter states
    const [selectedType, setSelectedType] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedFrequency, setSelectedFrequency] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const initialFormData = {
        type: "expense",
        categoryId: "",
        paymentMethodId: "",
        amount: "",
        description: "",
        frequency: "monthly",
        startDate: getToday(),
        endDate: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    // Load recurring transactions and related data
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    recurringResponse,
                    categoryResponse,
                    paymentMethodResponse,
                ] = await Promise.all([
                    getRecurring(),
                    getCategories(),
                    getPaymentMethods(),
                ]);

                if (!cancelled) {
                    setRecurringTransactions(
                        recurringResponse.data || []
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
                        t("recurring.loadFailed")
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
    }, [retryCount, t]);

    // Retry loading data
    const handleRetry = () => {
        setRetryCount((count) => count + 1);
    };

    // Open create form
    const handleOpenForm = () => {
        setEditingRecurringId(null);
        setFormData({
            ...initialFormData,
            startDate: getToday(),
        });
        setShowForm(true);
    };

    // Open edit form
    const handleEditRecurring = (recurring) => {
        setEditingRecurringId(recurring.recurring_id);

        setFormData({
            type: recurring.type,
            categoryId: recurring.category_id,
            paymentMethodId: recurring.payment_method_id || "",
            amount: recurring.amount,
            description: recurring.description || "",
            frequency: recurring.frequency,
            startDate: String(recurring.start_date).split("T")[0],
            endDate: recurring.end_date
                ? String(recurring.end_date).split("T")[0]
                : "",
        });

        setShowForm(true);

        setTimeout(() => {
            recurringFormRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    };

    // Close form
    const handleCloseForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingRecurringId(null);
        setFormData({
            ...initialFormData,
            startDate: getToday(),
        });
    };

    // Handle form input changes
    const handleFormChange = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // Submit create or update
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const startDate = formData.startDate;
        const endDate = formData.endDate || null;

        if (!formData.amount || Number(formData.amount) <= 0) {
            setError(t("recurring.amountRequired"));
            return;
        }

        if (!formData.categoryId) {
            setError(t("recurring.categoryRequired"));
            return;
        }

        if (!formData.frequency) {
            setError(t("recurring.frequencyRequired"));
            return;
        }

        if (!startDate) {
            setError(t("recurring.startDateRequired"));
            return;
        }

        if (endDate && endDate < startDate) {
            setError(t("recurring.endDateInvalid"));
            return;
        }

        const recurringData = {
            type: formData.type,
            categoryId: formData.categoryId,
            paymentMethodId: formData.paymentMethodId || null,
            amount: Number(formData.amount),
            description: formData.description.trim() || null,
            frequency: formData.frequency,
            startDate,
            endDate,
        };

        setSaving(true);

        try {
            if (editingRecurringId) {
                await updateRecurring(
                    editingRecurringId,
                    recurringData
                );
            } else {
                await createRecurring(recurringData);
            }

            setShowForm(false);
            setEditingRecurringId(null);
            setFormData({
                ...initialFormData,
                startDate: getToday(),
            });

            setRetryCount((count) => count + 1);
        } catch (error) {
            setError(
                error.message ||
                t("recurring.saveFailed")
            );
        } finally {
            setSaving(false);
        }
    };

    // Activate or deactivate recurring transaction
    const handleToggleStatus = async (recurring) => {
        if (updatingStatusId) return;

        setError("");
        setUpdatingStatusId(recurring.recurring_id);

        try {
            await toggleRecurring(
                recurring.recurring_id,
                !recurring.is_active
            );

            setRetryCount((count) => count + 1);
        } catch (error) {
            setError(
                error.message ||
                t("recurring.statusFailed")
            );
        } finally {
            setUpdatingStatusId(null);
        }
    };
    // Recurring summary
    const totalRecurring = recurringTransactions.length;

    const activeRecurring = recurringTransactions.filter(
        (recurring) => recurring.is_active
    ).length;

    const inactiveRecurring = totalRecurring - activeRecurring;
    // Filter recurring transactions
const filteredRecurring = recurringTransactions.filter(
    (recurring) => {
        const matchesType =
            selectedType === "all" ||
            recurring.type === selectedType;

        const matchesStatus =
            selectedStatus === "all" ||
            (selectedStatus === "active" && recurring.is_active) ||
            (selectedStatus === "inactive" && !recurring.is_active);

        const matchesFrequency =
            selectedFrequency === "all" ||
            recurring.frequency === selectedFrequency;

        const searchValue = searchTerm.trim().toLowerCase();

        const matchesSearch =
            !searchValue ||
            (recurring.description || "")
                .toLowerCase()
                .includes(searchValue);

        return (
            matchesType &&
            matchesStatus &&
            matchesFrequency &&
            matchesSearch
        );
    }
);

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                <Header
                    title={t("recurring.title")}
                    subtitle={t("recurring.subtitle")}
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
                            <p>{t("recurring.loading")}</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="dashboard-error">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                {t("recurring.retry")}
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <section className="recurring-content">
                            {/* Page Header */}
                            <div className="recurring-header">
                                <h2>
                                    {t("recurring.allRecurring")}
                                </h2>

                                <button
                                    type="button"
                                    className="add-recurring-button"
                                    onClick={handleOpenForm}
                                >
                                    + {t("recurring.addRecurring")}
                                </button>
                            </div>
                            {/* Recurring Summary */}
<div className="recurring-summary">
    <div className="recurring-summary-card">
        <div className="recurring-summary-info">
            <span>{t("recurring.totalRecurring")}</span>
            <h3>{totalRecurring}</h3>
        </div>
        <div className="recurring-summary-icon total">
            <Repeat size={22} strokeWidth={2} />
        </div>
    </div>

    <div className="recurring-summary-card">
        <div className="recurring-summary-info">
            <span>{t("recurring.active")}</span>
            <h3>{activeRecurring}</h3>
        </div>
        <div className="recurring-summary-icon active">
            <CircleCheck size={22} strokeWidth={2} />
        </div>
    </div>

    <div className="recurring-summary-card">
        <div className="recurring-summary-info">
            <span>{t("recurring.inactive")}</span>
            <h3>{inactiveRecurring}</h3>
        </div>
        <div className="recurring-summary-icon inactive">
            <CirclePause size={22} strokeWidth={2} />
        </div>
    </div>
</div>
                            {/* Recurring Form */}
                            {showForm && (
                                <div
                                    className="recurring-form-container"
                                    ref={recurringFormRef}
                                >
                                    <div className="recurring-form-header">
                                        <h3>
                                            {editingRecurringId
                                                ? t("recurring.editRecurring")
                                                : t("recurring.addNewRecurring")}
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            disabled={saving}
                                        >
                                            {t("recurring.cancel")}
                                        </button>
                                    </div>

                                    <form
                                        className="recurring-form"
                                        onSubmit={handleSubmit}
                                    >
                                        {/* Transaction Type */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-type">
                                                {t("recurring.transactionType")}
                                            </label>

                                            <select
                                                id="recurring-type"
                                                value={formData.type}
                                                onChange={(event) => {
                                                    handleFormChange(
                                                        "type",
                                                        event.target.value
                                                    );
                                                    handleFormChange(
                                                        "categoryId",
                                                        ""
                                                    );
                                                }}
                                            >
                                                <option value="expense">
                                                    {t("recurring.expense")}
                                                </option>
                                                <option value="income">
                                                    {t("recurring.income")}
                                                </option>
                                            </select>
                                        </div>

                                        {/* Category */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-category">
                                                {t("recurring.category")}
                                            </label>

                                            <select
                                                id="recurring-category"
                                                value={formData.categoryId}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "categoryId",
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            >
                                                <option value="">
                                                    {t("recurring.selectCategory")}
                                                </option>

                                                {categories
                                                    .filter(
                                                        (category) =>
                                                            category.type === formData.type &&
                                                            category.is_active
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

                                        {/* Payment Method */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-payment-method">
                                                {t("recurring.paymentMethod")}
                                            </label>

                                            <select
                                                id="recurring-payment-method"
                                                value={formData.paymentMethodId}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "paymentMethodId",
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    {t("recurring.noPaymentMethod")}
                                                </option>

                                                {paymentMethods
                                                    .filter((method) => method.is_active)
                                                    .map((method) => (
                                                        <option
                                                            key={method.payment_method_id}
                                                            value={method.payment_method_id}
                                                        >
                                                            {method.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        {/* Amount */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-amount">
                                                {t("recurring.amount")}
                                            </label>

                                            <input
                                                id="recurring-amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder={t("recurring.enterAmount")}
                                                value={formData.amount}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "amount",
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        {/* Frequency */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-frequency">
                                                {t("recurring.frequency")}
                                            </label>

                                            <select
                                                id="recurring-frequency"
                                                value={formData.frequency}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "frequency",
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            >
                                                <option value="daily">
                                                    {t("recurring.daily")}
                                                </option>
                                                <option value="weekly">
                                                    {t("recurring.weekly")}
                                                </option>
                                                <option value="monthly">
                                                    {t("recurring.monthly")}
                                                </option>
                                                <option value="yearly">
                                                    {t("recurring.yearly")}
                                                </option>
                                            </select>
                                        </div>

                                        {/* Start Date */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-start-date">
                                                {t("recurring.startDate")}
                                            </label>

                                            <input
                                                id="recurring-start-date"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "startDate",
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-end-date">
                                                {t("recurring.endDate")}
                                            </label>

                                            <input
                                                id="recurring-end-date"
                                                type="date"
                                                min={formData.startDate}
                                                value={formData.endDate}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "endDate",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="form-group">
                                            <label htmlFor="recurring-description">
                                                {t("recurring.description")}
                                            </label>

                                            <textarea
                                                id="recurring-description"
                                                rows="3"
                                                maxLength="1000"
                                                placeholder={t("recurring.enterDescription")}
                                                value={formData.description}
                                                onChange={(event) =>
                                                    handleFormChange(
                                                        "description",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        {/* Form Actions */}
                                        <div className="recurring-form-actions">
                                            <button
                                                type="button"
                                                className="cancel-recurring-button"
                                                onClick={handleCloseForm}
                                                disabled={saving}
                                            >
                                                {t("recurring.cancel")}
                                            </button>

                                            <button
                                                type="submit"
                                                className="save-recurring-button"
                                                disabled={saving}
                                            >
                                                {saving
                                                    ? t("common.loading")
                                                    : editingRecurringId
                                                        ? t("recurring.updateRecurring")
                                                        : t("recurring.saveRecurring")}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Search and Filters */}
<div className="recurring-toolbar">
    <div className="recurring-search">
        <i className="fas fa-search"></i>
        <input
            type="text"
            placeholder={t("recurring.searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
        />
        {searchTerm && (
            <button
                type="button"
                className="recurring-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label={t("recurring.clearSearch")}
            >
                <i className="fas fa-times"></i>
            </button>
        )}
    </div>

    <div className="recurring-filters">
        <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
        >
            <option value="all">
                {t("transactions.allTypes")}
            </option>
            <option value="income">
                {t("recurring.income")}
            </option>
            <option value="expense">
                {t("recurring.expense")}
            </option>
        </select>

        <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
        >
            <option value="all">
                {t("recurring.status")}
            </option>
            <option value="active">
                {t("recurring.active")}
            </option>
            <option value="inactive">
                {t("recurring.inactive")}
            </option>
        </select>

        <select
            value={selectedFrequency}
            onChange={(event) => setSelectedFrequency(event.target.value)}
        >
            <option value="all">
                {t("recurring.allFrequencies")}
            </option>
            <option value="daily">{t("recurring.daily")}</option>
            <option value="weekly">{t("recurring.weekly")}</option>
            <option value="monthly">{t("recurring.monthly")}</option>
            <option value="yearly">{t("recurring.yearly")}</option>
        </select>
    </div>
</div>

                            {/* Recurring Table */}
                            <div className="recurring-table-container">
                                <table className="recurring-table">
                                    <thead>
                                        <tr>
                                            <th>{t("recurring.description")}</th>
                                            <th>{t("recurring.category")}</th>
                                            <th>{t("recurring.transactionType")}</th>
                                            <th>{t("recurring.amount")}</th>
                                            <th>{t("recurring.frequency")}</th>
                                            <th>{t("recurring.nextDueDate")}</th>
                                            <th>{t("recurring.status")}</th>
                                            <th>{t("common.actions")}</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredRecurring.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="8"
                                                    className="recurring-empty"
                                                >
                                                    <p>
                                                        {t("recurring.noRecurring")}
                                                    </p>
                                                    <span>
                                                        {t("recurring.filterHint")}
                                                    </span>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRecurring.map((recurring) => {
                                                const category = categories.find(
                                                    (item) =>
                                                        item.category_id === recurring.category_id
                                                );

                                                const paymentMethod = paymentMethods.find(
                                                    (item) =>
                                                        item.payment_method_id === recurring.payment_method_id
                                                );

                                                return (
                                                    <tr key={recurring.recurring_id}>
                                                        <td>
                                                            <strong>
                                                                {recurring.description || "-"}
                                                            </strong>
                                                            <small>
                                                                {paymentMethod?.name ||
                                                                    t("recurring.noPaymentMethod")}
                                                            </small>
                                                        </td>

                                                        <td>
                                                            {category?.name ||
                                                                t("transactions.unknown")}
                                                        </td>

                                                        <td>
                                                            {recurring.type === "income"
                                                                ? t("recurring.income")
                                                                : t("recurring.expense")}
                                                        </td>

                                                        <td>
                                                            {Number(
                                                                recurring.amount
                                                            ).toLocaleString("vi-VN")} ₫
                                                        </td>

                                                        <td>
                                                            {t(`recurring.${recurring.frequency}`)}
                                                        </td>

                                                        <td>
                                                            {formatDate(
                                                                recurring.next_due_date
                                                            )}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={
                                                                    recurring.is_active
                                                                        ? "recurring-status active"
                                                                        : "recurring-status inactive"
                                                                }
                                                            >
                                                                {recurring.is_active
                                                                    ? t("recurring.active")
                                                                    : t("recurring.inactive")}
                                                            </span>
                                                        </td>

                                                        <td className="recurring-actions">
                                                            <button
                                                                type="button"
                                                                className="recurring-edit-button"
                                                                onClick={() =>
                                                                    handleEditRecurring(recurring)
                                                                }
                                                                disabled={updatingStatusId !== null}
                                                            >
                                                                {t("recurring.edit")}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={
                                                                    recurring.is_active
                                                                        ? "recurring-deactivate-button"
                                                                        : "recurring-activate-button"
                                                                }
                                                                onClick={() =>
                                                                    handleToggleStatus(recurring)
                                                                }
                                                                disabled={
                                                                    updatingStatusId !== null
                                                                }
                                                            >
                                                                {updatingStatusId === recurring.recurring_id
                                                                    ? t("common.loading")
                                                                    : recurring.is_active
                                                                        ? t("recurring.deactivate")
                                                                        : t("recurring.activate")}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Recurring;
