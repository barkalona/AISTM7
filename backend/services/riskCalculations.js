const RISK_FREE_RATE = 0.02; // 2% risk-free rate, should be configurable

function calculateVaR(returns, confidenceLevel = 0.95) {
  // Sort returns in ascending order
  const sortedReturns = [...returns].sort((a, b) => a - b);
  
  // Find the index for the confidence level
  const index = Math.floor(returns.length * (1 - confidenceLevel));
  
  // Return the VaR at the specified confidence level
  return -sortedReturns[index];
}

function calculateSharpeRatio(returns) {
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const excessReturns = meanReturn - RISK_FREE_RATE;
  
  // Calculate standard deviation
  const variance = returns.reduce((sum, ret) => {
    return sum + Math.pow(ret - meanReturn, 2);
  }, 0) / (returns.length - 1);
  
  const stdDev = Math.sqrt(variance);
  
  return excessReturns / stdDev;
}

function calculateConditionalVaR(returns, confidenceLevel = 0.95) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const varIndex = Math.floor(returns.length * (1 - confidenceLevel));
  
  // Calculate average of returns beyond VaR
  const tailReturns = sortedReturns.slice(0, varIndex);
  const cvar = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
  
  return -cvar;
}

function calculateInformationRatio(portfolioReturns, benchmarkReturns) {
  const excessReturns = portfolioReturns.map((ret, i) => ret - benchmarkReturns[i]);
  const meanExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
  
  // Calculate tracking error (standard deviation of excess returns)
  const variance = excessReturns.reduce((sum, ret) => {
    return sum + Math.pow(ret - meanExcessReturn, 2);
  }, 0) / (excessReturns.length - 1);
  
  const trackingError = Math.sqrt(variance);
  
  return meanExcessReturn / trackingError;
}

function calculateSortino(returns, targetReturn = 0) {
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const excessReturns = meanReturn - targetReturn;
  
  // Calculate downside deviation (only negative returns)
  const downsideReturns = returns.filter(ret => ret < targetReturn);
  const downsideVariance = downsideReturns.reduce((sum, ret) => {
    return sum + Math.pow(ret - targetReturn, 2);
  }, 0) / (downsideReturns.length - 1);
  
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  return excessReturns / downsideDeviation;
}

function calculateMaxDrawdown(returns) {
  let peak = -Infinity;
  let maxDrawdown = 0;
  let value = 1;
  
  returns.forEach(ret => {
    value *= (1 + ret);
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  });
  
  return -maxDrawdown;
}

function calculateTreynorRatio(returns, marketReturns, beta) {
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const excessReturn = meanReturn - RISK_FREE_RATE;
  
  return excessReturn / beta;
}

function calculateJensenAlpha(returns, marketReturns, beta) {
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const meanMarketReturn = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
  
  return meanReturn - (RISK_FREE_RATE + beta * (meanMarketReturn - RISK_FREE_RATE));
}

function calculateOmega(returns, threshold = 0) {
  const gains = returns.filter(ret => ret > threshold);
  const losses = returns.filter(ret => ret <= threshold);
  
  const expectedGains = gains.reduce((sum, ret) => sum + (ret - threshold), 0) / returns.length;
  const expectedLosses = Math.abs(losses.reduce((sum, ret) => sum + (ret - threshold), 0)) / returns.length;
  
  return expectedGains / expectedLosses;
}

function calculateKappa(returns, threshold = 0, n = 3) {
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const excessReturn = meanReturn - threshold;
  
  // Calculate lower partial moment
  const lpm = returns.reduce((sum, ret) => {
    const downside = Math.max(0, threshold - ret);
    return sum + Math.pow(downside, n);
  }, 0) / returns.length;
  
  return excessReturn / Math.pow(lpm, 1/n);
}

module.exports = {
  calculateVaR,
  calculateSharpeRatio,
  calculateConditionalVaR,
  calculateInformationRatio,
  calculateSortino,
  calculateMaxDrawdown,
  calculateTreynorRatio,
  calculateJensenAlpha,
  calculateOmega,
  calculateKappa
};