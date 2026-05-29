export function parseBrlNumber(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error("Valor inválido.");
  }

  return parsed;
}
