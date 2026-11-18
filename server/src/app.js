
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Routes
const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transaction.routes");
const categoryRoutes = require("./routes/category.routes");
const paymentMethodRoutes = require("./routes/payment-method.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const budgetRoutes = require("./routes/budget.routes");
const recurringRoutes = require("./routes/recurring.routes");
const smartAnalysisRoutes = require("./routes/smart-analysis.routes");
const gamificationRoutes = require("./routes/gamification.routes");
const simulatorRoutes = require("./routes/simulator.routes");
const settingsRoutes = require("./routes/settings.routes");

// Middleware
const errorMiddleware = require("./middlewares/error.middleware");

// Initialize Express
const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:9165",
        credentials: true,})
    );

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Personal Expense Management API is running.",
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/smart-analysis", smartAnalysisRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/settings", settingsRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

// Global Error Handler
app.use(errorMiddleware);

// Export Express App
module.exports = app;
