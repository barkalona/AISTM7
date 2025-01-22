import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';

export interface PriceData {
  timestamp: number;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

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

const calculateWMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const weights = Array.from({ length: period }, (_, i) => i + 1);
  const denominator = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j] * weights[period - 1 - j];
    }
    result.push(sum / denominator);
  }

  return result;
};

export const MovingAverageIndicator: TechnicalIndicator = {
  name: 'Moving Average',
  description: 'Calculates various types of moving averages (SMA, EMA, WMA) over a specified period',
  defaultConfig: {
    enabled: true,
    params: {
      period: 20,
      type: 'sma',
    },
    style: {
      color: '#2196F3',
      lineWidth: 2,
      opacity: 1,
    },
  },
  params: [
    {
      name: 'period',
      type: 'number',
      default: 20,
      min: 1,
      max: 200,
      step: 1,
    },
    {
      name: 'type',
      type: 'string',
      default: 'sma',
      options: ['sma', 'ema', 'wma'],
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const prices = data.map(d => d.close);
    const period = config.params.period as number;
    const type = config.params.type as string;

    let values: number[];
    switch (type.toLowerCase()) {
      case 'ema':
        values = calculateEMA(prices, period);
        break;
      case 'wma':
        values = calculateWMA(prices, period);
        break;
      case 'sma':
      default:
        values = calculateSMA(prices, period);
        break;
    }

    return {
      values,
      lines: {
        ma: values,
      },
    };
  },
};