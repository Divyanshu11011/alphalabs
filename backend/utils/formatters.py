"""
Formatting Utilities.

Purpose:
    Data formatting functions for currency, percentages, dates, etc.

Usage:
    from utils.formatters import format_currency, format_percentage, get_price_decimals
"""
from datetime import datetime
from typing import Optional


def format_currency(amount: float, currency: str = "USD", decimals: int = 2) -> str:
    """
    Format a number as currency.
    
    Args:
        amount: The amount to format
        currency: Currency code (default: "USD")
        decimals: Number of decimal places
        
    Returns:
        Formatted currency string (e.g., "$1,234.56")
    """
    if currency == "USD":
        symbol = "$"
    elif currency == "EUR":
        symbol = "€"
    elif currency == "GBP":
        symbol = "£"
    else:
        symbol = currency + " "
    
    formatted = f"{abs(amount):,.{decimals}f}"
    sign = "-" if amount < 0 else ""
    
    return f"{sign}{symbol}{formatted}"


def format_percentage(value: float, decimals: int = 2, include_sign: bool = True) -> str:
    """
    Format a number as percentage.
    
    Args:
        value: The value to format (0.1 = 10%)
        decimals: Number of decimal places
        include_sign: Whether to include + sign for positive values
        
    Returns:
        Formatted percentage string (e.g., "+10.50%")
    """
    percentage = value * 100
    formatted = f"{abs(percentage):.{decimals}f}%"
    
    if percentage > 0 and include_sign:
        return f"+{formatted}"
    elif percentage < 0:
        return f"-{formatted}"
    else:
        return formatted


def format_datetime(dt: datetime, format_str: Optional[str] = None) -> str:
    """
    Format a datetime object.
    
    Args:
        dt: The datetime to format
        format_str: Custom format string (default: ISO format)
        
    Returns:
        Formatted datetime string
    """
    if format_str:
        return dt.strftime(format_str)
    return dt.isoformat()


def format_date(dt: datetime) -> str:
    """
    Format a datetime as date only.
    
    Args:
        dt: The datetime to format
        
    Returns:
        Formatted date string (e.g., "2024-03-15")
    """
    return dt.strftime("%Y-%m-%d")


def format_time(dt: datetime) -> str:
    """
    Format a datetime as time only.
    
    Args:
        dt: The datetime to format
        
    Returns:
        Formatted time string (e.g., "14:30:00")
    """
    return dt.strftime("%H:%M:%S")


def format_duration(seconds: int) -> str:
    """
    Format duration in seconds to human-readable string.
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        Formatted duration (e.g., "2h 30m 15s")
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if secs > 0 or not parts:
        parts.append(f"{secs}s")
    
    return " ".join(parts)


def format_number(value: float, decimals: int = 2, compact: bool = False) -> str:
    """
    Format a number with optional compact notation.
    
    Args:
        value: The number to format
        decimals: Number of decimal places
        compact: Use compact notation (K, M, B)
        
    Returns:
        Formatted number string
    """
    if not compact:
        return f"{value:,.{decimals}f}"
    
    abs_value = abs(value)
    sign = "-" if value < 0 else ""
    
    if abs_value >= 1_000_000_000:
        return f"{sign}{abs_value / 1_000_000_000:.{decimals}f}B"
    elif abs_value >= 1_000_000:
        return f"{sign}{abs_value / 1_000_000:.{decimals}f}M"
    elif abs_value >= 1_000:
        return f"{sign}{abs_value / 1_000:.{decimals}f}K"
    else:
        return f"{sign}{abs_value:.{decimals}f}"


def truncate_string(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate a string to maximum length.
    
    Args:
        text: The text to truncate
        max_length: Maximum length
        suffix: Suffix to add when truncated
        
    Returns:
        Truncated string
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def get_price_decimals(price: float, min_decimals: int = 2, max_decimals: int = 8) -> int:
    """
    Determine appropriate number of decimal places for a price based on its value.
    
    Strategy:
    - Prices < $0.01: 6-8 decimals (e.g., DOGE at $0.0015)
    - Prices $0.01 - $0.10: 5-6 decimals (e.g., DOGE at $0.15)
    - Prices $0.10 - $1.00: 4-5 decimals (e.g., ADA at $0.50)
    - Prices $1.00 - $10.00: 3-4 decimals (e.g., XRP at $0.60)
    - Prices $10.00 - $100.00: 3 decimals
    - Prices $100.00 - $1,000.00: 2 decimals
    - Prices >= $1,000.00: 2 decimals (e.g., BTC, ETH)
    
    Args:
        price: The price value
        min_decimals: Minimum decimal places (default: 2)
        max_decimals: Maximum decimal places (default: 8)
        
    Returns:
        Number of decimal places to use for formatting
    """
    abs_price = abs(price)
    
    if abs_price < 0.01:
        # Very small prices (e.g., < $0.01): use 6-8 decimals
        return min(max_decimals, 6)
    elif abs_price < 0.10:
        # Small prices (e.g., $0.01 - $0.10): use 5-6 decimals
        return min(max_decimals, 5)
    elif abs_price < 1.00:
        # Sub-dollar prices (e.g., $0.10 - $1.00): use 4-5 decimals
        return min(max_decimals, 4)
    elif abs_price < 10.00:
        # Low prices (e.g., $1.00 - $10.00): use 3-4 decimals
        return min(max_decimals, 3)
    elif abs_price < 100.00:
        # Medium prices (e.g., $10.00 - $100.00): use 3 decimals
        return min(max_decimals, 3)
    else:
        # High prices (e.g., >= $100.00): use 2 decimals
        return max(min_decimals, 2)


def format_price(price: float, asset: Optional[str] = None, currency: str = "USD") -> str:
    """
    Format a price with appropriate decimal places based on its value.
    
    Automatically determines decimal places based on price magnitude,
    ensuring smaller prices (like DOGE) show more decimals than larger prices (like BTC).
    
    Args:
        price: The price to format
        asset: Optional asset identifier (e.g., 'BTC/USDT') for asset-specific formatting
        currency: Currency code (default: "USD")
        
    Returns:
        Formatted price string (e.g., "$0.1500" for DOGE, "$60,234.50" for BTC)
    """
    decimals = get_price_decimals(price)
    
    if currency == "USD":
        symbol = "$"
    elif currency == "EUR":
        symbol = "€"
    elif currency == "GBP":
        symbol = "£"
    else:
        symbol = currency + " "
    
    # Format with appropriate decimals
    if price >= 1000:
        # For large prices, use comma separators
        formatted = f"{abs(price):,.{decimals}f}"
    else:
        # For smaller prices, no comma separators needed
        formatted = f"{abs(price):.{decimals}f}"
    
    sign = "-" if price < 0 else ""
    return f"{sign}{symbol}{formatted}"
