import { AlertTriangle, FileUp, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { FinancialSummary } from "../components/transactions/FinancialSummary";
import { TransactionsTable } from "../components/transactions/TransactionsTable";
import { apiClient } from "../lib/api-client";
import { parseCsvFile } from "../lib/csv-parser";
import type { Bank, ParsedCsvResult, Transaction } from "../types/app";

type Status = {
  tone: "success" | "error" | "warning";
  message: string;
};

export function HomePage() {
  const [bank, setBank] = useState<Bank>("Inter");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvResult | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [bankOptions, setBankOptions] = useState<string[]>(["Inter", "Nubank"]);
  const [investmentOptions, setInvestmentOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<"parse" | "import" | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const transactions: Transaction[] = parsedCsv?.transactions ?? [];

  useEffect(() => {
    void loadCategoryOptions();
  }, []);

  async function loadCategoryOptions() {
    try {
      const result = await apiClient.listNotionPropertyOptions();

      if (result.ok) {
        setCategoryOptions(result.data.categoryOptions);
        setInvestmentOptions(result.data.investmentOptions);

        if (result.data.bankOptions.length > 0) {
          setBankOptions(result.data.bankOptions);
          setBank((currentBank) =>
            result.data.bankOptions.includes(currentBank) ? currentBank : result.data.bankOptions[0],
          );
        }
      }
    } catch {
      setCategoryOptions([]);
    }
  }

  function getDefaultCategory(options: string[]): string {
    return options.find((option) => option === "Itens Básicos") ?? options[0] ?? "Itens Básicos";
  }

  function handleChangeTransaction(id: string, patch: Partial<Transaction>) {
    setParsedCsv((current) => {
      if (!current) return current;

      return {
        ...current,
        transactions: current.transactions.map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                ...patch,
              }
            : transaction,
        ),
      };
    });
  }

  async function handleSelectFile(file: File | null) {
    setStatus(null);
    setSelectedFile(file);
    setParsedCsv(null);

    if (!file) {
      return;
    }

    setLoading("parse");
    setStatus(null);

    let result: ParsedCsvResult;

    try {
      result = await parseCsvFile(file, bank);
    } catch (error) {
      setLoading(null);
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível validar o CSV.",
      });
      return;
    }

    setLoading(null);

    const defaultCategory = getDefaultCategory(categoryOptions);
    const normalizedResult = {
      ...result,
      transactions: result.transactions.map((transaction) => ({
        ...transaction,
        category: categoryOptions.includes(transaction.category) ? transaction.category : defaultCategory,
      })),
    };

    setParsedCsv(normalizedResult);

    if (normalizedResult.duplicates.length > 0) {
      setStatus({
        tone: "warning",
        message: `CSV validado com ${normalizedResult.duplicates.length} duplicidade(s). Revise antes de importar.`,
      });
      return;
    }

    setStatus({
      tone: "success",
      message: `CSV validado com ${normalizedResult.transactions.length} transação(ões).`,
    });
  }

  async function handleImport() {
    if (transactions.length === 0) {
      setStatus({ tone: "warning", message: "Carregue e valide um CSV antes de importar." });
      return;
    }

    const hasDuplicates = (parsedCsv?.duplicates.length ?? 0) > 0;
    const confirmed = window.confirm(
      hasDuplicates
        ? "Existem duplicidades no CSV. Deseja importar mesmo assim?"
        : "Confirmar importação das transações para o Notion?",
    );

    if (!confirmed) return;

    setLoading("import");
    setStatus(null);

    const result = await apiClient.importTransactions(transactions);
    setLoading(null);

    if (!result.ok) {
      setStatus({ tone: "error", message: result.error });
      return;
    }

    setStatus({
      tone: result.data.failed > 0 ? "warning" : "success",
      message: `${result.data.imported} transação(ões) importada(s). ${result.data.failed} falha(s).`,
    });
  }

  return (
    <main className="flex-1 overflow-auto bg-transparent">
      <div className="mx-auto grid max-w-6xl gap-6 px-8 py-8">
        <header>
          <p className="text-sm font-medium text-muted">Importar CSV</p>
          <h2 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Pré-visualize antes de enviar ao Notion</h2>
        </header>

        <section className="rounded-xl border border-white/75 bg-white/72 p-5 shadow-soft backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-end">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-ink">Banco</span>
              <select
                className="h-10 rounded-lg border border-line bg-white/85 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                onChange={(event) => {
                  setBank(event.target.value as Bank);
                  setParsedCsv(null);
                }}
                value={bank}
              >
                {bankOptions.map((bankOption) => (
                  <option key={bankOption} value={bankOption}>
                    {bankOption}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 text-sm">
              <span className="font-medium text-ink">Arquivo CSV</span>
              <label
                className="flex h-10 items-center justify-between rounded-lg border border-line bg-white/85 px-3 text-left text-sm text-muted transition hover:bg-white"
              >
                <span className="truncate">
                  {loading === "parse" ? "Validando CSV..." : selectedFile?.name ?? "Selecionar arquivo .csv"}
                </span>
                {loading === "parse" ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
                <input
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={loading !== null}
                  onChange={(event) => void handleSelectFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </div>
          </div>
        </section>

        {status ? (
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
              status.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : status.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <span>{status.message}</span>
          </div>
        ) : null}

        <FinancialSummary transactions={transactions} />
        <TransactionsTable
          bankOptions={bankOptions}
          categoryOptions={categoryOptions}
          investmentOptions={investmentOptions}
          onChangeTransaction={handleChangeTransaction}
          transactions={transactions}
        />

        <div className="flex justify-end">
          <Button
            disabled={transactions.length === 0 || loading !== null}
            icon={loading === "import" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            onClick={handleImport}
          >
            Importar para Notion
          </Button>
        </div>
      </div>
    </main>
  );
}
