/**
 * Formatting utilities for prices, currencies, and numbers.
 * 
 * Provides asset-aware formatting that adjusts decimal places
 * based on price magnitude (e.g., DOGE shows more decimals than BTC).
 */

/**
 * Determine appropriate number of decimal places for a price based on its value.
 * 
 * Strategy:
 * - Prices < $0.01: 6-8 decimals (e.g., DOGE at $0.0015)
 * - Prices $0.01 - $0.10: 5-6 decimals (e.g., DOGE at $0.15)
 * - Prices $0.10 - $1.00: 4-5 decimals (e.g., ADA at $0.50)
 * - Prices $1.00 - $10.00: 3-4 decimals (e.g., XRP at $0.60)
 * - Prices $10.00 - $100.00: 3 decimals
 * - Prices $100.00 - $1,000.00: 2 decimals
 * - Prices >= $1,000.00: 2 decimals (e.g., BTC, ETH)
 * 
 * @param price The price value
 * @param minDecimals Minimum decimal places (default: 2)
 * @param maxDecimals Maximum decimal places (default: 8)
 * @returns Number of decimal places to use for formatting
 */
export function getPriceDecimals(
  price: number,
  minDecimals: number = 2,
  maxDecimals: number = 8
): number {
  const absPrice = Math.abs(price);

  if (absPrice < 0.01) {
    // Very small prices (e.g., < $0.01): use 6-8 decimals
    return Math.min(maxDecimals, 6);
  } else if (absPrice < 0.10) {
    // Small prices (e.g., $0.01 - $0.10): use 5-6 decimals
    return Math.min(maxDecimals, 5);
  } else if (absPrice < 1.00) {
    // Sub-dollar prices (e.g., $0.10 - $1.00): use 4-5 decimals
    return Math.min(maxDecimals, 4);
  } else if (absPrice < 10.00) {
    // Low prices (e.g., $1.00 - $10.00): use 3-4 decimals
    return Math.min(maxDecimals, 3);
  } else if (absPrice < 100.00) {
    // Medium prices (e.g., $10.00 - $100.00): use 3 decimals
    return Math.min(maxDecimals, 3);
  } else {
    // High prices (e.g., >= $100.00): use 2 decimals
    return Math.max(minDecimals, 2);
  }
}

/**
 * Format a price with appropriate decimal places based on its value.
 * 
 * Automatically determines decimal places based on price magnitude,
 * ensuring smaller prices (like DOGE) show more decimals than larger prices (like BTC).
 * 
 * @param price The price to format
 * @param asset Optional asset identifier (e.g., 'BTC/USDT') for asset-specific formatting
 * @param currency Currency code (default: "USD")
 * @returns Formatted price string (e.g., "$0.1500" for DOGE, "$60,234.50" for BTC)
 */
export function formatPrice(
  price: number,
  asset?: string,
  currency: string = "USD"
): string {
  const decimals = getPriceDecimals(price);
  
  let symbol = "$";
  if (currency === "EUR") symbol = "€";
  else if (currency === "GBP") symbol = "£";
  else if (currency !== "USD") symbol = `${currency} `;

  // Format with appropriate decimals
  let formatted: string;
  if (price >= 1000) {
    // For large prices, use comma separators
    formatted = Math.abs(price).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    // For smaller prices, use fixed decimals
    formatted = Math.abs(price).toFixed(decimals);
  }

  const sign = price < 0 ? "-" : "";
  return `${sign}${symbol}${formatted}`;
}

/**
 * Format a price without currency symbol (just the number with appropriate decimals).
 * 
 * @param price The price to format
 * @returns Formatted price string (e.g., "0.1500" for DOGE, "60,234.50" for BTC)
 */
export function formatPriceNumber(price: number): string {
  const decimals = getPriceDecimals(price);
  
  if (price >= 1000) {
    return Math.abs(price).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    return Math.abs(price).toFixed(decimals);
  }
}

/**
 * Format a price for compact display (e.g., in tooltips or small spaces).
 * Uses fewer decimals for readability.
 * 
 * @param price The price to format
 * @returns Compact formatted price string
 */
export function formatPriceCompact(price: number): string {
  const absPrice = Math.abs(price);
  const decimals = Math.min(getPriceDecimals(price), 4); // Max 4 decimals for compact
  
  if (absPrice >= 1000) {
    return `$${absPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    return `$${absPrice.toFixed(decimals)}`;
  }
}

