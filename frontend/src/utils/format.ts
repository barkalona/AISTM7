/**
 * Truncates a Solana address for display
 * @param address Full Solana address
 * @param startLength Number of characters to show at start (default: 4)
 * @param endLength Number of characters to show at end (default: 4)
 * @returns Truncated address with ellipsis
 */
export const truncateAddress = (
    address: string,
    startLength: number = 4,
    endLength: number = 4
): string => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Formats a number as currency
 * @param amount Number to format
 * @param currency Currency code (default: 'USD')
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

/**
 * Formats a number as a percentage
 * @param value Number to format as percentage
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
    value: number,
    decimals: number = 2
): string => {
    return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formats a large number with appropriate suffix (K, M, B)
 * @param value Number to format
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted number string with suffix
 */
export const formatLargeNumber = (
    value: number,
    decimals: number = 1
): string => {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    let suffixIndex = 0;
    let scaledValue = value;

    while (scaledValue >= 1000 && suffixIndex < suffixes.length - 1) {
        scaledValue /= 1000;
        suffixIndex++;
    }

    return `${scaledValue.toFixed(decimals)}${suffixes[suffixIndex]}`;
};

/**
 * Formats a date for display
 * @param date Date to format
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (
    date: Date | string | number,
    locale: string = 'en-US'
): string => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Formats a duration in milliseconds to a human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
};