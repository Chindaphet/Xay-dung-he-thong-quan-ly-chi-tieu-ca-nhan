
import {
    Plus,
    Search,
    Pencil,
} from "lucide-react";
import { useEffect, useState } from "react";
import "../styles/payment-methods.css";
import Header from "../components/layout/Header";
import useLanguage from "../hooks/useLanguage";

import {
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethod,
} from "../services/api";

function PaymentMethods({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t } = useLanguage();

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        type: "cash",
    });

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getPaymentMethods(true);
                setPaymentMethods(response.data || []);
            } catch (err) {
                setError(
                    err.message || t("paymentMethods.loadFailed")
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentMethods();
    }, [retryCount, t]);

    const resetForm = () => {
        setFormData({
            name: "",
            type: "cash",
        });

        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleEdit = (method) => {
        setEditingId(method.payment_method_id);

        setFormData({
            name: method.name,
            type: method.type || "cash",
        });

        setShowForm(true);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const name = formData.name.trim();

        if (!name) {
            setError(t("paymentMethods.nameRequired"));
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            if (editingId) {
                await updatePaymentMethod(editingId, {
                    name,
                    type: formData.type,
                });
            } else {
                await createPaymentMethod({
                    name,
                    type: formData.type,
                });
            }

            resetForm();
            setRetryCount((count) => count + 1);
        } catch (err) {
            setError(
                err.message ||
                (editingId
                    ? t("paymentMethods.updateFailed")
                    : t("paymentMethods.createFailed"))
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (method) => {
        try {
            await togglePaymentMethod(
                method.payment_method_id,
                !method.is_active
            );

            setRetryCount((count) => count + 1);
        } catch (err) {
            setError(
                err.message || t("paymentMethods.statusFailed")
            );
        }
    };

    const handleRetry = () => {
        setRetryCount((count) => count + 1);
    };
    const filteredPaymentMethods = paymentMethods.filter((method) => {
    const matchesSearch = method.name
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

    const matchesType =
        filterType === "all" || method.type === filterType;

    const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && method.is_active) ||
        (filterStatus === "inactive" && !method.is_active);

    return matchesSearch && matchesType && matchesStatus;
    });
    const activePaymentMethods = paymentMethods.filter(
        (method) => method.is_active
    );
    const inactivePaymentMethods = paymentMethods.filter(
        (method) => !method.is_active
    );
        return (
        <div className="app-layout">
            <main className="main-content">
                <Header
                    title={t("paymentMethods.title")}
                    subtitle={t("paymentMethods.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />

                <section className="page-content">
                    <div className="page-header">
                        <div>
                            <h1>{t("paymentMethods.title")}</h1>
                            <p>{t("paymentMethods.subtitle")}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setShowForm((previous) => !previous);
                            }}
                        >
                            <Plus size={18} strokeWidth={2} />
                            {t("paymentMethods.add")}
                        </button>
                    </div>
                    <div className="payment-method-summary">
                        <div className="summary-card">
                            <span>{t("paymentMethods.total")}</span>
                            <strong>{paymentMethods.length}</strong>
                        </div>

                        <div className="summary-card">
                            <span>{t("paymentMethods.active")}</span>
                            <strong>{activePaymentMethods.length}</strong>
                        </div>

                        <div className="summary-card">
                            <span>{t("paymentMethods.inactive")}</span>
                            <strong>{inactivePaymentMethods.length}</strong>
                        </div>
                    </div>
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                {t("paymentMethods.retry")}
                            </button>
                        </div>
                    )}

                    {showForm && (
                        <form
                            className="category-form"
                            onSubmit={handleSubmit}
                        >
                            <h2>
                                {editingId
                                    ? t("paymentMethods.edit")
                                    : t("paymentMethods.addNew")}
                            </h2>

                            <div className="form-group">
                                <label htmlFor="payment-name">
                                    {t("paymentMethods.name")}
                                </label>

                                <input
                                    id="payment-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t("paymentMethods.enterName")}
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="payment-type">
                                    {t("paymentMethods.type")}
                                </label>

                                
<select
    id="payment-type"
    name="type"
    value={formData.type}
    onChange={handleInputChange}
    required
>
    <option value="cash">
        {t("paymentMethods.cash")}
    </option>

    <option value="bank_transfer">
        {t("paymentMethods.bankTransfer")}
    </option>

    <option value="credit_card">
        {t("paymentMethods.creditCard")}
    </option>

    <option value="debit_card">
        {t("paymentMethods.debitCard")}
    </option>

    <option value="e_wallet">
        {t("paymentMethods.eWallet")}
    </option>

    <option value="other">
        {t("paymentMethods.other")}
    </option>
</select>
                            </div>
<div className="payment-method-form-actions">
    <button
        type="submit"
        className="payment-method-save-button"
        disabled={submitting}
    >
        {submitting
            ? t("paymentMethods.saving")
            : editingId
                ? t("paymentMethods.update")
                : t("paymentMethods.save")}
    </button>

    <button
        type="button"
        className="payment-method-cancel-button"
        onClick={resetForm}
        disabled={submitting}
    >
        {t("paymentMethods.cancel")}
    </button>
</div>
                        </form>
                    )}
                    <div className="payment-method-filters">
                    <div className="payment-method-search">
                    <Search size={18} strokeWidth={2} />
                    <input
                        type="text"
                        placeholder={t("paymentMethods.search")}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

    <select
        value={filterType}
        onChange={(event) => setFilterType(event.target.value)}
    >
        <option value="all">{t("paymentMethods.allTypes")}</option>
        <option value="cash">{t("paymentMethods.cash")}</option>
        <option value="bank_transfer">{t("paymentMethods.bankTransfer")}</option>
        <option value="credit_card">{t("paymentMethods.creditCard")}</option>
        <option value="debit_card">{t("paymentMethods.debitCard")}</option>
        <option value="e_wallet">{t("paymentMethods.eWallet")}</option>
        <option value="other">{t("paymentMethods.other")}</option>
    </select>

    <select
        value={filterStatus}
        onChange={(event) => setFilterStatus(event.target.value)}
    >
        <option value="all">{t("paymentMethods.allStatuses")}</option>
        <option value="active">{t("paymentMethods.active")}</option>
        <option value="inactive">{t("paymentMethods.inactive")}</option>
    </select>
</div>
                    <div className="categories-list">
                        {loading ? (
                            <p>{t("paymentMethods.loading")}</p>
                        ) : (
                            <>
                                <p className="categories-count">
                                    {filteredPaymentMethods.length}{" "}
                                    {t("paymentMethods.found")}
                                </p>

                                
<div className="payment-method-grid">
    {filteredPaymentMethods.length === 0 ? (
        <p>{t("paymentMethods.empty")}</p>
    ) : (
        filteredPaymentMethods.map((method) => (
            <div
                className="payment-method-card"
                key={method.payment_method_id}
            >
                <div className="payment-method-card-info">
                    <div className="payment-method-details">
                        <span className="payment-method-name">
                            {method.name}
                        </span>

                        <span
                            className={`payment-method-status ${
                                method.is_active ? "active" : "inactive"
                            }`}
                        >
                            {method.is_active
                                ? t("paymentMethods.active")
                                : t("paymentMethods.inactive")}
                        </span>
                    </div>
                </div>

                {!method.is_default && (
                    <div className="payment-method-card-actions">
                    <button
                        type="button"
                        className="payment-method-edit-button"
                        onClick={() => handleEdit(method)}
                        aria-label={t("paymentMethods.edit")}
                    >
                        <Pencil size={16} strokeWidth={2} />
                    </button>

                    <button
                        type="button"
                        className={`payment-method-toggle-button ${
                            method.is_active ? "deactivate" : "activate"
                        }`}
                        onClick={() => handleToggle(method)}
                    >
                        {method.is_active
                            ? t("paymentMethods.deactivate")
                            : t("paymentMethods.activate")}
                    </button>
                </div>
                )}
            </div>
        ))
    )}
</div>

                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default PaymentMethods;
