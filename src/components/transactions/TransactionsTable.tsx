import { formatCurrency, formatIsoDate } from "../../lib/formatters";
import { CategoryCombobox } from "./CategoryCombobox";
import type { Bank, Category, Transaction, TransactionType } from "../../types/app";

type TransactionsTableProps = {
  transactions: Transaction[];
  categoryOptions: string[];
  bankOptions: string[];
  investmentOptions: string[];
  onChangeTransaction: (id: string, patch: Partial<Transaction>) => void;
};

export function TransactionsTable({
  bankOptions,
  categoryOptions,
  investmentOptions,
  onChangeTransaction,
  transactions,
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-line bg-white/70 text-sm text-muted backdrop-blur-xl">
        Nenhum CSV carregado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/75 bg-white/74 shadow-soft backdrop-blur-xl">
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-white/95 text-xs uppercase tracking-[0.12em] text-muted backdrop-blur-xl">
            <tr>
              <th className="border-b border-line px-4 py-3 font-medium">Data</th>
              <th className="border-b border-line px-4 py-3 font-medium">Nome</th>
              <th className="border-b border-line px-4 py-3 font-medium">Tipo</th>
              <th className="border-b border-line px-4 py-3 font-medium">Realizado</th>
              <th className="border-b border-line px-4 py-3 text-right font-medium">Valor</th>
              <th className="border-b border-line px-4 py-3 text-right font-medium">Valor Realizado</th>
              <th className="border-b border-line px-4 py-3 font-medium">Banco</th>
              <th className="border-b border-line px-4 py-3 font-medium">Categoria</th>
              <th className="border-b border-line px-4 py-3 font-medium">Investimento</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr className="border-b border-line last:border-b-0" key={transaction.id}>
                <td className="px-4 py-3">
                  <input
                    className="h-9 w-32 rounded-md border border-line bg-white px-2 text-sm text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    onChange={(event) =>
                      onChangeTransaction(transaction.id, {
                        date: event.target.value,
                      })
                    }
                    title={formatIsoDate(transaction.date)}
                    type="date"
                    value={transaction.date}
                  />
                </td>
                <td className="max-w-[360px] px-4 py-3 font-medium text-ink">
                  <input
                    className="h-9 w-full min-w-64 rounded-md border border-line bg-white px-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    onChange={(event) =>
                      onChangeTransaction(transaction.id, {
                        name: event.target.value,
                      })
                    }
                    value={transaction.name}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className="h-9 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    onChange={(event) =>
                      onChangeTransaction(transaction.id, {
                        type: event.target.value as TransactionType,
                      })
                    }
                    value={transaction.type}
                  >
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    checked={transaction.realized}
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                    onChange={(event) =>
                      onChangeTransaction(transaction.id, {
                        realized: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <EditableAmount
                    onChange={(amount) =>
                      onChangeTransaction(transaction.id, {
                        amount,
                      })
                    }
                    tone={transaction.type === "Entrada" ? "income" : "outcome"}
                    value={transaction.amount}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <EditableAmount
                    onChange={(realizedAmount) =>
                      onChangeTransaction(transaction.id, {
                        realizedAmount,
                      })
                    }
                    tone={transaction.type === "Entrada" ? "income" : "outcome"}
                    value={transaction.realizedAmount}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className="h-9 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    onChange={(event) =>
                      onChangeTransaction(transaction.id, {
                        bank: event.target.value as Bank,
                      })
                    }
                    value={transaction.bank}
                  >
                    {bankOptions.map((bankOption) => (
                      <option key={bankOption} value={bankOption}>
                        {bankOption}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <CategoryCombobox
                    onChange={(category) =>
                      onChangeTransaction(transaction.id, {
                        category: category as Category,
                      })
                    }
                    value={transaction.category}
                    options={categoryOptions}
                  />
                </td>
                <td className="px-4 py-3">
                  <CategoryCombobox
                    onChange={(investment) =>
                      onChangeTransaction(transaction.id, {
                        investment: investment.trim() ? investment : null,
                      })
                    }
                    value={transaction.investment ?? ""}
                    options={investmentOptions}
                    placeholder="Selecione o investimento"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type EditableAmountProps = {
  value: number;
  onChange: (value: number) => void;
  tone: "income" | "outcome";
};

function EditableAmount({ onChange, tone, value }: EditableAmountProps) {
  const displayValue = Math.abs(value);

  return (
    <input
      className={`h-9 w-32 rounded-md border border-line bg-white px-2 text-right text-sm font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
        tone === "income" ? "text-emerald-700" : "text-red-700"
      }`}
      onChange={(event) => {
        const nextValue = Math.abs(Number(event.target.value));

        if (Number.isFinite(nextValue)) {
          onChange(nextValue);
        }
      }}
      step="0.01"
      title={formatCurrency(displayValue)}
      type="number"
      value={displayValue}
    />
  );
}
