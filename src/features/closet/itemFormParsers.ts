export const trimmedNameOrNull = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
};

export const parsePriceInput = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  if (parsed < 0) return null;
  return parsed;
};

export const normaliseCurrencyInput = (raw: string): string | null => {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length !== 3) return null;
  if (!/^[A-Z]{3}$/.test(trimmed)) return null;
  return trimmed;
};

// Validates loosely — Postgres rejects malformed dates with a clear error;
// we just want to avoid sending obvious garbage like "tomorrow".
export const parsePurchasedOnInput = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
};
