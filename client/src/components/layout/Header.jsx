
import useLanguage from "../../hooks/useLanguage";

function Header({
    title = "Dashboard",
    subtitle = "Here's your financial overview.",
    user,
    onToggleSidebar,
    isSidebarOpen = false,
}) {
    const { t, language } = useLanguage();

    const today = new Intl.DateTimeFormat(
        language === "vi" ? "vi-VN" : "en-US",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(new Date());

    const username = user?.username || "User";

    return (
        <header className="dashboard-header">
            <div className="header-heading">
                <button
                    type="button"
                    className="sidebar-toggle-button"
                    onClick={onToggleSidebar}
                    aria-label={
                        isSidebarOpen
                            ? t("sidebar.closeNavigation")
                            : t("sidebar.openNavigation")
                    }
                    aria-expanded={isSidebarOpen}
                    aria-controls="main-sidebar"
                    title={
                        isSidebarOpen
                            ? t("sidebar.closeNavigation")
                            : t("sidebar.openNavigation")
                    }
                >
                    <span>
                        {isSidebarOpen ? "✕" : "☰"}
                    </span>
                </button>

                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
            </div>

            <div className="header-actions">
                <div className="header-date">
                    <span className="header-date-icon">▦</span>
                    <span>{today}</span>
                </div>

                <button
                    type="button"
                    className="notification-button"
                    aria-label={t("header.notifications")}
                    title={t("header.notifications")}
                >
                    ♧
                </button>

                <div className="header-user">
                    <div className="user-avatar">
                        {username.charAt(0).toUpperCase()}
                    </div>

                    <div className="header-user-info">
                        <strong>{username}</strong>
                        <span>{t("profile.personalAccount")}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
