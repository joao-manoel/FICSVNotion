import { z } from "zod";

export const NotionPropertiesSchema = z.object({
  realized: z.string().min(1).default("Realizado"),
  date: z.string().min(1).default("Data"),
  name: z.string().min(1).default("Nome"),
  type: z.string().min(1).default("Tipo"),
  amount: z.string().min(1).default("Valor"),
  bank: z.string().min(1).default("Banco"),
  category: z.string().min(1).default("Categoria"),
  debt: z.string().min(1).default("Dívida"),
  investment: z.string().min(1).default("Investimento"),
  expectedAmount: z.string().min(1).default("Valor Previsto"),
  realizedAmount: z.string().min(1).default("Valor Realizado"),
});

export const SettingsSchema = z.object({
  notionToken: z.string().min(1),
  notionDatabaseId: z.string().min(1),
  notionProperties: NotionPropertiesSchema.default({
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
  }),
});

export const PartialSettingsSchema = z.object({
  notionToken: z.string().optional().default(""),
  notionDatabaseId: z.string().optional().default(""),
  notionProperties: NotionPropertiesSchema.default({
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
  }),
});

export const MaskedSettingsSchema = PartialSettingsSchema.omit({
  notionToken: true,
}).extend({
  notionTokenMasked: z.string(),
  hasNotionToken: z.boolean(),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type PartialSettings = z.infer<typeof PartialSettingsSchema>;
export type MaskedSettings = z.infer<typeof MaskedSettingsSchema>;
