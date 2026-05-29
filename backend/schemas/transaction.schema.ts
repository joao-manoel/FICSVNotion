import { z } from "zod";

export const BankSchema = z.string().min(1);
export const TransactionTypeSchema = z.enum(["Entrada", "Saída"]);
export const CategorySchema = z.string().min(1);

export const TransactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1),
  type: TransactionTypeSchema,
  amount: z.number(),
  expectedAmount: z.number().nullable().default(null),
  realizedAmount: z.number(),
  realized: z.boolean().default(true),
  bank: BankSchema,
  category: CategorySchema.default("Itens Básicos"),
  debt: z.string().nullable().default(null),
  investment: z.string().nullable().default(null),
  raw: z.record(z.string(), z.unknown()),
});

export const TransactionsSchema = z.array(TransactionSchema);

export type Bank = z.infer<typeof BankSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
