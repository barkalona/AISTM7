import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

interface OHLC {
  high: number;
  low: number;
  close: number;
}

const calculateStochastic = (
  data: OHLC[],
  period: number,
  smoothK: number,
  smoothD: number
): { k: number[]; d: number[] } => {
  const kValues: number[] = [];
  const dValues: number[] = [];

  // Calculate %K for each period
  for (let i = period - 1; i < data.length; i++) {
    const periodData = data.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...periodData.map(d => d.high));
    const lowestLow = Math.min(...periodData.map(d => d.low));
    const currentClose = data[i].close;

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }

  // Smooth %K values
  const smoothedK: number[] = [];
  for (let i = smoothK - 1; i < kValues.length; i++) {
    const sum = kValues.slice(i - smoothK + 1, i + 1).reduce((a, b) => a + b, 0);
    smoothedK.push(sum / smoothK);
  }

  // Calculate %D (SMA of smoothed %K)
  for (let i = smoothD - 1; i < smoothedK.length; i++) {
    const sum = smoothedK.slice(i - smoothD + 1, i + 1).reduce((a, b) => a + b, 0);
    dValues.push(sum / smoothD);
  }

  // Pad arrays with NaN to match input length
  const padding = Array(period + smoothK + smoothD - 3).fill(NaN);
  const k = [...padding, ...dValues];
  const d = [...padding, ...dValues];

  return { k, d };
};

const findSignals = (
  data: PriceData[],
  k: number[],
  d: number[],
  overbought: number,
  oversold: number
): { x: number; y: number; label: string }[] => {
  const signals: { x: number; y: number; label: string }[] = [];

  for (let i = 1; i < data.length; i++) {
    const prevK = k[i - 1];
    const currK = k[i];
    const prevD = d[i - 1];
    const currD = d[i];

    if (!isNaN(currK) && !isNaN(currD)) {
      // Oversold conditions
      if (currK <= oversold && currD <= oversold) {
        if (currK > currD && prevK <= prevD) {
          signals.push({
            x: data[i].timestamp,
            y: data[i].close,
            label: 'Bullish Signal',
          });
        }
      }
      // Overbought conditions
      else if (currK >= overbought && currD >= overbought) {
        if (currK < currD && prevK >= prevD) {
          signals.push({
            x: data[i].timestamp,
            y: data[i].close,
            label: 'Bearish Signal',
          });
        }
      }
    }
  }

  return signals;
};

export const StochasticIndicator: TechnicalIndicator = {
  name: 'Stochastic Oscillator',
  description: 'Momentum indicator comparing closing price to price range over a specific period',
  defaultConfig: {
    enabled: true,
    params: {
      period: 14,
      smoothK: 3,
      smoothD: 3,
      overbought: 80,
      oversold: 20,
    },
    style: {
      color: '#9C27B0',
      lineWidth: 2,
      opacity: 1,
    },
  },
  params: [
    {
      name: 'period',
      type: 'number',
      default: 14,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: 'smoothK',
      type: 'number',
      default: 3,
      min: 1,
      max: 10,
      step: 1,
    },
    {
      name: 'smoothD',
      type: 'number',
      default: 3,
      min: 1,
      max: 10,
      step: 1,
    },
    {
      name: 'overbought',
      type: 'number',
      default: 80,
      min: 50,
      max: 100,
      step: 1,
    },
    {
      name: 'oversold',
      type: 'number',
      default: 20,
      min: 0,
      max: 50,
      step: 1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const ohlcData = data.map(d => ({
      high: d.high || d.close,
      low: d.low || d.close,
      close: d.close,
    }));

    const period = config.params.period as number;
    const smoothK = config.params.smoothK as number;
    const smoothD = config.params.smoothD as number;
    const overbought = config.params.overbought as number;
    const oversold = config.params.oversold as number;

    const { k, d } = calculateStochastic(ohlcData, period, smoothK, smoothD);
    const signals = findSignals(data, k, d, overbought, oversold);

    return {
      values: k,
      lines: {
        k,
        d,
        overbought: Array(k.length).fill(overbought),
        oversold: Array(k.length).fill(oversold),
      },
      points: signals,
    };
  },
};