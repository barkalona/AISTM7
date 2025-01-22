/**
 * Format currency values with proper symbol and decimal places
 * @param {number} value - The currency value to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format risk level with color coding and description
 * @param {number} level - Risk level value (0-100)
 * @returns {string} HTML formatted risk level string
 */
function formatRiskLevel(level) {
  let color;
  let description;

  if (level <= 20) {
    color = '#28a745'; // green
    description = 'Very Low';
  } else if (level <= 40) {
    color = '#7cb342'; // light green
    description = 'Low';
  } else if (level <= 60) {
    color = '#ffc107'; // yellow
    description = 'Moderate';
  } else if (level <= 80) {
    color = '#ff9800'; // orange
    description = 'High';
  } else {
    color = '#dc3545'; // red
    description = 'Very High';
  }

  return `<span style="color: ${color};">${description} (${level}%)</span>`;
}

/**
 * Format percentage values with proper sign and decimal places
 * @param {number} value - The percentage value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value, decimals = 2) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date and time according to user's locale
 * @param {Date} date - The date to format
 * @param {string} locale - The locale to use (default: en-US)
 * @returns {string} Formatted date string
 */
function formatDateTime(date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
function formatLargeNumber(value) {
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  let suffixIndex = 0;
  let formattedValue = value;

  while (formattedValue >= 1000 && suffixIndex < suffixes.length - 1) {
    formattedValue /= 1000;
    suffixIndex++;
  }

  return `${formattedValue.toFixed(1)}${suffixes[suffixIndex]}`;
}

module.exports = {
  formatCurrency,
  formatRiskLevel,
  formatPercentage,
  formatDateTime,
  formatLargeNumber,
};