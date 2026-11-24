
import useLanguage from "../hooks/useLanguage";
import { useEffect, useState } from "react";
import "../styles/profile.css";
import Header from "../components/layout/Header";

import {
    getCurrentUser,
    updateProfile,
} from "../services/auth";

function MyProfile({
    user,
    isSidebarOpen,
    onToggleSidebar,
    onNavigate,
    onLogout,
}) {
    const { t } = useLanguage();
    const [profile, setProfile] = useState(user || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        email: "",
    });
    const [showEmail, setShowEmail] = useState(false);
    const [showUserId, setShowUserId] = useState(false);

    // Validate profile form data
    const validateProfile = () => {
        const errors = {};

        const username = formData.username.trim().toLowerCase();
        const fullName = formData.full_name.trim();
        const email = formData.email.trim();

        if (!username) {
            errors.username = t("profile.usernameRequired");
        } else if (!/^[a-z0-9_]{3,30}$/.test(username)) {
            errors.username = t("profile.usernameInvalid");
        }

        if (!fullName) {
            errors.full_name = t("profile.fullNameRequired");
        } else if (fullName.length > 100) {
            errors.full_name = t("profile.fullNameMax");
        }

        if (!email) {
            errors.email = t("profile.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = t("profile.emailInvalid");
        }

        setValidationErrors(errors);

        return Object.keys(errors).length === 0;
    };
    const handleSaveProfile = async () => {
        const isValid = validateProfile();
        if (!isValid) {
        return;
    }
    try {
        setSaving(true);
        setError("");
        setSuccess("");

        const updatedUser = await updateProfile({
            username: formData.username.trim().toLowerCase(),
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
        });

        setProfile(updatedUser);

        setFormData({
            username: updatedUser.username || "",
            full_name: updatedUser.full_name || "",
            email: updatedUser.email || "",
        });

        setIsEditing(false);
        setSuccess(t("profile.updatedSuccessfully"));
    } catch (error) {
        if (error.status === 409) {
            if (error.message === "Username is already taken.") {
                setError(t("profile.usernameTaken"));
            } else if (error.message === "Email is already in use.") {
                setError(t("profile.emailAlreadyInUse"));
            } else {
                setError(t("profile.updateFailed"));
            }
        } else {
            setError(error.message || t("profile.updateFailed"));
        }
    }
    finally {
        setSaving(false);
    }
};

    useEffect(() => {
        let cancelled = false;

        const fetchProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    throw new Error(t("profile.loadFailed"));
                }

                if (!cancelled) {
                    setProfile(currentUser);
                    setFormData({
                        username: currentUser?.username || "",
                        full_name: currentUser?.full_name || "",
                        email: currentUser?.email || "",
                    });
                }
            } catch {
                if (!cancelled) {
                    setError(t("profile.loadFailed"));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [t]);

    return (
        <div className="app-layout">
            <main className="main-content">
                <Header
                    title={t("profile.title")}
                    subtitle={t("profile.subtitle")}
                    user={profile || user}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={onToggleSidebar}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />

                
<section className="page-content">
    <div className="profile-page">

        {/* Profile Heading */}
        <div className="profile-page-heading">
            <h2>{t("profile.title")}</h2>
            <p>{t("profile.headingDescription")}</p>
        </div>
        {loading && (
    <p className="profile-status-message">
        {t("profile.loadingProfile")}
    </p>
)}

{error && (
    <p className="profile-status-message error">
        {error}
    </p>
)}

{success && (
    <p className="profile-status-message success">
        {success}
    </p>
)}


{/* Profile Overview */}
<div className="profile-overview-card">
    <div className="profile-avatar">
        {profile?.full_name
            ? profile.full_name.charAt(0).toUpperCase()
            : "U"}
    </div>

    <div className="profile-overview-info">
        <h3>{profile?.full_name || t("profile.notAvailable")}</h3>
        <p>@{profile?.username || t("profile.notAvailable")}</p>
        <span>{t("profile.personalAccount")}</span>
    </div>

    {!isEditing && (
        <button
            type="button"
            className="profile-edit-button"
            onClick={() => {
                setFormData({
                    username: profile?.username || "",
                    full_name: profile?.full_name || "",
                    email: profile?.email || "",
                });
                setValidationErrors({});
                setError("");
                setSuccess("");
                setIsEditing(true);
            }}
        >
            <i className="fas fa-pen"></i>
            {t("profile.editProfile")}
        </button>
    )}
</div>


{isEditing && (
    <div className="profile-edit-actions">
        <button
            type="button"
            className="profile-save-button"
            onClick={handleSaveProfile}
            disabled={saving}
        >
            {saving ? t("profile.saving") : t("profile.saveChanges")}
        </button>

        <button
            type="button"
            className="profile-cancel-button"
            onClick={() => {
                setFormData({
                    username: profile?.username || "",
                    full_name: profile?.full_name || "",
                    email: profile?.email || "",
                });
                setIsEditing(false);
            }}
        >
            {t("common.cancel")}
        </button>
    </div>
)}
        {/* Personal Information */}
        <div className="profile-section-card">
            <div className="profile-section-heading">
                <h3>{t("profile.personalInformation")}</h3>
                <p>{t("profile.personalInformationDescription")}</p>
        </div>
        <div className="profile-information-grid">
            <div className="profile-information-item">
                <label>
        <span className="profile-field-icon">👤</span>
        {t("profile.fullName")}
    </label>

    <div className="profile-information-value">
    {isEditing ? (
        <div className="profile-input-wrapper">
            <input
                type="text"
                value={formData.full_name}
                onChange={(event) =>
                    setFormData({
                        ...formData,
                        full_name: event.target.value,
                    })
                }
                placeholder={t("profile.enterFullName")}
                maxLength={100}
            />

            {validationErrors.full_name && (
                <small className="profile-validation-error">
                    {validationErrors.full_name}
                </small>
            )}
        </div>
    ) : (
        <p>{profile?.full_name || t("profile.notAvailable")}</p>
    )}
</div>
</div>
                <div className="profile-information-item">
                <label>
                    <span className="profile-field-icon">@</span>
                    {t("profile.username")}
                </label>

                {isEditing ? (
                    <div className="profile-input-wrapper">
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    username: e.target.value,
                                })
                            }
                            placeholder={t("profile.enterUsername")}
                            maxLength={30}
                            autoComplete="username"
                        />

                        {validationErrors.username && (
                            <span className="profile-validation-error">
                                {validationErrors.username}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="profile-information-value">
                        <p>{profile?.username || t("profile.notAvailable")}</p>
                    </div>
                )}
            </div>
    <div className="profile-information-item">
        <label>
            <span className="profile-field-icon">✉</span>
            {t("profile.email")}
        </label>
        <div className="profile-information-value">
            {isEditing ? (
    <div className="profile-input-wrapper">
        <input
            type="email"
            value={formData.email}
            onChange={(event) =>
                setFormData({
                    ...formData,
                    email: event.target.value,
                })
            }
            placeholder={t("profile.enterEmail")}
            maxLength={255}
        />

        {validationErrors.email && (
            <small className="profile-validation-error">
                {validationErrors.email}
            </small>
        )}
    </div>
) : (
            <>
    <p>
        {showEmail
            ? profile?.email || t("profile.notAvailable")
            : "••••••••••••"}
    </p>

    <button
    type="button"
    className="profile-visibility-button"
    onClick={() => setShowEmail((previous) => !previous)}
    aria-label={showEmail ? t("profile.hideEmail") : t("profile.showEmail")}
    title={showEmail ? t("profile.hideEmail") : t("profile.showEmail")}
>
    {showEmail ? (
        <svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 3l18 18" />
            <path d="M10.58 10.58a2 2 0 002.83 2.83" />
            <path d="M9.88 5.09A10.94 10.94 0 0112 4.5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-4.16 5.19" />
            <path d="M6.61 6.61A11.9 11.9 0 001 12c1.73 4.39 6 7.5 11 7.5a10.94 10.94 0 004.91-1.14" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
            )}
            </button>
        </>
        )}
        </div>
    </div>
    </div>
        </div>

        {/* Account Information */}
        <div className="profile-section-card">
            <div className="profile-section-heading">
                <h3>{t("profile.accountInformation")}</h3>
                <p>{t("profile.accountInformationDescription")}</p>
            </div>

            
<div className="profile-information-grid">
    <div className="profile-information-item">
        <label>
            <span className="profile-field-icon">🆔</span>
            {t("profile.userId")}
        </label>
        <div className="profile-information-value">
    <p>
        {showUserId
            ? profile?.user_id || t("profile.notAvailable")
            : "••••••••"}
    </p>

    <button
    type="button"
    className="profile-visibility-button"
    onClick={() => setShowUserId((previous) => !previous)}
    aria-label={showUserId ? t("profile.hideUserId") : t("profile.showUserId")}
    title={showUserId ? t("profile.hideUserId") : t("profile.showUserId")}
>
    {showUserId ? (
        <svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 3l18 18" />
            <path d="M10.58 10.58a2 2 0 002.83 2.83" />
            <path d="M9.88 5.09A10.94 10.94 0 0112 4.5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-4.16 5.19" />
            <path d="M6.61 6.61A11.9 11.9 0 001 12c1.73 4.39 6 7.5 11 7.5a10.94 10.94 0 004.91-1.14" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )}
</button>
</div>
    </div>

    <div className="profile-information-item">
        <label>
            <span className="profile-field-icon">📅</span>
            {t("profile.accountCreated")}
        </label>
        <div className="profile-information-value">
            <p>
                {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : t("profile.notAvailable")}
            </p>
        </div>
    </div>
</div>

        </div>

    </div>
</section>

            </main>
        </div>
    );
}

export default MyProfile;
