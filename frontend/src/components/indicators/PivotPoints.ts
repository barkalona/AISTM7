import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

interface PivotLevels {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

type PivotMethod = 'standard' | 'fibonacci' | 'woodie' | 'camarilla';

const calculateStandardPivots = (high: number, low: number, close: number): PivotLevels => {
  const pivot = (high + low + close) / 3;
  const r1 = (2 * pivot) - low;
  const r2 = pivot + (high - low);
  const r3 = high + 2 * (pivot - low);
  const s1 = (2 * pivot) - high;
  const s2 = pivot - (high - low);
  const s3 = low - 2 * (high - pivot);
  
  return { pivot, r1, r2, r3, s1, s2, s3 };
};

const calculateFibonacciPivots = (high: number, low: number, close: number): PivotLevels => {
  const pivot = (high + low + close) / 3;
  const range = high - low;
  
  const r1 = pivot + (range * 0.382);
  const r2 = pivot + (range * 0.618);
  const r3 = pivot + range;
  const s1 = pivot - (range * 0.382);
  const s2 = pivot - (range * 0.618);
  const s3 = pivot - range;
  
  return { pivot, r1, r2, r3, s1, s2, s3 };
};

const calculateWoodiePivots = (high: number, low: number, close: number): PivotLevels => {
  const pivot = (high + low + (2 * close)) / 4;
  const r1 = (2 * pivot) - low;
  const r2 = pivot + (high - low);
  const r3 = high + 2 * (pivot - low);
  const s1 = (2 * pivot) - high;
  const s2 = pivot - (high - low);
  const s3 = low - 2 * (high - pivot);
  
  return { pivot, r1, r2, r3, s1, s2, s3 };
};

const calculateCamarillaPivots = (high: number, low: number, close: number): PivotLevels => {
  const range = high - low;
  const pivot = (high + low + close) / 3;
  
  const r1 = close + (range * 1.1 / 12);
  const r2 = close + (range * 1.1 / 6);
  const r3 = close + (range * 1.1 / 4);
  const s1 = close - (range * 1.1 / 12);
  const s2 = close - (range * 1.1 / 6);
  const s3 = close - (range * 1.1 / 4);
  
  return { pivot, r1, r2, r3, s1, s2, s3 };
};

const calculatePivotPoints = (
  data: PriceData[],
  method: PivotMethod,
  period: 'daily' | 'weekly' | 'monthly'
): PivotLevels[] => {
  const pivots: PivotLevels[] = [];
  
  // Helper to get period's high, low, close
  const getPeriodData = (startIdx: number, endIdx: number) => {
    const slice = data.slice(startIdx, endIdx + 1);
    const high = Math.max(...slice.map(d => d.high || d.close));
    const low = Math.min(...slice.map(d => d.low || d.close));
    const close = slice[slice.length - 1].close;
    return { high, low, close };
  };
  
  // Calculate pivot points based on selected method
  const calculatePivots = (high: number, low: number, close: number) => {
    switch (method) {
      case 'fibonacci':
        return calculateFibonacciPivots(high, low, close);
      case 'woodie':
        return calculateWoodiePivots(high, low, close);
      case 'camarilla':
        return calculateCamarillaPivots(high, low, close);
      case 'standard':
      default:
        return calculateStandardPivots(high, low, close);
    }
  };
  
  // Calculate period boundaries
  let periodSize: number;
  switch (period) {
    case 'weekly':
      periodSize = 5; // Assuming 5 trading days per week
      break;
    case 'monthly':
      periodSize = 21; // Assuming ~21 trading days per month
      break;
    case 'daily':
    default:
      periodSize = 1;
      break;
  }
  
  // Calculate pivot points for each period
  for (let i = 0; i < data.length; i += periodSize) {
    const endIdx = Math.min(i + periodSize - 1, data.length - 1);
    const { high, low, close } = getPeriodData(i, endIdx);
    const levels = calculatePivots(high, low, close);
    
    // Fill the period with the same pivot levels
    for (let j = 0; j < periodSize && i + j < data.length; j++) {
      pivots.push(levels);
    }
  }
  
  return pivots;
};

const findPivotBreakouts = (
  data: PriceData[],
  pivots: PivotLevels[]
): { x: number; y: number; label: string }[] => {
  const breakouts: { x: number; y: number; label: string }[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const price = data[i].close;
    const prevPrice = data[i - 1].close;
    const levels = pivots[i];
    
    // Check for breakouts of each pivot level
    if (price > levels.r1 && prevPrice <= levels.r1) {
      breakouts.push({
        x: data[i].timestamp,
        y: price,
        label: 'R1 Breakout',
      });
    } else if (price > levels.r2 && prevPrice <= levels.r2) {
      breakouts.push({
        x: data[i].timestamp,
        y: price,
        label: 'R2 Breakout',
      });
    } else if (price < levels.s1 && prevPrice >= levels.s1) {
      breakouts.push({
        x: data[i].timestamp,
        y: price,
        label: 'S1 Breakdown',
      });
    } else if (price < levels.s2 && prevPrice >= levels.s2) {
      breakouts.push({
        x: data[i].timestamp,
        y: price,
        label: 'S2 Breakdown',
      });
    }
  }
  
  return breakouts;
};

export const PivotPointsIndicator: TechnicalIndicator = {
  name: 'Pivot Points',
  description: 'Calculates support and resistance levels based on previous period\'s price action',
  defaultConfig: {
    enabled: true,
    params: {
      method: 'standard',
      period: 'daily',
    },
    style: {
      color: '#795548',
      lineWidth: 1,
      opacity: 0.8,
    },
  },
  params: [
    {
      name: 'method',
      type: 'string',
      default: 'standard',
      options: ['standard', 'fibonacci', 'woodie', 'camarilla'],
    },
    {
      name: 'period',
      type: 'string',
      default: 'daily',
      options: ['daily', 'weekly', 'monthly'],
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const method = config.params.method as PivotMethod;
    const period = config.params.period as 'daily' | 'weekly' | 'monthly';
    
    const pivotLevels = calculatePivotPoints(data, method, period);
    const breakouts = findPivotBreakouts(data, pivotLevels);
    
    // Extract individual level arrays for plotting
    const pivots = pivotLevels.map(p => p.pivot);
    const r1 = pivotLevels.map(p => p.r1);
    const r2 = pivotLevels.map(p => p.r2);
    const r3 = pivotLevels.map(p => p.r3);
    const s1 = pivotLevels.map(p => p.s1);
    const s2 = pivotLevels.map(p => p.s2);
    const s3 = pivotLevels.map(p => p.s3);
    
    return {
      values: pivots,
      lines: {
        pivot: pivots,
        r1,
        r2,
        r3,
        s1,
        s2,
        s3,
      },
      points: breakouts,
    };
  },
};