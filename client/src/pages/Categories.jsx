
import {
    Plus,
    Folder,
    TrendingUp,
    TrendingDown,
    Search,
    Pencil,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../styles/categories.css";
import Header from "../components/layout/Header";
import useLanguage from "../hooks/useLanguage";

import {
    getCategories,
    createCategory,
    updateCategory,
    toggleCategory,
    deleteCategory,
} from "../services/api";

function Categories({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t } = useLanguage();
    const CATEGORY_ICONS = [
    "🍔", "🛒", "🏠", "🚗", "💊", "🎮",
    "💰", "💵", "💳", "🎁", "✈️", "📚",
    "👕", "⚡", "🍽️", "🐾", "💻", "🎨",
    "🏥", "🎓", "🏦", "📱", "☕", "🎵",
    "💡", "🧾", "🏋️", "🌐", "📦", "💼",
];

const CATEGORY_ICON_GROUPS = [
    {
        name: "foodDrink",
        icons: ["🍔", "🍽️", "☕", "🍕", "🥤", "🍜"],
    },
    {
        name: "transport",
        icons: ["🚗", "🚕", "🚌", "🚆", "✈️", "🚲"],
    },
    {
        name: "shopping",
        icons: ["🛒", "👕", "👟", "🎁", "📦", "💄"],
    },
    {
        name: "healthLifestyle",
        icons: ["🏥", "💊", "🐾", "🏋️", "🏠", "💡"],
    },
    {
        name: "finance",
        icons: ["💰", "💵", "💳", "🏦", "🧾", "💼"],
    },
    {
        name: "educationOthers",
        icons: ["🎓", "📚", "💻", "📱", "🎮", "🎨"],
    },
];

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const categoryFormRef = useRef(null);

    const [showForm, setShowForm] = useState(false);

const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: "#8B5CF6",
    icon: "",
});

const [submitting, setSubmitting] = useState(false);
const [editingCategoryId, setEditingCategoryId] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getCategories(true);

                setCategories(response.data || []);
            } catch (error) {
                setError(
                    error.message || t("categories.loadFailed")
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [retryCount, t]);

    const handleRetry = () => {
        setRetryCount((count) => count + 1);
    };
    const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
};
const handleCancelForm = () => {
    setFormData({
        name: "",
        type: "expense",
        color: "#8B5CF6",
        icon: "",
    });

    setEditingCategoryId(null);
    setShowForm(false);
    setError("");
};
const handleAddCategory = () => {
    setEditingCategoryId(null);

    setFormData({
        name: "",
        type: "expense",
        color: "#8B5CF6",
        icon: "",
    });

    setError("");
    setShowForm(true);

    setTimeout(() => {
        categoryFormRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, 100);
};
const handleEditCategory = (category) => {
    setEditingCategoryId(category.category_id);

    setFormData({
        name: category.name,
        type: category.type,
        color: category.color || "#8B5CF6",
        icon: category.icon || "",
    });

    setShowForm(true);
    setError("");
    setTimeout(() => {
        categoryFormRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, 100);
};
const handleCreateCategory = async (event) => {
    event.preventDefault();

    const categoryName = formData.name.trim();

    if (!categoryName) {
        setError(t("categories.nameRequired"));
        return;
    }
    if (!formData.icon) {
        setError(t("categories.selectIcon"));
        return;
}

    setSubmitting(true);
    setError("");

    try {
        await createCategory({
    ...formData,
    name: categoryName,
});

        setFormData({
            name: "",
            type: "expense",
            color: "#8B5CF6",
            icon: "",
        });

        setShowForm(false);
        setRetryCount((count) => count + 1);
    } catch (error) {
        setError(error.message || t("categories.createFailed"));
    } finally {
        setSubmitting(false);
    }
};
const handleUpdateCategory = async (event) => {
    event.preventDefault();

    if (!editingCategoryId) return;
const categoryName = formData.name.trim();

if (!categoryName) {
    setError(t("categories.nameRequired"));
    return;
}

if (!formData.icon) {
    setError(t("categories.selectIcon"));
    return;
}

    setSubmitting(true);
    setError("");

    try {
        await updateCategory(editingCategoryId, {
    name: categoryName,
    color: formData.color,
    icon: formData.icon,
});

        setFormData({
            name: "",
            type: "expense",
            color: "#8B5CF6",
            icon: "",
        });

        setEditingCategoryId(null);
        setShowForm(false);
        setRetryCount((count) => count + 1);
    } catch (error) {
        setError(error.message || t("categories.updateFailed"));
    } finally {
        setSubmitting(false);
    }
};
// Toggle category active status
const handleToggleCategory = async (category) => {
    try {
        await toggleCategory(
            category.category_id,
            !category.is_active
        );

        setRetryCount((prev) => prev + 1);
    } catch (err) {
        setError(err.message || t("categories.statusFailed"))
    }
};
// Delete category
const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(
        t("categories.confirmDelete")
    );

    if (!confirmed) return;

    setError("");

    try {
        await deleteCategory(category.category_id);
        setShowForm(false);
        setEditingCategoryId(null);
        setRetryCount((prev) => prev + 1);
    } catch (err) {
        setError(
            err.message || t("categories.deleteFailed")
        );
    }
};
    const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

    const matchesType =
        filterType === "all" || category.type === filterType;

    const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && category.is_active) ||
        (filterStatus === "inactive" && !category.is_active);

        return matchesSearch && matchesType && matchesStatus;
    });

    const incomeCategories = categories.filter(
        (category) => category.type === "income"
    );

    const expenseCategories = categories.filter(
        (category) => category.type === "expense"
    );

    return (
        <div className="app-layout">
            <main className="main-content">
                <Header 
                    title={t("categories.title")}
                    subtitle={t("categories.subtitle")}
                    user={user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />
                <section className="page-content categories-content">
                    <div className="page-header">
                        <div>
                            <h1>{t("categories.title")}</h1>
                        <p>{t("categories.subtitle")}</p>
                    </div>
                        <button
                            type="button"
                            className="category-add-button"
                            onClick={handleAddCategory}>
                                <Plus size={18} strokeWidth={2} />
                                {t("categories.add")}
                        </button>
                    </div>
                    <div className="category-summary">
                        <div className="category-summary-card">
                            <div className="category-summary-icon total"><Folder size={22} strokeWidth={2} /></div>
                            <div className="category-summary-info">
                                <span>{t("categories.totalCategories")}</span>
                                <h2>{categories.length}</h2>
                            </div>
                        </div>

                        <div className="category-summary-card">
                            <div className="category-summary-icon income"><TrendingUp size={22} strokeWidth={2} /></div>
                            <div className="category-summary-info">
                                <span>{t("categories.income")}</span>
                                <h2>{incomeCategories.length}</h2>
                            </div>
                        </div>

                        <div className="category-summary-card">
                            <div className="category-summary-icon expense"><TrendingDown size={22} strokeWidth={2} /></div>
                            <div className="category-summary-info">
                                <span>{t("categories.expense")}</span>
                                <h2>{expenseCategories.length}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="category-toolbar">
                        <div className="category-search">
                            <Search size={18} strokeWidth={2} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder={t("categories.searchPlaceholder")}
                            />
                        </div>

                        <div className="category-filters">
                            <select
                                value={filterType}
                                onChange={(event) => setFilterType(event.target.value)}
                            >
                                <option value="all">{t("categories.allTypes")}</option>
                                <option value="income">{t("categories.income")}</option>
                                <option value="expense">{t("categories.expense")}</option>
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(event) => setFilterStatus(event.target.value)}
                            >
                                <option value="all">{t("categories.allStatuses")}</option>
                                <option value="active">{t("categories.active")}</option>
                                <option value="inactive">{t("categories.inactive")}</option>
                            </select>
                        </div>
                    </div>
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={handleRetry}
                            >
                                {t("categories.retry")}
                            </button>
                        </div>
                    )}
                    {showForm && (
    <form
        ref={categoryFormRef}
        className="category-form"
        onSubmit={
            editingCategoryId
                ? handleUpdateCategory
                : handleCreateCategory
        }

    >
        <div className="category-form-header">
    <h2>
        {editingCategoryId
            ? t("categories.editCategory")
            : t("categories.addNewCategory")}
    </h2>

    {editingCategoryId && (
        <button
            type="button"
            className="category-delete-button"
            onClick={() => {
                const category = categories.find(
                    (item) => item.category_id === editingCategoryId
                );

                if (category) {
                    handleDeleteCategory(category);
                }
            }}
            disabled={submitting}
        >
            {t("categories.delete")}
        </button>
    )}
</div>

        <div className="form-group">
            <label htmlFor="category-name">
                {t("categories.categoryName")}
            </label>

            <input
                id="category-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t("categories.enterCategoryName")}
                maxLength={100}
                required
            />
        </div>

        <div className="form-group">
            <label htmlFor="category-type">
                {t("categories.categoryType")}
            </label>

            <select
                id="category-type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
            >
                <option value="income">{t("categories.income")}</option>
                <option value="expense">{t("categories.expense")}</option>
            </select>
        </div>

        <div className="form-group">
            <label htmlFor="category-color">
                {t("categories.categoryColor")}
            </label>

            <input
                id="category-color"
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
            />
        </div>

        
<div className="form-group">
    <label>{t("categories.categoryIcon")}</label>

    
<div className="category-icon-groups">
    {CATEGORY_ICON_GROUPS.map((group) => (
        <div className="category-icon-group" key={group.name}>
            <h3>{t(`categories.${group.name}`)}</h3>

            <div className="category-icon-picker">
                {group.icons.map((icon) => (
                    <button
                        key={icon}
                        type="button"
                        className={`category-icon-option ${
                            formData.icon === icon ? "selected" : ""
                        }`}
                        onClick={() =>
                            setFormData((previous) => ({
                                ...previous,
                                icon,
                            }))
                        }
                        aria-label={`${t("categories.selectIcon")} ${icon}`}
                        aria-pressed={formData.icon === icon}
                    >
                        {icon}
                    </button>
                ))}
            </div>
        </div>
    ))}
</div>

<p className="category-icon-preview">
    {t("categories.selectedIcon")}:{" "}
    {formData.icon || t("categories.none")}
</p>

</div>
        <div className="category-form-actions">
            <button
                type="submit"
                className="category-save-button"
                disabled={submitting}
            >
                {submitting ? t("categories.saving")
                    : editingCategoryId
                    ? t("categories.updateCategory")
                    : t("categories.saveCategory")}
            </button>

            <button
                type="button"
                className="category-cancel-button"
                onClick={handleCancelForm}
                disabled={submitting}
            >
                {t("categories.cancel")}
            </button>
        </div>

    </form>
)}
<div className="categories-list">
    {loading ? (
        <p>{t("categories.loading")}</p>
    ) : (
        <>
            <p className="categories-count">
                {categories.length} {t("categories.categoriesFound")}
            </p>

            <section className="category-section">
                <h2>{t("categories.income")}</h2>

                <div className="category-grid">
                    {incomeCategories.length === 0 ? (
                        <p>{t("categories.noIncomeCategories")}</p>
                    ) : (
                        incomeCategories.map((category) => (
                            <div
                                className="category-card"
                                key={category.category_id}
                            >
                                <div className="category-card-info">
                                    <span className="category-icon">
                                        {category.icon || "📁"}
                                    </span>

                                    <div className="category-details">
                                        <span className="category-name">
                                            {category.name}
                                        </span>

                                        <div className="category-meta">
                                            <span
                                                className="category-color"
                                                style={{
                                                    backgroundColor: category.color,
                                                }}
                                            />

                                            <span
                                                className={`category-status ${
                                                    category.is_active
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {category.is_active
                                                    ? t("categories.active")
                                                    : t("categories.inactive")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!category.is_default && (
                                    <div className="category-card-actions">
                                        <button
                                            type="button"
                                            className="icon-button edit-button"
                                            onClick={() => handleEditCategory(category)}
                                            title={t("categories.edit")}
                                            aria-label={t("categories.edit")}
                                        >
                                            <Pencil size={16} strokeWidth={2} />
                                        </button>

                                        <button
                                            type="button"
                                            className={`category-toggle-button ${
                                                category.is_active ? "deactivate" : "activate"
                                            }`}
                                            onClick={() => handleToggleCategory(category)}
                                        >
                                            {category.is_active
                                                ? t("categories.deactivate")
                                                : t("categories.activate")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="category-section">
                <h2>{t("categories.expense")}</h2>

                <div className="category-grid">
                    {expenseCategories.length === 0 ? (
                        <p>{t("categories.noExpenseCategories")}</p>
                    ) : (
                        expenseCategories.map((category) => (
                            <div
                                className="category-card"
                                key={category.category_id}
                            >
                                <div className="category-card-info">
                                    <span className="category-icon">
                                        {category.icon || "📁"}
                                    </span>

                                    <div className="category-details">
                                        <span className="category-name">
                                            {category.name}
                                        </span>

                                        <div className="category-meta">
                                            <span
                                                className="category-color"
                                                style={{
                                                    backgroundColor: category.color,
                                                }}
                                            />

                                            <span
                                                className={`category-status ${
                                                    category.is_active
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {category.is_active
                                                    ? t("categories.active")
                                                    : t("categories.inactive")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!category.is_default && (
                                    <div className="category-card-actions">
                                        <button
                                            type="button"
                                            className="icon-button edit-button"
                                            onClick={() => handleEditCategory(category)}
                                            title={t("categories.edit")}
                                            aria-label={t("categories.edit")}
                                        >
                                            <Pencil size={16} strokeWidth={2} />
                                        </button>

                                        <button
                                            type="button"
                                            className={`category-toggle-button ${
                                                category.is_active ? "deactivate" : "activate"
                                            }`}
                                            onClick={() => handleToggleCategory(category)}
                                        >
                                            {category.is_active
                                                ? t("categories.deactivate")
                                                : t("categories.activate")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </>
    )}
</div>

                </section>
            </main>
        </div>
    );
}

export default Categories;
