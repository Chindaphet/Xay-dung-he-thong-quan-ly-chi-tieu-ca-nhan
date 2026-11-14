
import useLanguage from "../../hooks/useLanguage";

const menuGroups = [
    {
        title: "mainMenu",
        items: [
            { id: "dashboard", label: "dashboard", icon: "◫" },
            { id: "transactions", label: "transactions", icon: "↔" },
            { id: "categories", label: "categories", icon: "▦" },
            { id: "payment-methods", label: "paymentMethods", icon: "▣" },
        ],
    },
    {
        title: "financialTools",
        items: [
            { id: "budget", label: "budget", icon: "◷" },
            { id: "recurring", label: "recurring", icon: "⟳" },
            { id: "analytics", label: "analytics", icon: "⌁" },
            { id: "simulator", label: "simulator", icon: "⌘" },
        ],
    },
    {
        title: "preferences",
        items: [
            { id: "profile", label: "profile", icon: "◎" },
            { id: "settings", label: "settings", icon: "⚙" },
        ],
    },
];

function Sidebar({
    activePage = "dashboard",
    onNavigate,
    onLogout,
    isOpen = false,
    onClose,
}) {
    const { t } = useLanguage();

    const handleNavigate = (pageId) => {
        onNavigate?.(pageId);
        onClose?.();
    };

    const handleLogout = () => {
        onClose?.();
        onLogout?.();
    };
    return (
        <>
            {/* Sidebar Backdrop */}
            {isOpen && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label={t("sidebar.closeNavigation")}
                    onClick={onClose}
                />
            )}
            {/* Sidebar */}
            <aside
                id="main-sidebar"
                className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <div className="sidebar-brand">
                    <div className="brand-logo">D</div>

                    <div className="brand-text">
                        <h2>Devo</h2>
                        <span>Personal Finance</span>
                    </div>
                </div>

                <nav className="sidebar-navigation">
                    {menuGroups.map((group) => (
                        <div className="sidebar-group" key={group.title}>
                            <p className="sidebar-group-title">
                                {t(`sidebar.${group.title}`)}
                            </p>

                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`sidebar-link ${
                                        activePage === item.id ? "active" : ""
                                    }`}
                                    aria-current={
                                        activePage === item.id
                                            ? "page"
                                            : undefined
                                    }
                                    onClick={() => handleNavigate(item.id)}
                                    tabIndex={isOpen ? 0 : -1}
                                >
                                    <span className="sidebar-icon">
                                        {item.icon}
                                    </span>

                                    <span className="sidebar-link-label">
                                        {t(`sidebar.${item.label}`)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-help">
                        <div className="help-icon">?</div>

                        <div className="sidebar-help-text">
                            <strong>{t("sidebar.needHelp")}</strong>
                            <p>{t("sidebar.helpDescription")}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                        tabIndex={isOpen ? 0 : -1}
                    >
                        <span className="sidebar-icon">↪</span>
                        <span>{t("sidebar.signOut")}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
