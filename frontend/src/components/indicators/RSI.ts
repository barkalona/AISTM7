import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

const calculateRSI = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate initial gains and losses
  for (let i = 1; i < data.length; i++) {
    const difference = data[i] - data[i - 1];
    gains.push(Math.max(difference, 0));
    losses.push(Math.max(-difference, 0));
  }

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // First RSI value
  result.push(100 - (100 / (1 + avgGain / avgLoss)));

  // Calculate subsequent values using Wilder's smoothing
  for (let i = period; i < data.length - 1; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }

  // Pad the beginning with NaN values
  const padding = Array(period).fill(NaN);
  return [...padding, ...result];
};

export const RSIIndicator: TechnicalIndicator = {
  name: 'Relative Strength Index',
  description: 'Momentum oscillator that measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions',
  defaultConfig: {
    enabled: true,
    params: {
      period: 14,
      overbought: 70,
      oversold: 30,
    },
    style: {
      color: '#E91E63',
      lineWidth: 2,
      opacity: 1,
    },
  },
  params: [
    {
      name: 'period',
      type: 'number',
      default: 14,
      min: 2,
      max: 50,
      step: 1,
    },
    {
      name: 'overbought',
      type: 'number',
      default: 70,
      min: 50,
      max: 100,
      step: 1,
    },
    {
      name: 'oversold',
      type: 'number',
      default: 30,
      min: 0,
      max: 50,
      step: 1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const prices = data.map(d => d.close);
    const period = config.params.period as number;
    const overbought = config.params.overbought as number;
    const oversold = config.params.oversold as number;

    const rsiValues = calculateRSI(prices, period);

    // Find overbought/oversold points
    const points = rsiValues.map((value, index) => {
      if (isNaN(value)) return null;
      if (value >= overbought) {
        return {
          x: data[index].timestamp,
          y: value,
          label: 'Overbought',
        };
      }
      if (value <= oversold) {
        return {
          x: data[index].timestamp,
          y: value,
          label: 'Oversold',
        };
      }
      return null;
    }).filter((point): point is { x: number; y: number; label: string } => point !== null);

    return {
      values: rsiValues,
      lines: {
        rsi: rsiValues,
        overbought: Array(rsiValues.length).fill(overbought),
        oversold: Array(rsiValues.length).fill(oversold),
      },
      points,
    };
  },
};