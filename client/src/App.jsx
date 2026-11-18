
import useLanguage from "./hooks/useLanguage";
import { useEffect, useState } from "react";
import {
    login,
    register,
    getCurrentUser,
    logout,
    requestPasswordReset,
    resetPassword,
} from "./services/auth";

import Dashboard from "./pages/Dashboard";
import Budget from "./pages/Budget";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import PaymentMethods from "./pages/PaymentMethods";
import MyProfile from "./pages/MyProfile";
import Recurring from "./pages/Recurring";
import SmartAnalysis from "./pages/SmartAnalysis";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import Sidebar from "./components/layout/Sidebar";
import "./App.css";

// Password visibility button
function PasswordToggle({ visible, onClick }) {
    return (
        <button
            type="button"
            className="password-toggle-button"
            onClick={onClick}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            title={visible ? "Hide password" : "Show password"}
        >
            {visible ? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 002.83 2.83" />
                    <path d="M9.88 5.09A10.94 10.94 0 0112 4.5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-4.16 5.19" />
                    <path d="M6.61 6.61A11.9 11.9 0 001 12c1.73 4.39 6 7.5 11 7.5a10.94 10.94 0 004.91-1.14" />
                </svg>
            ) : (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
        </button>
    );
}

function AuthLanguageSwitcher({ language, changeLanguage, t }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="auth-language-switcher">
            <div className="auth-language-dropdown">
                <button
                    type="button"
                    className="auth-language-trigger"
                    onClick={() => setIsOpen((previous) => !previous)}
                    aria-expanded={isOpen}
                    aria-label="Select language"
                >
                    {language.toUpperCase()}
                </button>

                {isOpen && (
                    <div className="auth-language-menu">
                        <button
                            type="button"
                            className={`auth-language-option ${
                                language === "en" ? "active" : ""
                            }`}
                            onClick={() => {
                                changeLanguage("en");
                                setIsOpen(false);
                            }}
                        >
                            <span className="auth-language-circle">EN</span>
                            <span>{t("auth.english")}</span>
                        </button>

                        <button
                            type="button"
                            className={`auth-language-option ${
                                language === "vi" ? "active" : ""
                            }`}
                            onClick={() => {
                                changeLanguage("vi");
                                setIsOpen(false);
                            }}
                        >
                            <span className="auth-language-circle">VI</span>
                            <span>{t("auth.vietnamese")}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function App() {
    const { language, changeLanguage, t } = useLanguage();
    const [user, setUser] = useState(null);
    const [activePage, setActivePage] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    // Registration form
    const [showRegister, setShowRegister] = useState(false);
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerFullName, setRegisterFullName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
    const [registerLanguage, setRegisterLanguage] = useState(language);
    const [registerLanguageOpen, setRegisterLanguageOpen] = useState(false);
    const [registerError, setRegisterError] = useState("");
    const [registerSuccess, setRegisterSuccess] = useState("");

    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [resetToken, setResetToken] = useState(
        () => new URLSearchParams(window.location.search).get("token") || ""
    );

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState("");

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotError, setForgotError] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Check authentication when the application starts
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuthentication();
    }, []);

    // Handle login
    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const loggedInUser = await login(
                identifier.trim(),
                password);
            setUser(loggedInUser);
            setPassword("");
            setIsSidebarOpen(false);
            setActivePage("dashboard");
        } catch (error) {
            setError(error.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    };
    
    // Handle registration
    const handleRegister = async (event) => {
        event.preventDefault();
        setRegisterError("");
        setRegisterSuccess("");

        if (registerPassword !== registerConfirmPassword) {
            setRegisterError("Passwords do not match.");
            return;
        }

        if (
            registerPassword.length < 8 ||
            registerPassword.length > 72
        ) {
            setRegisterError(
                "Password must be between 8 and 72 characters."
            );
            return;
        }
        setSubmitting(true);
        try {
            await register({
                username: registerUsername.trim(),
                full_name: registerFullName.trim(),
                email: registerEmail.trim(),
                password: registerPassword,
                preferred_language: registerLanguage,
            });

            setRegisterSuccess(
                "Registration successful. Please sign in with your account."
            );
            setIdentifier(registerUsername.trim());
            setPassword("");
            setRegisterUsername("");
            setRegisterFullName("");
            setRegisterEmail("");
            setRegisterPassword("");
            setRegisterConfirmPassword("");
            setShowRegister(false);
        } catch (error) {
            const details = Array.isArray(error.details)
                ? error.details.join(" ")
                : "";
            setRegisterError(
                details || error.message || "Registration failed."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Handle forgot password
    const handleForgotPassword = async (event) => {
        event.preventDefault();
        setForgotError("");
        setForgotMessage("");
        setSubmitting(true);

        try {
            const result = await requestPasswordReset(
                forgotEmail.trim()
            );

            setForgotMessage(
                result.message ||
                "If the email address is registered, a password reset link will be sent."
            );
        } catch (error) {
            setForgotError(
                error.message || "Unable to process your request."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Handle password reset
    const handleResetPassword = async (event) => {
        event.preventDefault();
        setResetError("");
        if (newPassword !== confirmPassword) {
            setResetError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8 || newPassword.length > 72) {
            setResetError(
                "Password must be between 8 and 72 characters."
            );
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(resetToken, newPassword);

            setResetSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
            setResetToken("");

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        } catch (error) {
            setResetError(
                error.message || "Unable to reset password."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Handle sidebar
    const handleToggleSidebar = () => {
        setIsSidebarOpen((previous) => !previous);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Handle page navigation
    const handleNavigate = (pageId) => {
        setActivePage(pageId);
        setIsSidebarOpen(false);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            setIdentifier("");
            setPassword("");
            setError("");
            setIsSidebarOpen(false);
        }
    };

    // Loading screen
    if (loading) {
        return (
            <main className="app-loading">
                <p>Loading...</p>
            </main>
        );
    }

    // Main application screen
    if (user) {
        const pageProps = {
            user,
            onLogout: handleLogout,
            onNavigate: handleNavigate,
            isSidebarOpen,
            onToggleSidebar: handleToggleSidebar,
        };

        let currentPage;

        switch (activePage) {
            case "transactions":
                currentPage = <Transactions {...pageProps} />;
                break;
            case "categories":
                currentPage = <Categories {...pageProps} />;
                break;
            case "payment-methods":
                currentPage = <PaymentMethods {...pageProps} />;
                break;
            case "budget":
                currentPage = <Budget {...pageProps} />;
                break;
            case "profile":
                currentPage = <MyProfile {...pageProps} />;
                break;
            case "recurring":
                currentPage = <Recurring {...pageProps} />;
                break;
            case "smart-analysis":
                currentPage = <SmartAnalysis {...pageProps} />;
                break;
            case "simulator":
                currentPage = <WhatIfSimulator {...pageProps} />;
                break;
            case "dashboard":
            default:
                currentPage = <Dashboard {...pageProps} />;
                break;
        }

        return (
            <>
                <Sidebar
                    user={user}
                    activePage={activePage}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    onClose={handleCloseSidebar}
                />

                {currentPage}
            </>
        );
    }

    // Password reset success screen
    if (resetSuccess) {
        return (
            <main className="login-page">
        <AuthLanguageSwitcher
        language={language}
        changeLanguage={changeLanguage}
        t={t}/>
                <section className="login-card register-card">
                    <div className="login-brand">
                        <h1>Devo</h1>
                        <p>Personal Expense Management</p>
                    </div>

                    <div className="reset-success-icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M5 12l4 4L19 6" />
                        </svg>
                    </div>

                    <div className="login-heading">
                    <h2>{t("auth.forgotPasswordTitle")}</h2>
                    <p>{t("auth.forgotPasswordSubtitle")}</p>
                </div>

            <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                    <label htmlFor="forgotEmail">
                        {t("auth.email")}
                    </label>

                    <input
                        id="forgotEmail"
                        type="email"
                        value={forgotEmail}
                        onChange={(event) => {
                            setForgotEmail(event.target.value);
                            setForgotMessage("");
                            setForgotError("");
                        }}
                        placeholder={t("auth.forgotEmailPlaceholder")}
                        autoComplete="email"
                        required
                    />
                </div>

                {forgotMessage && (
                    <p className="login-success" role="status">
                        {forgotMessage}
                    </p>
                )}

                {forgotError && (
                    <p className="login-error" role="alert">
                        {forgotError}
                    </p>
                )}

                <button type="submit" disabled={submitting}>
                    {submitting
                        ? t("auth.sending")
                        : t("auth.sendResetLink")}
                </button>
            </form>

                <button
                    type="button"
                    className="forgot-back-button"
                    onClick={() => {
                        setShowForgotPassword(false);
                        setForgotMessage("");
                        setForgotError("");
                    }}
                >
                    {t("auth.backToSignIn")}
                </button>

                <p className="login-footer">
                    {t("auth.footer")}
                </p>

                    <button
                        type="button"
                        className="reset-success-button"
                        onClick={() => {
                            window.location.href = "/";
                        }}
                    >
                        Back to Sign In
                    </button>

                    <p className="login-footer">
                        Personal Expense Management System
                    </p>
                </section>
            </main>
        );
    }


    // Reset password screen
    if (resetToken) {
        return (
            <main className="login-page">
                <AuthLanguageSwitcher
                language={language}
                changeLanguage={changeLanguage}
                t={t}
            />
                <section className="login-card">
                    <div className="login-brand">
                        <h1>Devo</h1>
                        <p>Personal Expense Management</p>
                    </div>

                    <div className="login-heading">
                        <h2>Reset Your Password</h2>
                        <p>Enter your new password below.</p>
                    </div>

                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label htmlFor="newPassword">
                                New Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    maxLength={72}
                                    required
                                />

                                <PasswordToggle
                                    visible={showNewPassword}
                                    onClick={() =>
                                        setShowNewPassword((previous) => !previous)
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm New Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    maxLength={72}
                                    required
                                />

                                <PasswordToggle
                                    visible={showConfirmPassword}
                                    onClick={() =>
                                        setShowConfirmPassword((previous) => !previous)
                                    }
                                />
                            </div>
                        </div>

                        {resetError && (
                            <p className="login-error" role="alert">
                                {resetError}
                            </p>
                        )}

                        <button type="submit" disabled={submitting}>
                            {submitting
                                ? "Resetting Password..."
                                : "Reset Password"}
                        </button>
                    </form>

                    <p className="login-footer">
                        Personal Expense Management System
                    </p>
                </section>
            </main>
        );
    }

    
// Forgot password screen
if (showForgotPassword) {
    return (
        <main className="login-page">
            <AuthLanguageSwitcher
                language={language}
                changeLanguage={changeLanguage}
                t={t}
            />
            <section className="login-card">
                <div className="login-brand">
                    <h1>Devo</h1>
                    <p>Personal Expense Management</p>
                </div>

                <div className="login-heading">
                    <h2>{t("auth.forgotPasswordTitle")}</h2>
                    <p>{t("auth.forgotPasswordSubtitle")}</p>
                </div>

                <form onSubmit={handleForgotPassword}>
                    <div className="form-group">
                        <label htmlFor="forgotEmail">
                            {t("auth.email")}
                        </label>

                        <input
                            id="forgotEmail"
                            type="email"
                            value={forgotEmail}
                            onChange={(event) => {
                                setForgotEmail(event.target.value);
                                setForgotMessage("");
                                setForgotError("");
                            }}
                            placeholder={t("auth.forgotEmailPlaceholder")}
                            autoComplete="email"
                            required
                        />
                    </div>

                    {forgotMessage && (
                        <p className="login-success" role="status">
                            {forgotMessage}
                        </p>
                    )}

                    {forgotError && (
                        <p className="login-error" role="alert">
                            {forgotError}
                        </p>
                    )}

                    <button type="submit" disabled={submitting}>
                        {submitting
                            ? t("auth.sending")
                            : t("auth.sendResetLink")}
                    </button>
                </form>

                <button
                    type="button"
                    className="forgot-back-button"
                    onClick={() => {
                        setShowForgotPassword(false);
                        setForgotMessage("");
                        setForgotError("");
                    }}
                >
                    {t("auth.backToSignIn")}
                </button>

                <p className="login-footer">
                    {t("auth.footer")}
                </p>
            </section>
        </main>
    );
}

    // Registration screen
    if (showRegister) {
    return (
        <main className="login-page">
            <AuthLanguageSwitcher
                language={language}
                changeLanguage={changeLanguage}
                t={t}
            />
            <section className="login-card register-card">
                <div className="login-brand">
                    <h1>Devo</h1>
                    <p>Personal Expense Management</p>
                </div>

                <div className="login-heading">
                    <h2>{t("auth.registerTitle")}</h2>
                    <p>{t("auth.registerSubtitle")}</p>
                </div>

                <form className="register-form" onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="registerUsername">
                            {t("auth.username")}
                        </label>
                        <input
                            id="registerUsername"
                            type="text"
                            value={registerUsername}
                            onChange={(event) =>
                                setRegisterUsername(event.target.value)
                            }
                            placeholder="Enter username"
                            minLength={3}
                            maxLength={50}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerFullName">
                            {t("auth.fullName")}
                        </label>
                        <input
                            id="registerFullName"
                            type="text"
                            value={registerFullName}
                            onChange={(event) =>
                                setRegisterFullName(event.target.value)
                            }
                            placeholder="Enter your full name"
                            maxLength={100}
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerEmail">
                            {t("auth.email")}
                        </label>
                        <input
                            id="registerEmail"
                            type="email"
                            value={registerEmail}
                            onChange={(event) =>
                                setRegisterEmail(event.target.value)
                            }
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerPassword">
                            {t("auth.password")}
                        </label>
                        <input
                            id="registerPassword"
                            type="password"
                            value={registerPassword}
                            onChange={(event) =>
                                setRegisterPassword(event.target.value)
                            }
                            placeholder="Create a password"
                            minLength={8}
                            maxLength={72}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerConfirmPassword">
                            {t("auth.confirmPassword")}
                        </label>
                        <input
                            id="registerConfirmPassword"
                            type="password"
                            value={registerConfirmPassword}
                            onChange={(event) =>
                                setRegisterConfirmPassword(event.target.value)
                            }
                            placeholder="Confirm your password"
                            minLength={8}
                            maxLength={72}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {registerError && (
                        <p className="login-error" role="alert">
                            {registerError}
                        </p>
                    )}

                    <button type="submit" disabled={submitting}>
                        {submitting
                            ? t("auth.creatingAccount")
                            : t("auth.signUp")}
                    </button>
                </form>

                <button
                    type="button"
                    className="forgot-back-button"
                    onClick={() => {
                        setShowRegister(false);
                        setRegisterError("");
                    }}
                >
                    {t("auth.backToSignIn")}
                </button>

                <p className="login-footer">
                    Personal Expense Management System
                </p>
            </section>
        </main>
    );
}

    // Login screen
    return (
        <main className="login-page">
            <AuthLanguageSwitcher
            language={language}
            changeLanguage={changeLanguage}
            t={t}
        />
            <section className="login-card">
                <div className="login-brand">
                    <h1>Devo</h1>
                    <p>Personal Expense Management</p>
                </div>

                <div className="login-heading">
                    <h2>{t("auth.loginTitle")}</h2>
                    <p>{t("auth.loginSubtitle")}</p>
                </div>
                {registerSuccess && (
    <p className="login-success" role="status">
        {registerSuccess}
    </p>
)}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="identifier">
                            {t("auth.usernameOrEmail")}
                        </label>

                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(event) =>
                                setIdentifier(event.target.value)
                            }
                            placeholder={t("auth.identifierPlaceholder")}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            {t("auth.password")}
                        </label>

                        <div className="password-input-wrapper">
                            <input
                                id="password"
                                type={showLoginPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder={t("auth.passwordPlaceholder")}
                                autoComplete="current-password"
                                required
                            />

                            <PasswordToggle
                                visible={showLoginPassword}
                                onClick={() =>
                                    setShowLoginPassword((previous) => !previous)
                                }
                            />
                        </div>
                    </div>

                    <div className="forgot-password-link">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(true);
                                setForgotError("");
                                setForgotMessage("");
                            }}
                        >
                            {t("auth.forgotPassword")}
                        </button>
                    </div>

                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={submitting}>
                        {submitting 
                                ? t("auth.signingIn")
                                : t("auth.signIn")}
                        </button>
                </form>
                                <button
                    type="button"
                   className="forgot-back-button"
                    onClick={() => {
                        setShowRegister(true);
                        setRegisterError("");
                    }}
                >
                    {t("auth.noAccount")}
                </button>
                <p className="login-footer">
                    {t("auth.footer")}
                </p>
            </section>
        </main>
    );
}

export default App;
