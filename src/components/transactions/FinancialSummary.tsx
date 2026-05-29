import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Rows3 } from "lucide-react";
import { formatCurrency } from "../../lib/formatters";
import type { Transaction } from "../../types/app";

type FinancialSummaryProps = {
  transactions: Transaction[];
};

export function FinancialSummary({ transactions }: FinancialSummaryProps) {
  const income = transactions
    .filter((transaction) => transaction.type === "Entrada")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const outcome = transactions
    .filter((transaction) => transaction.type === "Saída")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const balance = income - outcome;

  const items = [
    { label: "Entradas", value: formatCurrency(income), icon: ArrowUpRight, tone: "text-emerald-700" },
    { label: "Saídas", value: formatCurrency(outcome), icon: ArrowDownLeft, tone: "text-red-700" },
    { label: "Saldo", value: formatCurrency(balance), icon: CircleDollarSign, tone: "text-ink" },
    { label: "Transações", value: String(transactions.length), icon: Rows3, tone: "text-ink" },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            className="rounded-xl border border-white/75 bg-white/72 p-4 shadow-soft backdrop-blur-xl"
            key={item.label}
          >
            <div className="mb-3 flex items-center justify-between text-muted">
              <span className="text-xs font-medium uppercase tracking-[0.12em]">{item.label}</span>
              <Icon size={16} />
            </div>
            <p className={`text-lg font-semibold ${item.tone}`}>{item.value}</p>
          </div>
        );
      })}
    </section>
  );
}
