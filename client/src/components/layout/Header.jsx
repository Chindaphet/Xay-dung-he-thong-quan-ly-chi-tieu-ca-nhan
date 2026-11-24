
import {
    Menu,
    X,
    CalendarDays,
    Sun,
    Moon,
    Bell,
    ChevronDown,
    UserRound,
    Settings,
    LogOut,
} from "lucide-react";
import { getSettings, updateSettings } from "../../services/api";
import { useEffect, useRef, useState } from "react";
import useLanguage from "../../hooks/useLanguage";
import { useTheme } from "../../contexts/ThemeContext";

function Header({
    title = "Dashboard",
    subtitle = "Here's your financial overview.",
    user,
    onToggleSidebar,
    isSidebarOpen = false,
    onNavigate,
    onLogout,
}) {
    const { t, language, changeLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            titleKey: "header.demoNotificationBudgetTitle",
            messageKey: "header.demoNotificationBudgetMessage",
            timeKey: "header.demoTimeFiveMinutes",
            read: false,
        },
        {
            id: 2,
            titleKey: "header.demoNotificationTransactionTitle",
            messageKey: "header.demoNotificationTransactionMessage",
            timeKey: "header.demoTimeOneHour",
            read: false,
        },
        {
            id: 3,
            titleKey: "header.demoNotificationSummaryTitle",
            messageKey: "header.demoNotificationSummaryMessage",
            timeKey: "header.demoTimeYesterday",
            read: true,
        },
    ]);

    const headerActionsRef = useRef(null);
    const profileTriggerRef = useRef(null);
    const languageTriggerRef = useRef(null);
    const notificationTriggerRef = useRef(null);

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    const today = new Intl.DateTimeFormat(
        language === "vi" ? "vi-VN" : "en-US",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(new Date());

    const username = user?.username || "User";

    useEffect(() => {
        if (!activeDropdown) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            if (
                headerActionsRef.current &&
                !headerActionsRef.current.contains(event.target)
            ) {
                setActiveDropdown(null);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setActiveDropdown(null);

                if (activeDropdown === "profile") {
                    profileTriggerRef.current?.focus();
                } else if (activeDropdown === "language") {
                    languageTriggerRef.current?.focus();
                } else {
                    notificationTriggerRef.current?.focus();
                }
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [activeDropdown]);

    const toggleDropdown = (dropdown) => {
        setActiveDropdown((previous) =>
            previous === dropdown ? null : dropdown
        );
    };

    const closeDropdown = () => {
        setActiveDropdown(null);
    };

    const handleProfileNavigation = (pageId) => {
        closeDropdown();
        onNavigate?.(pageId);
    };

    const handleLogout = () => {
        closeDropdown();
        onLogout?.();
    };

    const handleThemeToggle = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    try {
        const result = await getSettings();
        const settings = result.data.settings;

        await updateSettings({
            theme: nextTheme,
            currency: settings.currency,
            numberFormat: settings.number_format,
        });

        setTheme(nextTheme);
    } catch (error) {
        console.error("Failed to update theme:", error);
    }
    };

    const handleMarkAsRead = (notificationId) => {
        setNotifications((previous) =>
            previous.map((notification) =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    const handleMarkAllAsRead = () => {
        setNotifications((previous) =>
            previous.map((notification) => ({
                ...notification,
                read: true,
            }))
        );
    };

    const handleProfileMenuKeyDown = (event) => {
        const menu = event.currentTarget;
        const items = Array.from(
            menu.querySelectorAll('[role="menuitem"]')
        );

        const currentIndex = items.indexOf(document.activeElement);

        let nextIndex = currentIndex;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                nextIndex = (currentIndex + 1) % items.length;
                break;

            case "ArrowUp":
                event.preventDefault();
                nextIndex =
                    (currentIndex - 1 + items.length) % items.length;
                break;

            case "Home":
                event.preventDefault();
                nextIndex = 0;
                break;

            case "End":
                event.preventDefault();
                nextIndex = items.length - 1;
                break;

            default:
                return;
        }

        items[nextIndex]?.focus();
    };

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
                    {isSidebarOpen ? (
                        <X size={20} strokeWidth={1.8} aria-hidden="true" />
                    ) : (
                        <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
                    )}
                </button>

                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
            </div>
            <div className="header-actions" ref={headerActionsRef}>
            <div className="header-date">
                <span className="header-date-icon">
                    <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span>{today}</span>
            </div>
                {/* Language Switcher */}
                <div className="header-language-dropdown">
                    <button
                        ref={languageTriggerRef}
                        type="button"
                        className="header-language-trigger"
                        onClick={() => toggleDropdown("language")}
                        aria-expanded={activeDropdown === "language"}
                        aria-haspopup="menu"
                        aria-label={t("header.language")}
                        title={t("header.language")}
                    >
                        {language.toUpperCase()}
                    </button>

                    {activeDropdown === "language" && (
                        <div
                            className="header-language-menu"
                            role="menu"
                            aria-label={t("header.language")}
                        >
                            <button
                                type="button"
                                role="menuitemradio"
                                aria-checked={language === "en"}
                                className={`header-language-option ${
                                    language === "en" ? "active" : ""
                                }`}
                                onClick={() => {
                                    changeLanguage("en");
                                    setActiveDropdown(null);
                                }}
                            >
                                <span className="header-language-circle">EN</span>
                                <span>{t("header.english")}</span>
                            </button>

                            <button
                                type="button"
                                role="menuitemradio"
                                aria-checked={language === "vi"}
                                className={`header-language-option ${
                                    language === "vi" ? "active" : ""
                                }`}
                                onClick={() => {
                                    changeLanguage("vi");
                                    setActiveDropdown(null);
                                }}
                            >
                                <span className="header-language-circle">VI</span>
                                <span>{t("header.vietnamese")}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Theme Switcher */}
                <button
                    type="button"
                    className="header-theme-button"
                    onClick={handleThemeToggle}
                    aria-label={
                        theme === "light"
                            ? t("header.switchToDark")
                            : t("header.switchToLight")
                    }
                    title={
                        theme === "light"
                            ? t("header.switchToDark")
                            : t("header.switchToLight")
                    }
                >
                    {theme === "light" ? (
                        <Moon size={19} strokeWidth={1.8} aria-hidden="true" />
                    ) : (
                        <Sun size={19} strokeWidth={1.8} aria-hidden="true" />
                    )}
                </button>

                {/* Notification Dropdown */}
                <div className="header-notification-wrapper">
                    <button
                        ref={notificationTriggerRef}
                        type="button"
                        className="notification-button"
                        onClick={() =>
                            toggleDropdown("notifications")
                        }
                        aria-label={t("header.notifications")}
                        aria-haspopup="dialog"
                        aria-expanded={
                            activeDropdown === "notifications"
                        }
                        title={t("header.notifications")}
                    >
                        <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
                    </button>

                    {activeDropdown === "notifications" && (
                        <section
                            className="header-notification-menu"
                            role="dialog"
                            aria-label={t("header.notifications")}
                        >
                            <div className="notification-menu-header">
                                <div>
                                    <h3>
                                        {t("header.notifications")}
                                    </h3>
                                    <span>
                                        {t("header.demoLabel")}
                                    </span>
                                </div>

                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        className="notification-mark-all"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        {t("header.markAllAsRead")}
                                    </button>
                                )}
                            </div>

                            <div className="notification-list">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <button
                                            type="button"
                                            key={notification.id}
                                            className={
                                                notification.read
                                                    ? "notification-item read"
                                                    : "notification-item unread"
                                            }
                                            onClick={() =>
                                                handleMarkAsRead(
                                                    notification.id
                                                )
                                            }
                                        >
                                            <span className="notification-item-icon">
                                                <Bell size={16} strokeWidth={1.8} aria-hidden="true" />
                                            </span>

                                            <span className="notification-item-content">
                                                <strong>
                                                    {t(notification.titleKey)}
                                                </strong>
                                                <span>
                                                    {t(notification.messageKey)}
                                                </span>
                                                <small>
                                                    {t(notification.timeKey)}
                                                </small>
                                            </span>

                                            {!notification.read && (
                                                <span
                                                    className="notification-unread-dot"
                                                    aria-label={t("header.unread")}
                                                />
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="notification-empty">
    <Bell size={28} strokeWidth={1.8} aria-hidden="true" />
    <p>{t("header.noNotifications")}</p>
</div>
                                )}
                            </div>

                            <div className="notification-menu-footer">
                                {t("header.demoFooter")}
                            </div>
                        </section>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="header-profile-wrapper">
                    <button
                        ref={profileTriggerRef}
                        type="button"
                        className="header-user header-user-trigger"
                        onClick={() => toggleDropdown("profile")}
                        aria-haspopup="menu"
                        aria-expanded={activeDropdown === "profile"}
                        aria-controls="header-profile-menu"
                        aria-label={t("header.profileMenu")}
                    >
                        <span className="user-avatar" aria-hidden="true">
                            {username.charAt(0).toUpperCase()}
                        </span>

                        <span className="header-user-info">
                            <strong>{username}</strong>
                            <span>{t("profile.personalAccount")}</span>
                        </span>

                        <span
                            className="profile-dropdown-arrow"
                            aria-hidden="true"
                        >
                            <ChevronDown size={15} strokeWidth={1.8} />
                        </span>
                    </button>

                    {activeDropdown === "profile" && (
                        <div
                            id="header-profile-menu"
                            className="header-profile-menu"
                            role="menu"
                            aria-label={t("header.profileMenu")}
                            onKeyDown={handleProfileMenuKeyDown}
                        >
                            <button
                                type="button"
                                role="menuitem"
                                className="profile-menu-item"
                                onClick={() =>
                                    handleProfileNavigation("profile")
                                }
                            >
                            <span aria-hidden="true">
                                <UserRound size={18} strokeWidth={1.8} />
                            </span>
                                {t("header.profile")}
                            </button>

                            <button
                                type="button"
                                role="menuitem"
                                className="profile-menu-item"
                                onClick={() =>
                                    handleProfileNavigation("settings")
                                }
                            >
                            <span aria-hidden="true">
                                <Settings size={18} strokeWidth={1.8} /></span>
                                {t("header.accountSettings")}
                            </button>

                            <div
                                className="profile-menu-divider"
                                role="separator"
                            />

                            <button
                                type="button"
                                role="menuitem"
                                className="profile-menu-item profile-menu-logout"
                                onClick={handleLogout}
                            >
                            <span aria-hidden="true">
                                <LogOut size={18} strokeWidth={1.8} />
                            </span>
                                {t("common.logout")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
