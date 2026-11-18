
const API_BASE_URL = "http://localhost:6116/api";

// Login
export const login = async (identifier, password) => {
    const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
        }
    );

    const result = await response.json();
    if (!response.ok) {
        const error = new Error(
            result.message || "Login failed."
        );

        error.status = response.status;
        error.details = result.details || null;
        throw error;
    }

    const { accessToken, refreshToken, user } = result.data;
    if (!accessToken || !refreshToken) {
        throw new Error("Invalid login response from server.");
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    return user;
};

// Register
export const register = async (userData) => {
    const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(
            result.message || "Registration failed."
        );

        error.status = response.status;
        error.details = result.details || null;

        throw error;
    }

    return result.data.user;
};

// Get authenticated user
export const getCurrentUser = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        return null;
    }

    const response = await fetch(
        `${API_BASE_URL}/auth/me`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        return null;
    }

    const result = await response.json();

    return result.data.user;
};

// Update authenticated user profile
export const updateProfile = async (profileData) => {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to update profile.");
    }

    return result.data.user;
};

// Request password reset
export const requestPasswordReset = async (email) => {
    const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Unable to request password reset."
        );
    }

    return result;
};

// Reset password
export const resetPassword = async (token, password) => {
    const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                password,
            }),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(
            result.message || "Password reset failed."
        );

        error.status = response.status;
        error.details = result.details || null;

        throw error;
    }

    return result;
};

// Logout
export const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
        if (refreshToken) {
            await fetch(
                `${API_BASE_URL}/auth/logout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        refreshToken,
                    }),
                }
            );
        }
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    }
};
