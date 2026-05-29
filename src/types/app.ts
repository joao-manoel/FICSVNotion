export type Bank = string;
export type TransactionType = "Entrada" | "Saída";
export type Category = string;

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type Transaction = {
  id: string;
  date: string;
  name: string;
  type: TransactionType;
  amount: number;
  expectedAmount: number | null;
  realizedAmount: number;
  realized: boolean;
  bank: Bank;
  category: Category;
  debt: string | null;
  investment: string | null;
  raw: Record<string, unknown>;
};

export type ParsedCsvResult = {
  transactions: Transaction[];
  duplicates: Transaction[];
  warnings: string[];
};

export type NotionProperties = {
  realized: string;
  date: string;
  name: string;
  type: string;
  amount: string;
  bank: string;
  category: string;
  debt: string;
  investment: string;
  expectedAmount: string;
  realizedAmount: string;
};

export type PartialSettings = {
  notionToken?: string;
  notionDatabaseId?: string;
  notionProperties: NotionProperties;
};

export type MaskedSettings = {
  notionDatabaseId: string;
  notionProperties: NotionProperties;
  notionTokenMasked: string;
  hasNotionToken: boolean;
};

export type NotionDatabaseOption = {
  id: string;
  title: string;
  object: "data_source" | "database";
};

export type NotionConnectionResult = {
  databaseTitle: string;
};

export type ImportResult = {
  imported: number;
  failed: number;
};

export type NotionPropertySummary = {
  key: keyof NotionProperties;
  name: string;
  type: string | null;
  relatedDataSourceId?: string;
};

export type NotionPropertiesSummary = {
  properties: NotionPropertySummary[];
};
