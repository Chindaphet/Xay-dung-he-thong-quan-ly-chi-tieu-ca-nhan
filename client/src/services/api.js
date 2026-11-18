
const API_BASE_URL = "http://localhost:6116/api";
// Send an HTTP request to the backend
const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("accessToken");
    const headers = {"Content-Type": "application/json",...options.headers,}
    if (token) {headers.Authorization = `Bearer ${token}`;}
    const response = await fetch(`${API_BASE_URL}${endpoint}`,{...options,headers,});
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.message || "An unexpected API error occurred.");
        error.status = response.status;
        error.details = data.details || null;
        throw error;}
    return data;
};

// Dashboard API
export const getDashboardOverview = async (startDate,endDate) => {
    const params = new URLSearchParams({startDate,endDate,});
    return apiRequest(`/dashboard/overview?${params.toString()}`);
};

// Transaction APIs
export const getTransactions = async () => {
    return apiRequest("/transactions");
};

export const getTransactionById = async (transactionId) => {
    return apiRequest(`/transactions/${transactionId}`);
};

export const createTransaction = async (transactionData) => {
    return apiRequest("/transactions", {method: "POST",body: JSON.stringify(transactionData),});
};

export const updateTransaction = async (transactionId,transactionData) => {
    return apiRequest(`/transactions/${transactionId}`, {method: "PUT",body: JSON.stringify(transactionData),});
};
export const deleteTransaction = async (transactionId) => {
    return apiRequest(`/transactions/${transactionId}`, {
        method: "DELETE",
    });
};

// Category API
export const getCategories = async (includeInactive = false) => {
    const params = new URLSearchParams({
        includeInactive: String(includeInactive),
    });

    return apiRequest(`/categories?${params.toString()}`);
};

export const createCategory = async (categoryData) => {
    return apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
    });
};

export const updateCategory = async (categoryId,categoryData) => {
    return apiRequest(`/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(categoryData),
    });
};

export const toggleCategory = async (categoryId,isActive) => {
    return apiRequest(`/categories/${categoryId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
    });
};

// Payment Method API
export const getPaymentMethods = async (includeInactive = false) => {
    const params = new URLSearchParams({
        includeInactive: String(includeInactive),
    });

    return apiRequest(`/payment-methods?${params.toString()}`);
};

export const createPaymentMethod = async (paymentMethodData) => {
    return apiRequest("/payment-methods", {
        method: "POST",
        body: JSON.stringify(paymentMethodData),
    });
};

export const updatePaymentMethod = async (paymentMethodId,paymentMethodData) => {
    return apiRequest(`/payment-methods/${paymentMethodId}`, {
        method: "PUT",
        body: JSON.stringify(paymentMethodData),
    });
};

export const togglePaymentMethod = async (paymentMethodId,isActive) => {
    return apiRequest(`/payment-methods/${paymentMethodId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
    });
};

// Get monthly budget overview
export const getBudgetOverview = async (month) => {
    const params = new URLSearchParams({
        month,
    });

    return apiRequest(
        `/budgets?${params.toString()}`
    );
};

// Create a monthly budget
export const createBudget = async (budgetData) => {
    return apiRequest("/budgets", {
        method: "POST",
        body: JSON.stringify(budgetData),
    });
};

// Update the overall monthly budget
export const updateBudget = async (budgetId,budgetData) => {
    return apiRequest(`/budgets/${budgetId}`, {
        method: "PUT",
        body: JSON.stringify(budgetData),
    });
};

// Add a category budget
export const createCategoryBudget = async (budgetId,categoryData) => {
    return apiRequest(
        `/budgets/${budgetId}/categories`,
        {
            method: "POST",
            body: JSON.stringify(categoryData),
        }
    );
};

// Update a category budget
export const updateCategoryBudget = async (budgetId,categoryId,categoryData) => {
    return apiRequest(
        `/budgets/${budgetId}/categories/${categoryId}`,
        {
            method: "PUT",
            body: JSON.stringify(categoryData),
        }
    );
};

// Delete a category budget
export const deleteCategoryBudget = async (budgetId,categoryId) => {
    return apiRequest(
        `/budgets/${budgetId}/categories/${categoryId}`,
        {
            method: "DELETE",
        }
    );
};

// ========================================
// RECURRING APIs
// ========================================

// Get all recurring transactions
export const getRecurring = async () => {
    return apiRequest("/recurring");
};

// Get one recurring transaction
export const getRecurringById = async (recurringId) => {
    return apiRequest(`/recurring/${recurringId}`);
};

// Create a recurring transaction
export const createRecurring = async (recurringData) => {
    return apiRequest("/recurring", {
        method: "POST",
        body: JSON.stringify(recurringData),
    });
};

// Update a recurring transaction
export const updateRecurring = async (recurringId,recurringData) => {
    return apiRequest(`/recurring/${recurringId}`, {
        method: "PUT",
        body: JSON.stringify(recurringData),
    });
};

// Activate or deactivate a recurring transaction
export const toggleRecurring = async (recurringId,isActive) => {
    return apiRequest(`/recurring/${recurringId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
    });
};

// ========================================
// SMART ANALYSIS API
// ========================================
export const getSmartAnalysis = async (startDate, endDate) => {
    const params = new URLSearchParams({
        startDate,
        endDate,
    });

    return apiRequest(`/smart-analysis?${params.toString()}`);
};

// ========================================
// WHAT-IF SIMULATOR API
// ========================================

// Run a financial simulation
export const runSimulator = async (simulationData) => {
    return apiRequest("/simulator", {
        method: "POST",
        body: JSON.stringify(simulationData),
    });
};

// ========================================
// SETTINGS API
// ========================================

// Get user settings
export const getSettings = async () => {
    return apiRequest("/settings");
};

// Update user settings
export const updateSettings = async (settingsData) => {
    return apiRequest("/settings", {
        method: "PUT",
        body: JSON.stringify(settingsData),
    });
};
