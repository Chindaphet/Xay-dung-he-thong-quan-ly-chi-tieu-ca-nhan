
import {
    LayoutDashboard,
    ArrowLeftRight,
    Tags,
    CreditCard,
    Wallet,
    Repeat,
    ChartNoAxesCombined,
    SlidersHorizontal,
    UserRound,
    Settings,
    CircleHelp,
    LogOut,
} from "lucide-react";
import useLanguage from "../../hooks/useLanguage";

const menuGroups = [
    {
        title: "mainMenu",
        items: [
            { id: "dashboard", label: "dashboard", icon: LayoutDashboard },
            { id: "transactions", label: "transactions", icon: ArrowLeftRight },
            { id: "categories", label: "categories", icon: Tags },
            { id: "payment-methods", label: "paymentMethods", icon: CreditCard },
        ],
    },
    {
        title: "financialTools",
        items: [
            { id: "budget", label: "budget", icon: Wallet },
            { id: "recurring", label: "recurring", icon: Repeat },
            { id: "smart-analysis", label: "smartAnalysis", icon: ChartNoAxesCombined },
            { id: "simulator", label: "simulator", icon: SlidersHorizontal },
        ],
    },
    {
        title: "preferences",
        items: [
            { id: "profile", label: "profile", icon: UserRound },
            { id: "settings", label: "settings", icon: Settings },
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
                                        <item.icon size={20} strokeWidth={1.8} aria-hidden="true" />
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
                        <div className="help-icon">
                            <CircleHelp size={19} strokeWidth={1.8} aria-hidden="true" />
                        </div>

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
                        <span className="sidebar-icon">
                            <LogOut size={20} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <span>{t("sidebar.signOut")}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
