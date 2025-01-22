import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

const calculateEMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  let ema = data[0];
  result.push(ema);

  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
};

const calculateMACD = (
  data: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): { macd: number[]; signal: number[]; histogram: number[] } => {
  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);

  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram (MACD line - signal line)
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
};

const findCrossovers = (
  data: PriceData[],
  macd: number[],
  signal: number[]
): { x: number; y: number; label: string }[] => {
  const crossovers: { x: number; y: number; label: string }[] = [];

  for (let i = 1; i < data.length; i++) {
    const prevMACD = macd[i - 1];
    const prevSignal = signal[i - 1];
    const currMACD = macd[i];
    const currSignal = signal[i];

    // Bullish crossover (MACD crosses above signal)
    if (prevMACD <= prevSignal && currMACD > currSignal) {
      crossovers.push({
        x: data[i].timestamp,
        y: data[i].close,
        label: 'Bullish Crossover',
      });
    }
    // Bearish crossover (MACD crosses below signal)
    else if (prevMACD >= prevSignal && currMACD < currSignal) {
      crossovers.push({
        x: data[i].timestamp,
        y: data[i].close,
        label: 'Bearish Crossover',
      });
    }
  }

  return crossovers;
};

const findDivergences = (
  data: PriceData[],
  macd: number[]
): { x: number; y: number; label: string }[] => {
  const divergences: { x: number; y: number; label: string }[] = [];
  const minDistance = 10; // Minimum bars between divergence points
  const maxDistance = 100; // Maximum bars to look back

  for (let i = minDistance; i < data.length; i++) {
    const currentPrice = data[i].close;
    const currentMACD = macd[i];

    // Look for local price and MACD extremes
    for (let j = Math.max(0, i - maxDistance); j < i - minDistance; j++) {
      const previousPrice = data[j].close;
      const previousMACD = macd[j];

      // Bullish divergence (price lower low, MACD higher low)
      if (currentPrice < previousPrice && currentMACD > previousMACD) {
        divergences.push({
          x: data[i].timestamp,
          y: currentPrice,
          label: 'Bullish Divergence',
        });
        break;
      }
      // Bearish divergence (price higher high, MACD lower high)
      else if (currentPrice > previousPrice && currentMACD < previousMACD) {
        divergences.push({
          x: data[i].timestamp,
          y: currentPrice,
          label: 'Bearish Divergence',
        });
        break;
      }
    }
  }

  return divergences;
};

export const MACDIndicator: TechnicalIndicator = {
  name: 'MACD',
  description: 'Moving Average Convergence Divergence shows the relationship between two moving averages of an asset\'s price',
  defaultConfig: {
    enabled: true,
    params: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    },
    style: {
      color: '#FF9800',
      lineWidth: 2,
      opacity: 1,
    },
  },
  params: [
    {
      name: 'fastPeriod',
      type: 'number',
      default: 12,
      min: 2,
      max: 50,
      step: 1,
    },
    {
      name: 'slowPeriod',
      type: 'number',
      default: 26,
      min: 5,
      max: 100,
      step: 1,
    },
    {
      name: 'signalPeriod',
      type: 'number',
      default: 9,
      min: 2,
      max: 50,
      step: 1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const prices = data.map(d => d.close);
    const fastPeriod = config.params.fastPeriod as number;
    const slowPeriod = config.params.slowPeriod as number;
    const signalPeriod = config.params.signalPeriod as number;

    const { macd, signal, histogram } = calculateMACD(
      prices,
      fastPeriod,
      slowPeriod,
      signalPeriod
    );

    const crossovers = findCrossovers(data, macd, signal);
    const divergences = findDivergences(data, macd);

    return {
      values: macd,
      lines: {
        macd,
        signal,
        histogram,
      },
      points: [...crossovers, ...divergences],
    };
  },
};