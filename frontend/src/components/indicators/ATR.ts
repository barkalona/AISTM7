import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

const calculateTR = (
  current: PriceData,
  previous: PriceData | null
): number => {
  if (!previous) {
    return current.high! - current.low!;
  }

  const highLow = current.high! - current.low!;
  const highClose = Math.abs(current.high! - previous.close);
  const lowClose = Math.abs(current.low! - previous.close);

  return Math.max(highLow, highClose, lowClose);
};

const calculateATR = (data: PriceData[], period: number): number[] => {
  const trValues: number[] = [];
  const atrValues: number[] = [];

  // Calculate True Range values
  for (let i = 0; i < data.length; i++) {
    const tr = calculateTR(data[i], i > 0 ? data[i - 1] : null);
    trValues.push(tr);
  }

  // Calculate initial ATR (simple average of first 'period' TR values)
  const initialATR = trValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atrValues.push(initialATR);

  // Calculate subsequent ATR values using Wilder's smoothing
  for (let i = period; i < data.length; i++) {
    const previousATR = atrValues[atrValues.length - 1];
    const currentATR = (previousATR * (period - 1) + trValues[i]) / period;
    atrValues.push(currentATR);
  }

  // Pad the beginning with NaN values
  const padding = Array(period - 1).fill(NaN);
  return [...padding, ...atrValues];
};

const findVolatilitySpikes = (
  data: PriceData[],
  atr: number[],
  threshold: number
): { x: number; y: number; label: string }[] => {
  const spikes: { x: number; y: number; label: string }[] = [];
  const movingAvg = new Array(atr.length).fill(0);

  // Calculate 5-period moving average of ATR
  for (let i = 4; i < atr.length; i++) {
    const sum = atr.slice(i - 4, i + 1).reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    movingAvg[i] = sum / 5;
  }

  // Find spikes where ATR exceeds moving average by threshold
  for (let i = 5; i < atr.length; i++) {
    if (!isNaN(atr[i]) && !isNaN(movingAvg[i])) {
      const ratio = atr[i] / movingAvg[i];
      if (ratio > threshold) {
        spikes.push({
          x: data[i].timestamp,
          y: data[i].close,
          label: `Volatility Spike (${(ratio - 1) * 100}%)`,
        });
      }
    }
  }

  return spikes;
};

export const ATRIndicator: TechnicalIndicator = {
  name: 'Average True Range',
  description: 'Measures market volatility by decomposing the entire range of an asset price',
  defaultConfig: {
    enabled: true,
    params: {
      period: 14,
      threshold: 1.5, // Spike detection threshold (150% of moving average)
    },
    style: {
      color: '#FF5722',
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
      name: 'threshold',
      type: 'number',
      default: 1.5,
      min: 1.1,
      max: 3.0,
      step: 0.1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const period = config.params.period as number;
    const threshold = config.params.threshold as number;

    const atrValues = calculateATR(data, period);
    const spikes = findVolatilitySpikes(data, atrValues, threshold);

    // Calculate percentage change in ATR for trend analysis
    const atrChange = atrValues.map((value, i) => {
      if (i === 0 || isNaN(value) || isNaN(atrValues[i - 1])) return NaN;
      return ((value - atrValues[i - 1]) / atrValues[i - 1]) * 100;
    });

    return {
      values: atrValues,
      lines: {
        atr: atrValues,
        atrChange,
      },
      points: spikes,
    };
  },
};