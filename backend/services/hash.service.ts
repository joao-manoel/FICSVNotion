import crypto from "node:crypto";
import type { Bank } from "../schemas/transaction.schema";

export function createTransactionHash(input: {
  date: string;
  name: string;
  amount: number;
  bank: Bank;
}): string {
  return crypto
    .createHash("sha256")
    .update(`${input.date}|${input.name}|${input.amount.toFixed(2)}|${input.bank}`)
    .digest("hex");
}
