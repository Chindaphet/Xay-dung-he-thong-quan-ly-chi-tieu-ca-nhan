
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";
import useLanguage from "../../hooks/useLanguage";

ChartJS.register( ArcElement,Tooltip);

const DEFAULT_COLORS = [
    "#7652D5",
    "#A78BFA",
    "#C4B5FD",
    "#24A77A",
    "#F2A65A",
    "#E45D76",
    "#5B9BD5",
    "#8C7AA9",
];

const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
};

function ExpenseCategoryChart({ data = [] }) {
    const { t } = useLanguage();

    const totalExpenses = data.reduce(
        (sum, item) => sum + Number(item.total_amount || 0),0);
    const chartData = { labels: data.map((item) => item.category_name),
        datasets: [
            {
                data: data.map((item) =>
                    Number(item.total_amount || 0)),
                backgroundColor: data.map(
                    (item, index) =>
                        item.category_color ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
                borderWidth: 3,
                borderColor: "#FFFFFF",
                hoverOffset: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {legend: {display: false,},
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.parsed;

                        const percentage = totalExpenses > 0
                            ? ((value / totalExpenses) * 100).toFixed(1)
                            : "0.0";

                        return `${context.label}: ${formatVND(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <section className="chart-card category-chart-card">
            <div className="chart-card-header">
                <div>
                    <h3>{t("dashboard.expenseByCategoryTitle")}</h3>
                    <p>{t("dashboard.expenseByCategoryDescription")}</p>
                </div>
            </div>

            {data.length > 0 ? (
                <div className="category-chart-content">

                    {/* Doughnut Chart */}
                    <div className="doughnut-chart-container">
                        <Doughnut
                            data={chartData}
                            options={options}/>
                            <div className="doughnut-center">
                            <span>{t("dashboard.totalExpensesLabel")}</span>
                            <strong>
                                {new Intl.NumberFormat("vi-VN", {
                                    maximumFractionDigits: 1,
                                }).format(totalExpenses)}
                            </strong>

                            <small>VND</small>
                        </div>
                    </div>

                    {/* Category Details */}
                    <div className="category-chart-details">
                        {data.map((item, index) => {
                            const amount = Number(
                                item.total_amount || 0);
                                const percentage = totalExpenses > 0
                                ? (amount / totalExpenses) * 100
                                : 0;

                                const color =
                                    item.category_color ||
                                    DEFAULT_COLORS[index % DEFAULT_COLORS.length];

                                return (
                                    <div
                                        className="category-detail-item"
                                        key={item.category_id || index}>
                                        <div className="category-detail-info">
                                            <span
                                                className="category-detail-dot"
                                                style={{backgroundColor: color,}}/>
                                                <span className="category-detail-name">{item.category_name}</span>
                                        </div>
                                        <div className="category-detail-values">
                                            <strong>{formatVND(amount)}</strong>
                                            <span>{percentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="chart-empty">{t("dashboard.noExpenseData")}</div>
            )}
            <p className="category-chart-note">{t("dashboard.expenseDistributionNote")}</p>
        </section>
    );
}

export default ExpenseCategoryChart;
