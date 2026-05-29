export function parseBrDate(value: string): string {
  const [day, month, year] = value.trim().split("/");

  if (!day || !month || !year) {
    throw new Error("Data inválida.");
  }

  const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
  ) {
    throw new Error("Data inválida.");
  }

  return isoDate;
}
