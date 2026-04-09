/**
 * Format a number as Indian Rupee currency: ₹1,00,000.00
 * Uses en-IN locale for lakh/crore comma placement.
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: { showSymbol?: boolean; decimals?: number }
): string {
  const num = value ?? 0;
  const decimals = options?.decimals ?? 2;
  const showSymbol = options?.showSymbol !== false;

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `₹${formatted}` : formatted;
}

/** Short form: 1,00,000 → "1.00L", 10,00,000 → "10.00L" */
export function formatCurrencyShort(value: number | null | undefined): string {
  const num = Math.abs(value ?? 0);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(2)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(2)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}
