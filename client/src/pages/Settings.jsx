
import { useEffect, useState } from "react";
import useLanguage from "../hooks/useLanguage";
import Header from "../components/layout/Header";
import { getSettings, updateSettings } from "../services/api";
import "../styles/settings.css";

function Settings({ user, isSidebarOpen, onToggleSidebar }) {
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        theme: "system",
        currency: "VND",
        numberFormat: "vi-VN",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                setError("");

                const result = await getSettings();
                const settings = result.data.settings;

                setFormData({
                    theme: settings.theme,
                    currency: settings.currency,
                    numberFormat: settings.number_format,
                });
            } catch (err) {
                setError(t("settings.loadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [t]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSuccess("");
        setError("");
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await updateSettings(formData);

            setSuccess(t("settings.savedSuccessfully"));
        } catch (err) {
            setError(t("settings.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <Header
                title={t("settings.title")}
                subtitle={t("settings.subtitle")}
                user={user}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={onToggleSidebar}
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
                                    value={formData.theme}
                                    onChange={handleChange}
                                >
                                    <option value="light">
                                        {t("settings.light")}
                                    </option>
                                    <option value="dark">
                                        {t("settings.dark")}
                                    </option>
                                    <option value="system">
                                        {t("settings.system")}
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

                        {error && (
                            <div className="settings-message error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="settings-message success">
                                {success}
                            </div>
                        )}

                        <button
                            className="settings-save-button"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? t("settings.saving")
                                : t("settings.saveChanges")}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default Settings;
