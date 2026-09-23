// Formatting helpers for the search UI. Pure functions only — no Raycast imports here
// so they stay easy to unit test.

const MISSING = "—";

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Renders a value with `sigDigits` significant digits as a plain (non-exponential)
 * decimal string. Used for sub-$1 prices, where `toFixed`/compact notation would
 * either round to "$0.00" or fall back to scientific notation.
 */
function toPlainSignificant(value: number, sigDigits: number): string {
  if (value === 0) return "0";
  const exponent = Math.floor(Math.log10(value));
  const decimals = Math.max(0, sigDigits - 1 - exponent);
  return value.toFixed(Math.min(decimals, 100));
}

/**
 * Formats a USD amount for display. Uses compact notation for large values
 * (e.g. "$42.1M", "$4.7B", "$310K") and full precision (3 significant digits) for
 * sub-$1 prices (e.g. "$0.0000112"), since compact/2-decimal notation would round
 * those to "$0.00". Returns "—" for undefined or NaN.
 */
export function formatUsd(n?: number): string {
  if (n === undefined || Number.isNaN(n)) return MISSING;
  if (n === 0) return "$0.00";

  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 1000) {
    return compactUsdFormatter.format(n);
  }
  if (abs >= 1) {
    return `${sign}$${abs.toFixed(2)}`;
  }
  return `${sign}$${toPlainSignificant(abs, 3)}`;
}

/**
 * Formats a fractional 24h change (0.04 means +4 %) as a signed percentage string,
 * e.g. "+4.0%" or "-8.2%". Returns "—" for undefined or NaN.
 */
export function formatPercent(fraction?: number): string {
  if (fraction === undefined || Number.isNaN(fraction)) return MISSING;
  const pct = fraction * 100;
  const sign = pct < 0 ? "-" : "+";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

/**
 * Formats a contract address for display, e.g. "0x6982…1933". Short strings are
 * returned unchanged. Returns "—" for an empty/undefined address.
 */
export function formatAddress(a?: string): string {
  if (!a) return MISSING;
  if (a.length <= 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
