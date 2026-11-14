
import useLanguage from "../../hooks/useLanguage";

const formatVND = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
};

function SummaryCards({ summary }) {
    const { t } = useLanguage();

    const totalIncome = Number(summary?.total_income || 0);
    const totalExpenses = Number(summary?.total_expenses || 0);
    const netBalance = Number(summary?.net_balance || 0);

    // Calculate savings rate
    const savingsRate =
        totalIncome > 0
            ? (netBalance / totalIncome) * 100
            : 0;

    const cards = [
        {
            id: "income",
            title: t("dashboard.totalIncome"),
            amount: formatVND(totalIncome),
            icon: "↗",
            className: "income",
            description: t("summary.totalMoneyReceived"),
            status: "VND",
        },
        {
            id: "expenses",
            title: t("dashboard.totalExpenses"),
            amount: formatVND(totalExpenses),
            icon: "↘",
            className: "expenses",
            description: t("summary.totalMoneySpent"),
            status: "VND",
        },
        {
            id: "balance",
            title: t("summary.netBalance"),
            amount: formatVND(netBalance),
            icon: "◈",
            className: "balance",
            description: t("summary.incomeMinusExpenses"),
            status: "VND",
        },
        {
            id: "savings",
            title: t("summary.savingsRate"),
            amount: `${savingsRate.toFixed(2)}%`,
            icon: "%",
            className: "savings",
            description: t("summary.incomeSaved"),
            status: null,
        },
    ];

    return (
        <section className="summary-grid">
            {cards.map((card) => (
                <article
                    className={`summary-card ${card.className}`}
                    key={card.id}
                >
                    <div className="summary-card-top">
                        <div className="summary-card-title">
                            <span>{card.title}</span>
                            <p>{card.description}</p>
                        </div>

                        <div className="summary-card-icon">
                            {card.icon}
                        </div>
                    </div>

                    <div className="summary-card-amount">
                        {card.amount}
                    </div>

                    <div className="summary-card-footer">
                        <span>{t("summary.selectedPeriod")}</span>

                        {card.status && (
                            <span className="summary-card-status">
                                {card.status}
                            </span>
                        )}
                    </div>
                </article>
            ))}
        </section>
    );
}

export default SummaryCards;
