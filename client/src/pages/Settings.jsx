
import { useEffect, useRef, useState } from "react";
import useLanguage from "../hooks/useLanguage";
import Header from "../components/layout/Header";
import supportedLanguages from "../locales/languages";
import { useTheme } from "../contexts/ThemeContext";
import {
    getSettings,
    updateSettings,
    changePassword,
} from "../services/api";
import "../styles/settings.css";

function Settings({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onPasswordChanged,
    onNavigate,
    onLogout,
}) {
    const { language, changeLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const [formData, setFormData] = useState({
        theme: "light",
        currency: "VND",
        numberFormat: "vi-VN",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordVisibility, setPasswordVisibility] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // Keep save requests in order to prevent older values
    // from overwriting newer settings.
    const saveQueueRef = useRef(Promise.resolve());
    const saveVersionRef = useRef(0);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const result = await getSettings();
                const settings = result.data.settings;
                const loadedSettings = {
                    theme: settings.theme === "dark" ? "dark" : "light",
                    currency: settings.currency,
                    numberFormat: settings.number_format,
                };

                setFormData(loadedSettings);
                setTheme(loadedSettings.theme);
            } catch (err) {
                setError(t("settings.loadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [t, setTheme]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        const updatedSettings = {
            ...formData,
            theme,
            [name]: value,
        };

        setFormData(updatedSettings);
        if (name === "theme") {
            setTheme(value);
        }

        setError("");
        setSuccess("");
        setSaving(true);

        const currentVersion = ++saveVersionRef.current;
        saveQueueRef.current = saveQueueRef.current
            .catch(() => {})
            .then(async () => {
                await updateSettings(updatedSettings);

                if (currentVersion === saveVersionRef.current) {
                    setSuccess(t("settings.savedSuccessfully"));
                    setError("");
                    setSaving(false);
                }
            })
            .catch(() => {
                if (currentVersion === saveVersionRef.current) {
                    setError(t("settings.saveFailed"));
                    setSuccess("");
                    setSaving(false);
                }
            });
    };

    const handleLanguageChange = (event) => {
        changeLanguage(event.target.value);
    };

    const handlePasswordInputChange = (event) => {
        const { name, value } = event.target;

        setPasswordData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setPasswordError("");
        setPasswordSuccess("");
    };

    const togglePasswordVisibility = (field) => {
        setPasswordVisibility((previous) => ({
            ...previous,
            [field]: !previous[field],
        }));
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword
        ) {
            setPasswordError(t("settings.passwordFieldsRequired"));
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError(t("settings.passwordMinLength"));
            return;
        }

        if (passwordData.newPassword.length > 72) {
            setPasswordError(t("settings.passwordMaxLength"));
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError(t("settings.passwordMismatch"));
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            setPasswordError(t("settings.passwordMustBeDifferent"));
            return;
        }

        try {
            setChangingPassword(true);
            await changePassword(passwordData);

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setPasswordSuccess(t("settings.passwordChangedSuccessfully"));

            if (onPasswordChanged) {
                onPasswordChanged();
            }
        } catch (err) {
            setPasswordError(
                err.message || t("settings.changePasswordFailed")
            );
        } finally {
            setChangingPassword(false);
        }
    };

    const renderPasswordField = (field, label, placeholder) => (
        <div className="settings-field" key={field}>
            <label htmlFor={field}>{label}</label>

            <div className="settings-password-input">
                <input
                    id={field}
                    name={field}
                    type={passwordVisibility[field] ? "text" : "password"}
                    value={passwordData[field]}
                    onChange={handlePasswordInputChange}
                    placeholder={placeholder}
                    autoComplete={
                        field === "currentPassword"
                            ? "current-password"
                            : "new-password"
                    }
                    maxLength={72}
                    required
                    disabled={changingPassword}
                />

                <button
                    type="button"
                    className="settings-password-toggle"
                    onClick={() => togglePasswordVisibility(field)}
                    aria-label={
                        passwordVisibility[field]
                            ? t("settings.hidePassword")
                            : t("settings.showPassword")
                    }
                    title={
                        passwordVisibility[field]
                            ? t("settings.hidePassword")
                            : t("settings.showPassword")
                    }
                >
                    {passwordVisibility[field] ? (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 9 7 9 7a15.8 15.8 0 01-3.1 3.8" />
                            <path d="M6.2 6.2C3.6 7.9 2 12 2 12s4 7 10 7a9.8 9.8 0 004.1-.9" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="settings-page">
            <Header
                title={t("settings.title")}
                subtitle={t("settings.subtitle")}
                user={user}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={onToggleSidebar}
                onNavigate={onNavigate}
                onLogout={onLogout}
            />

            <div className="settings-content">
                {loading ? (
                    <p>{t("settings.loading")}</p>
                ) : (
                    <>
                        <section className="settings-section">
                            <div className="settings-section-header">
                                <h2>{t("settings.appearance")}</h2>
                                <p>{t("settings.appearanceDescription")}</p>
                            </div>

                            <div className="settings-field">
                                <label htmlFor="theme">
                                    {t("settings.theme")}
                                </label>

                                <select
                                    id="theme"
                                    name="theme"
                                    value={theme}
                                    onChange={handleChange}
                                >
                                    <option value="light">
                                        {t("settings.light")}
                                    </option>
                                    <option value="dark">
                                        {t("settings.dark")}
                                    </option>
                                </select>
                            </div>
                        </section>

                        <section className="settings-section">
                            <div className="settings-section-header">
                                <h2>{t("settings.financialPreferences")}</h2>
                                <p>
                                    {t("settings.financialPreferencesDescription")}
                                </p>
                            </div>

                            <div className="settings-field">
                                <label htmlFor="currency">
                                    {t("settings.currency")}
                                </label>

                                <select
                                    id="currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                >
                                    <option value="VND">VND</option>
                                    <option value="USD">USD</option>
                                    <option value="THB">THB</option>
                                </select>
                            </div>

                            <div className="settings-field">
                                <label htmlFor="numberFormat">
                                    {t("settings.numberFormat")}
                                </label>

                                <select
                                    id="numberFormat"
                                    name="numberFormat"
                                    value={formData.numberFormat}
                                    onChange={handleChange}
                                >
                                    <option value="vi-VN">
                                        {t("settings.vietnameseFormat")}
                                    </option>
                                    <option value="en-US">
                                        {t("settings.usFormat")}
                                    </option>
                                </select>
                            </div>
                        </section>

                        <section className="settings-section">
                            <div className="settings-section-header">
                                <h2>{t("settings.languagePreferences")}</h2>
                                <p>
                                    {t("settings.languagePreferencesDescription")}
                                </p>
                            </div>

                            <div className="settings-field">
                                <label htmlFor="language">
                                    {t("settings.displayLanguage")}
                                </label>

                                <select
                                    id="language"
                                    value={language}
                                    onChange={handleLanguageChange}
                                >
                                    {supportedLanguages.map((item) => (
                                        <option
                                            key={item.code}
                                            value={item.code}
                                        >
                                            {item.nativeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </section>
                        <section className="settings-section">
                            <div className="settings-section-header">
                                <h2>{t("settings.changePassword")}</h2>
                                <p>{t("settings.changePasswordDescription")}</p>
                            </div>

                            {!showPasswordForm ? (
                                <button
                                    type="button"
                                    className="settings-save-button"
                                    onClick={() => {
                                        setShowPasswordForm(true);
                                        setPasswordError("");
                                        setPasswordSuccess("");
                                    }}
                                >
                                    {t("settings.changePasswordButton")}
                                </button>
                            ) : (
                                <form onSubmit={handleChangePassword}>
                                    {renderPasswordField(
                                        "currentPassword",
                                        t("settings.currentPassword"),
                                        t("settings.currentPasswordPlaceholder")
                                    )}

                                    {renderPasswordField(
                                        "newPassword",
                                        t("settings.newPassword"),
                                        t("settings.newPasswordPlaceholder")
                                    )}

                                    {renderPasswordField(
                                        "confirmPassword",
                                        t("settings.confirmNewPassword"),
                                        t("settings.confirmNewPasswordPlaceholder")
                                    )}

                                    {passwordError && (
                                        <div className="settings-message error" role="alert">
                                            {passwordError}
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="settings-message success" role="status">
                                            {passwordSuccess}
                                        </div>
                                    )}

                                    <div className="settings-password-actions">
                                        <button
                                            type="submit"
                                            className="settings-save-button"
                                            disabled={changingPassword}
                                        >
                                            {changingPassword
                                                ? t("settings.changingPassword")
                                                : t("settings.changePasswordButton")}
                                        </button>

                                        <button
                                            type="button"
                                            className="settings-password-cancel"
                                            disabled={changingPassword}
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setPasswordData({
                                                    currentPassword: "",
                                                    newPassword: "",
                                                    confirmPassword: "",
                                                });
                                                setPasswordError("");
                                                setPasswordSuccess("");
                                                setPasswordVisibility({
                                                    currentPassword: false,
                                                    newPassword: false,
                                                    confirmPassword: false,
                                                });
                                            }}
                                        >
                                            {t("common.cancel")}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>

                        {saving && (
                            <div className="settings-message">
                                {t("settings.saving")}
                            </div>
                        )}

                        {error && (
                            <div className="settings-message error">
                                {error}
                            </div>
                        )}

                        {!saving && success && (
                            <div className="settings-message success">
                                {success}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Settings;
