
import { useState } from "react";

import { 
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";
import useLanguage from "../../hooks/useLanguage";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
};

// Format date as YYYY-MM-DD without timezone conversion
const getDateParts = (dateString) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
        dateString || ""
    );

    if (!match) return null;
        return {
            year: Number(match[1]),
            month: Number(match[2]),
            day: Number(match[3]),};
};

// Get Monday of the week
const getWeekStart = (dateString) => {
    const parts = getDateParts(dateString);

    if (!parts) return null;

    const date = new Date(
        Date.UTC( parts.year,  parts.month - 1,  parts.day));
    const day = date.getUTCDay();
    const difference = day === 0 ? -6 : 1 - day;

    date.setUTCDate(date.getUTCDate() + difference);

    return date.toISOString().slice(0, 10);
};

// Format weekly label
const formatWeekLabel = (weekStart) => {
    const start = new Date(`${weekStart}T00:00:00Z`);
    const end = new Date(start);

    end.setUTCDate(end.getUTCDate() + 6);

    const format = (date) => {
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "UTC",
        }).format(date);
    };

    return `${format(start)} - ${format(end)}`;
};

// Group transaction data by selected period
const groupDataByPeriod = (data, period) => {
    const groupedData = {};

    data.forEach((item) => {
        if (!item.transaction_date) return;

        let periodKey;

        if (period === "weekly") {
            periodKey = getWeekStart(item.transaction_date);
        } else {
            periodKey = item.transaction_date.slice(0, 7);
        }

        if (!periodKey) return;

        if (!groupedData[periodKey]) {
            groupedData[periodKey] = {
                income: 0,
                expenses: 0,
            };
        }        
        groupedData[periodKey].income += Number(
            item.income || 0);

        groupedData[periodKey].expenses += Number(
            item.expenses || 0);
    });

    return Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, values]) => ({
            period: key,
            income: values.income,
            expenses: values.expenses,
        }));
};

// Format monthly label
const formatMonthLabel = (month) => {
    const [year, monthNumber] = month.split("-");

    return `${monthNumber}/${year}`;
};

function IncomeExpenseChart({ data = [] }) {
    const { t } = useLanguage();

    const [period, setPeriod] = useState("monthly");

    const groupedData = groupDataByPeriod(data, period);

    const chartData = {
        labels: groupedData.map((item) =>
            period === "monthly"
                ? formatMonthLabel(item.period)
                : formatWeekLabel(item.period)
            ),
        datasets: [
            {
                label: t("dashboard.income"),
                data: groupedData.map((item) => item.income),

                backgroundColor: "rgba(36, 167, 122, 0.65)",
                borderColor: "#24A77A",
                borderWidth: 1,

                order: 2,
                grouped: false,
                maxBarThickness: 38,
                borderRadius: 5,
                borderSkipped: false,
            },
            {
                label: t("dashboard.expenses"),
                data: groupedData.map((item) => item.expenses),

                backgroundColor: "rgba(239, 83, 103, 0.65)",
                borderColor: "#EF5367",
                borderWidth: 1,

                order: 1,
                grouped: false,
                maxBarThickness: 38,
                borderRadius: 5,
                borderSkipped: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false,
        },

        plugins: {
            legend: {
                position: "top",
                align: "end",

                labels: {
                    usePointStyle: true,
                    pointStyle: "rectRounded",
                    boxWidth: 8,
                    padding: 16,
                },
            },

            tooltip: {
                callbacks: {
                    label: (context) =>
                        `${context.dataset.label}: ${formatVND(
                            context.parsed.y
                        )}`,
                },
                itemSort: (a, b) => a.datasetIndex - b.datasetIndex,
            },
        },

        scales: {
            x: {
                grid: {
                    display: false,},
                    ticks: {autoSkip: true,maxRotation: 0,},
            },

            y: {
                beginAtZero: true,

                grid: { 
                    color: "rgba(150, 150, 150, 0.12)",
                },                
                ticks: {
                    callback: (value) =>
                        new Intl.NumberFormat("vi-VN", {
                            notation: "compact",
                            maximumFractionDigits: 1,
                        }).format(value),
                },
            },
        },
    };

    return (
        <section className="chart-card income-expense-card">
            <div className="chart-card-header">
                <div>
                    <h3>{t("dashboard.incomeExpenseTitle")}</h3>
                    <p>{t("dashboard.incomeExpenseDescription")}</p>
                </div>

                <div className="chart-period-controls">
                    <button
                        type="button"
                        className={period === "monthly" ? "active" : ""}

                        onClick={() => setPeriod("monthly")}>
                        {t("dashboard.monthly")}
                    </button>

                    <button
                        type="button"
                        className={period === "weekly" ? "active" : ""}
                        onClick={() =>
                        setPeriod("weekly")}
                    >
                        {t("dashboard.weekly")}
                    </button>
                </div>
            </div>

            <div className="line-chart-container">
                {groupedData.length > 0 ? (
                    <Bar
                        data={chartData}
                        options={options}
                    />
                ) : (
                    <div className="chart-empty">
                        {t("dashboard.noTransactionData")}
                    </div>
                )}
            </div>
        </section>
    );
}

export default IncomeExpenseChart;
