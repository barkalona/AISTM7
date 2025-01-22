import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

const calculateStandardDeviation = (data: number[], mean: number): number => {
  const squareDiffs = data.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
  return Math.sqrt(avgSquareDiff);
};

const calculateSMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
};

const calculateBollingerBands = (
  data: number[],
  period: number,
  stdDev: number
): { upper: number[]; middle: number[]; lower: number[] } => {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const sd = calculateStandardDeviation(slice, middle[i]);
    const deviation = sd * stdDev;

    upper.push(middle[i] + deviation);
    lower.push(middle[i] - deviation);
  }

  return { upper, middle, lower };
};

const findBandCrossovers = (
  data: PriceData[],
  upper: number[],
  lower: number[]
): { x: number; y: number; label: string }[] => {
  const crossovers: { x: number; y: number; label: string }[] = [];

  for (let i = 1; i < data.length; i++) {
    const price = data[i].close;
    const prevPrice = data[i - 1].close;

    // Upper band crossover
    if (prevPrice <= upper[i - 1] && price > upper[i]) {
      crossovers.push({
        x: data[i].timestamp,
        y: price,
        label: 'Upper Crossover',
      });
    }
    // Lower band crossover
    else if (prevPrice >= lower[i - 1] && price < lower[i]) {
      crossovers.push({
        x: data[i].timestamp,
        y: price,
        label: 'Lower Crossover',
      });
    }
  }

  return crossovers;
};

export const BollingerBandsIndicator: TechnicalIndicator = {
  name: 'Bollinger Bands',
  description: 'Volatility bands that are standard deviations away from a simple moving average',
  defaultConfig: {
    enabled: true,
    params: {
      period: 20,
      stdDev: 2,
    },
    style: {
      color: '#4CAF50',
      lineWidth: 2,
      opacity: 0.8,
    },
  },
  params: [
    {
      name: 'period',
      type: 'number',
      default: 20,
      min: 5,
      max: 100,
      step: 1,
    },
    {
      name: 'stdDev',
      type: 'number',
      default: 2,
      min: 0.5,
      max: 5,
      step: 0.1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const prices = data.map(d => d.close);
    const period = config.params.period as number;
    const stdDev = config.params.stdDev as number;

    const { upper, middle, lower } = calculateBollingerBands(prices, period, stdDev);
    const crossovers = findBandCrossovers(data, upper, lower);

    // Calculate bandwidth and %B for additional analysis
    const bandwidth = upper.map((u, i) => 
      isNaN(u) ? NaN : ((u - lower[i]) / middle[i]) * 100
    );

    const percentB = prices.map((price, i) => 
      isNaN(upper[i]) ? NaN : ((price - lower[i]) / (upper[i] - lower[i])) * 100
    );

    return {
      values: middle, // Main indicator value is the middle band
      bands: {
        upper,
        middle,
        lower,
      },
      lines: {
        bandwidth,
        percentB,
      },
      points: crossovers,
    };
  },
};