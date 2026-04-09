import { formatCurrency } from '../lib/formatCurrency';
import { NUMBER_SCALING_FACTOR, ENABLE_SCALED_DISPLAY } from '../config/appConfig';

/**
 * Converts a backend actual monetary value to a display value.
 * Example: 100000 -> 1000
 */
export function scaleAmount(value: number): number {
  if (!ENABLE_SCALED_DISPLAY) return value;
  // Use division for scaling down
  return value / NUMBER_SCALING_FACTOR;
}

/**
 * Converts a display monetary value back to the backend actual value.
 * Example: 1000 -> 100000
 */
export function unscaleAmount(value: number): number {
  if (!ENABLE_SCALED_DISPLAY) return value;
  // Use Math.round to prevent floating point precision issues (e.g., 0.1 * 100 -> 10.000000000000002)
  return Math.round(value * NUMBER_SCALING_FACTOR);
}

/**
 * Formats a backend actual monetary value as a scaled currency string.
 * Steps:
 * a. scaleAmount(value)
 * b. Format in Indian number format
 * c. Always show 2 decimal places
 * Example: 1500000 -> "₹15,000.00"
 */
export function formatScaledCurrency(
  value: number | null | undefined,
  options?: { showSymbol?: boolean; decimals?: number }
): string {
  const num = value ?? 0;
  const scaled = scaleAmount(num);
  return formatCurrency(scaled, options);
}

/**
 * Parses user input (scaled format) into actual backend value.
 * Converts "1,000.00" -> 100000
 */
export function parseScaledInput(value: string): number {
  if (!value) return 0;
  // Remove formatting parts (commas)
  const parsed = parseFloat(value.replace(/,/g, ''));
  if (isNaN(parsed)) return 0;
  return unscaleAmount(parsed);
}
