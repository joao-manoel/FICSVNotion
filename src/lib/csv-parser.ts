import Papa from "papaparse";
import type { Bank, ParsedCsvResult, Transaction } from "../types/app";

type InterCsvRow = {
  "Data Lançamento": string;
  Histórico: string;
  Descrição?: string;
  Valor: string;
  Saldo?: string;
};

function parseBrDate(value: string): string {
  const [day, month, year] = value.trim().split("/");

  if (!day || !month || !year) {
    throw new Error("Data inválida no CSV.");
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseBrlNumber(value: string): number {
  const parsed = Number(value.trim().replace(/\./g, "").replace(",", "."));

  if (!Number.isFinite(parsed)) {
    throw new Error("Valor inválido no CSV.");
  }

  return parsed;
}

function createTransactionHash(input: {
  date: string;
  name: string;
  amount: number;
  bank: Bank;
}): string {
  const text = `${input.date}|${input.name}|${input.amount.toFixed(2)}|${input.bank}`;
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }

  return `tx_${(hash >>> 0).toString(16)}`;
}

function findDuplicates(transactions: Transaction[]): Transaction[] {
  const counts = new Map<string, number>();

  for (const transaction of transactions) {
    counts.set(transaction.id, (counts.get(transaction.id) ?? 0) + 1);
  }

  return transactions.filter((transaction) => (counts.get(transaction.id) ?? 0) > 1);
}

export async function parseCsvFile(file: File, bank: Bank): Promise<ParsedCsvResult> {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error("Selecione um arquivo CSV válido.");
  }

  const fileContent = await file.text();
  const lines = fileContent.split(/\r?\n/);
  const headerLineIndex = lines.findIndex((line) => line.includes("Data Lançamento"));

  if (headerLineIndex < 0) {
    throw new Error("Não encontramos a linha de cabeçalho do CSV. Verifique se o arquivo é compatível.");
  }

  const parsed = Papa.parse<InterCsvRow>(lines.slice(headerLineIndex).join("\n"), {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error("Não foi possível interpretar o CSV. Confira o arquivo e tente novamente.");
  }

  const transactions = parsed.data.map((row) => {
    const history = String(row.Histórico ?? "").trim();
    const description = String(row.Descrição ?? "").trim();
    const name = description ? `${history} - ${description}` : history;
    const rawAmount = parseBrlNumber(String(row.Valor ?? ""));
    const amount = Math.abs(rawAmount);
    const date = parseBrDate(String(row["Data Lançamento"] ?? ""));
    const type = rawAmount >= 0 ? "Entrada" : "Saída";
    const id = createTransactionHash({ date, name, amount: rawAmount, bank });

    return {
      id,
      date,
      name,
      type,
      amount,
      expectedAmount: null,
      realizedAmount: amount,
      realized: true,
      bank,
      category: "Itens Básicos",
      debt: null,
      investment: null,
      raw: row,
    } satisfies Transaction;
  });

  const duplicates = findDuplicates(transactions);

  return {
    transactions,
    duplicates,
    warnings: duplicates.length
      ? [`Encontramos ${duplicates.length} lançamento(s) duplicado(s) dentro do CSV.`]
      : [],
  };
}
