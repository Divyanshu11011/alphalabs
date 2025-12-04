# Price Formatting with Dynamic Decimal Places

## Overview

This document describes the dynamic decimal place formatting system for prices across the AlphaLab platform. The system automatically adjusts the number of decimal places displayed based on the price magnitude, ensuring that:

- **Low-value assets** (like DOGE at ~$0.15) show more decimal places for precision
- **High-value assets** (like BTC at ~$60k) show fewer decimal places for readability

## Strategy

The decimal place determination follows this logic:

| Price Range | Decimal Places | Example Assets |
|------------|----------------|----------------|
| < $0.01 | 6-8 decimals | Very small altcoins |
| $0.01 - $0.10 | 5-6 decimals | DOGE (~$0.15) |
| $0.10 - $1.00 | 4-5 decimals | ADA (~$0.50) |
| $1.00 - $10.00 | 3-4 decimals | XRP (~$0.60) |
| $10.00 - $100.00 | 3 decimals | Medium assets |
| $100.00+ | 2 decimals | BTC, ETH, SOL |

## Backend Usage

### Python (`backend/utils/formatters.py`)

```python
from utils.formatters import format_price, get_price_decimals

# Format a price with automatic decimal detection
price_str = format_price(0.15)  # Returns "$0.1500" (4 decimals for DOGE)
price_str = format_price(60234.50)  # Returns "$60,234.50" (2 decimals for BTC)

# Get decimal places for custom formatting
decimals = get_price_decimals(0.15)  # Returns 4
decimals = get_price_decimals(60234.50)  # Returns 2

# Use in custom formatting
formatted = f"${price:.{decimals}f}"
```

## Frontend Usage

### TypeScript (`frontend/lib/formatters.ts`)

```typescript
import { formatPrice, formatPriceNumber, formatPriceCompact, getPriceDecimals } from "@/lib/formatters";

// Format a price with automatic decimal detection
const priceStr = formatPrice(0.15);  // Returns "$0.1500" (4 decimals for DOGE)
const priceStr = formatPrice(60234.50);  // Returns "$60,234.50" (2 decimals for BTC)

// Format without currency symbol
const priceNum = formatPriceNumber(0.15);  // Returns "0.1500"

// Compact format for tooltips/small spaces
const compact = formatPriceCompact(0.15);  // Returns "$0.15" (fewer decimals)

// Get decimal places for custom formatting
const decimals = getPriceDecimals(0.15);  // Returns 4
const formatted = `$${price.toFixed(decimals)}`;
```

## Migration Guide

### Replacing Hardcoded `.toFixed()` Calls

**Before:**
```typescript
// ❌ Hardcoded decimals - doesn't work well for all assets
${price.toFixed(2)}
${price.toFixed(1)}
```

**After:**
```typescript
// ✅ Dynamic decimals based on price
import { formatPrice } from "@/lib/formatters";
{formatPrice(price)}

// Or for custom formatting:
import { getPriceDecimals } from "@/lib/formatters";
{price.toFixed(getPriceDecimals(price))}
```

### Common Patterns

#### 1. Entry/Exit Prices
```typescript
// Before
<p>${trade.entryPrice.toFixed(2)}</p>

// After
<p>{formatPrice(trade.entryPrice)}</p>
```

#### 2. Stop Loss / Take Profit
```typescript
// Before
<span>${position.stopLoss.toFixed(2)}</span>

// After
<span>{formatPrice(position.stopLoss)}</span>
```

#### 3. Compact Display (Tooltips, Small Spaces)
```typescript
// Before
<span title={`${price.toFixed(2)}`}>{price.toFixed(1)}k</span>

// After
<span title={formatPrice(price)}>{formatPriceCompact(price)}</span>
```

## Examples

### DOGE (Low Value Asset)
- Price: $0.15
- Formatted: `$0.1500` (4 decimals)
- Compact: `$0.15` (2 decimals)

### BTC (High Value Asset)
- Price: $60,234.50
- Formatted: `$60,234.50` (2 decimals)
- Compact: `$60,234.50` (2 decimals)

### ETH (Medium-High Value Asset)
- Price: $3,456.78
- Formatted: `$3,456.78` (2 decimals)
- Compact: `$3,456.78` (2 decimals)

### ADA (Sub-Dollar Asset)
- Price: $0.50
- Formatted: `$0.5000` (4 decimals)
- Compact: `$0.50` (2 decimals)

## Benefits

1. **Precision for Low-Value Assets**: DOGE and similar assets show meaningful price movements
2. **Readability for High-Value Assets**: BTC prices aren't cluttered with unnecessary decimals
3. **Consistency**: Same logic applied across frontend and backend
4. **Flexibility**: Works with any asset without hardcoding per-asset rules
5. **Future-Proof**: Automatically handles new assets with different price ranges

## Implementation Notes

- The system uses **price magnitude** rather than asset names, making it asset-agnostic
- Minimum decimals: 2 (for high-value assets)
- Maximum decimals: 8 (for very small prices)
- Prices >= $1,000 use comma separators for thousands
- Prices < $1,000 don't use comma separators (not needed)

