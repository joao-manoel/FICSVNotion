import type {
  ImportResult,
  ApiResult,
  MaskedSettings,
  NotionConnectionResult,
  NotionDatabaseOption,
  NotionPropertiesSummary,
  PartialSettings,
  Transaction,
} from "../types/app";

const defaultProperties = {
  realized: "Realizado",
  date: "Data",
  name: "Nome",
  type: "Tipo",
  amount: "Valor",
  bank: "Banco",
  category: "Categoria",
  debt: "Dívida",
  investment: "Investimento",
  expectedAmount: "Valor Previsto",
  realizedAmount: "Valor Realizado",
};

const storageKey = "ficsvnotion.settings";

function maskToken(token: string): string {
  if (!token) return "";
  if (token.length <= 8) return "********";
  return `${token.slice(0, 4)}********${token.slice(-4)}`;
}

function readSettings(): PartialSettings {
  if (typeof window === "undefined") {
    return {
      notionToken: "",
      notionDatabaseId: "",
      notionProperties: defaultProperties,
    };
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed: Partial<PartialSettings> = stored ? (JSON.parse(stored) as PartialSettings) : {};

    return {
      notionToken: parsed.notionToken ?? "",
      notionDatabaseId: parsed.notionDatabaseId ?? "",
      notionProperties: {
        ...defaultProperties,
        ...parsed.notionProperties,
      },
    };
  } catch {
    return {
      notionToken: "",
      notionDatabaseId: "",
      notionProperties: defaultProperties,
    };
  }
}

function writeSettings(settings: PartialSettings): MaskedSettings {
  const current = readSettings();
  const next: PartialSettings = {
    notionToken: settings.notionToken?.trim() || current.notionToken,
    notionDatabaseId: settings.notionDatabaseId?.trim() ?? "",
    notionProperties: {
      ...defaultProperties,
      ...settings.notionProperties,
    },
  };

  window.localStorage.setItem(storageKey, JSON.stringify(next));

  return {
    notionDatabaseId: next.notionDatabaseId ?? "",
    notionProperties: next.notionProperties,
    notionTokenMasked: maskToken(next.notionToken ?? ""),
    hasNotionToken: Boolean(next.notionToken),
  };
}

function getMaskedSettings(): MaskedSettings {
  const settings = readSettings();

  return {
    notionDatabaseId: settings.notionDatabaseId ?? "",
    notionProperties: settings.notionProperties,
    notionTokenMasked: maskToken(settings.notionToken ?? ""),
    hasNotionToken: Boolean(settings.notionToken),
  };
}

async function request<T>(path: string, body?: Record<string, unknown>): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      settings: readSettings(),
      ...body,
    }),
  });

  return response.json() as Promise<ApiResult<T>>;
}

export const apiClient = {
  async saveSettings(settings: PartialSettings): Promise<ApiResult<MaskedSettings>> {
    return {
      ok: true,
      data: writeSettings(settings),
    };
  },
  async getMaskedSettings(): Promise<ApiResult<MaskedSettings>> {
    return {
      ok: true,
      data: getMaskedSettings(),
    };
  },
  testNotionConnection() {
    return request<NotionConnectionResult>("/api/notion/test-connection");
  },
  listNotionDatabases() {
    return request<NotionDatabaseOption[]>("/api/notion/databases");
  },
  listNotionPropertyOptions() {
    return request<{
      categoryOptions: string[];
      bankOptions: string[];
      investmentOptions: string[];
    }>("/api/notion/property-options");
  },
  getNotionPropertiesSummary() {
    return request<NotionPropertiesSummary>("/api/notion/properties-summary");
  },
  importTransactions(transactions: Transaction[]) {
    return request<ImportResult>("/api/notion/import-transactions", { transactions });
  },
};
