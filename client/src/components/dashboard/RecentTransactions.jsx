
import useLanguage from "../../hooks/useLanguage";
const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
};

const formatDate = (date, language) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat(
        language === "vi" ? "vi-VN" : "en-US",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC",
        }
    ).format(new Date(`${date}T00:00:00Z`));
};

function RecentTransactions({ data = [] }) {
    const { t, language } = useLanguage();
    return (
        <section className="recent-transactions-card">
            <div className="recent-transactions-header">
                <div>
                    <h3>{t("recentTransactions.title")}</h3>
                    <p>{t("recentTransactions.subtitle")}</p>
                </div>

                <span className="transaction-count">
                    {data.length} {t("recentTransactions.records")}
                </span>
            </div>

            <div className="transactions-table-wrapper">
                <table className="transactions-table">
                    <thead>
                        <tr>
                            <th>{t("recentTransactions.description")}</th>
                            <th>{t("recentTransactions.category")}</th>
                            <th>{t("recentTransactions.date")}</th>
                            <th>{t("recentTransactions.type")}</th>
                            <th className="amount-column">
                                {t("recentTransactions.amount")}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.length > 0 ? (
                            data.map((transaction) => {
                                const isIncome =
                                    transaction.type === "income";

                                return (
                                    <tr
                                        key={transaction.transactions_id}
                                    >
                                        <td>
                                            <div className="transaction-description">
                                                <strong>
                                                    {transaction.description || t("recentTransactions.untitled")}
                                                </strong>

                                                <span>
                                                    {transaction.payment_method_name ||
                                                        t("recentTransactions.noPaymentMethod")}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            {transaction.category_name ||
                                                t("recentTransactions.uncategorized")}
                                        </td>

                                        <td>
                                            {formatDate(
                                                transaction.transaction_date,
                                                language
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={`transaction-type ${
                                                    isIncome
                                                        ? "type-income"
                                                        : "type-expense"
                                                }`}
                                            >
                                                {isIncome
                                                    ? t("recentTransactions.income")
                                                    : t("recentTransactions.expense")}
                                            </span>
                                        </td>

                                        <td
                                            className={`amount-column ${
                                                isIncome
                                                    ? "amount-income"
                                                    : "amount-expense"
                                                
                                            }`}
                                        >
                                            {isIncome ? "+" : "-"}
                                            {formatVND(
                                                transaction.amount
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="table-empty"
                                >
                                    {t("recentTransactions.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default RecentTransactions;
