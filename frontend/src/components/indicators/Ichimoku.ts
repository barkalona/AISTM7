import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

interface IchimokuComponents {
  tenkan: number[];
  kijun: number[];
  senkouA: number[];
  senkouB: number[];
  chikou: number[];
}

const calculateMiddlePoint = (data: PriceData[], period: number, index: number): number => {
  if (index < period - 1) return NaN;
  
  const slice = data.slice(index - period + 1, index + 1);
  const highs = slice.map(d => d.high || d.close);
  const lows = slice.map(d => d.low || d.close);
  
  const highest = Math.max(...highs);
  const lowest = Math.min(...lows);
  
  return (highest + lowest) / 2;
};

const calculateIchimoku = (
  data: PriceData[],
  tenkanPeriod: number,
  kijunPeriod: number,
  senkouBPeriod: number,
  displacement: number
): IchimokuComponents => {
  const tenkan: number[] = [];
  const kijun: number[] = [];
  const senkouA: number[] = [];
  const senkouB: number[] = [];
  const chikou: number[] = [];
  
  // Calculate Tenkan-sen (Conversion Line)
  for (let i = 0; i < data.length; i++) {
    tenkan.push(calculateMiddlePoint(data, tenkanPeriod, i));
  }
  
  // Calculate Kijun-sen (Base Line)
  for (let i = 0; i < data.length; i++) {
    kijun.push(calculateMiddlePoint(data, kijunPeriod, i));
  }
  
  // Calculate Senkou Span A (Leading Span A)
  for (let i = 0; i < data.length + displacement; i++) {
    if (i < 1) {
      senkouA.push(NaN);
      continue;
    }
    
    const tenkanValue = i < data.length ? tenkan[i] : tenkan[data.length - 1];
    const kijunValue = i < data.length ? kijun[i] : kijun[data.length - 1];
    
    senkouA.push((tenkanValue + kijunValue) / 2);
  }
  
  // Calculate Senkou Span B (Leading Span B)
  for (let i = 0; i < data.length + displacement; i++) {
    senkouB.push(calculateMiddlePoint(data, senkouBPeriod, i));
  }
  
  // Calculate Chikou Span (Lagging Span)
  for (let i = 0; i < data.length; i++) {
    chikou.push(i >= displacement ? data[i - displacement].close : NaN);
  }
  
  return { tenkan, kijun, senkouA, senkouB, chikou };
};

const findCrossovers = (
  data: PriceData[],
  tenkan: number[],
  kijun: number[]
): { x: number; y: number; label: string }[] => {
  const crossovers: { x: number; y: number; label: string }[] = [];
  
  for (let i = 1; i < data.length; i++) {
    if (isNaN(tenkan[i]) || isNaN(kijun[i])) continue;
    
    // Bullish TK Cross (Tenkan crosses above Kijun)
    if (tenkan[i] > kijun[i] && tenkan[i - 1] <= kijun[i - 1]) {
      crossovers.push({
        x: data[i].timestamp,
        y: data[i].close,
        label: 'TK Cross (Buy)',
      });
    }
    // Bearish TK Cross (Tenkan crosses below Kijun)
    else if (tenkan[i] < kijun[i] && tenkan[i - 1] >= kijun[i - 1]) {
      crossovers.push({
        x: data[i].timestamp,
        y: data[i].close,
        label: 'TK Cross (Sell)',
      });
    }
  }
  
  return crossovers;
};

const findCloudBreakouts = (
  data: PriceData[],
  senkouA: number[],
  senkouB: number[]
): { x: number; y: number; label: string }[] => {
  const breakouts: { x: number; y: number; label: string }[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const price = data[i].close;
    const prevPrice = data[i - 1].close;
    const cloudTop = Math.max(senkouA[i], senkouB[i]);
    const cloudBottom = Math.min(senkouA[i], senkouB[i]);
    
    // Bullish Cloud Breakout
    if (price > cloudTop && prevPrice <= cloudTop) {
      breakouts.push({
        x: data[i].timestamp,
        y: price,
        label: 'Cloud Breakout (Buy)',
      });
    }
    // Bearish Cloud Breakout
    else if (price < cloudBottom && prevPrice >= cloudBottom) {
      breakouts.push({
        x: data[i].timestamp,
        y: price,
        label: 'Cloud Breakout (Sell)',
      });
    }
  }
  
  return breakouts;
};

export const IchimokuIndicator: TechnicalIndicator = {
  name: 'Ichimoku Cloud',
  description: 'Comprehensive indicator showing support/resistance, momentum, and trend direction',
  defaultConfig: {
    enabled: true,
    params: {
      tenkanPeriod: 9,
      kijunPeriod: 26,
      senkouBPeriod: 52,
      displacement: 26,
    },
    style: {
      color: '#00BCD4',
      lineWidth: 1,
      opacity: 0.8,
    },
  },
  params: [
    {
      name: 'tenkanPeriod',
      type: 'number',
      default: 9,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: 'kijunPeriod',
      type: 'number',
      default: 26,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: 'senkouBPeriod',
      type: 'number',
      default: 52,
      min: 1,
      max: 200,
      step: 1,
    },
    {
      name: 'displacement',
      type: 'number',
      default: 26,
      min: 1,
      max: 100,
      step: 1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const tenkanPeriod = config.params.tenkanPeriod as number;
    const kijunPeriod = config.params.kijunPeriod as number;
    const senkouBPeriod = config.params.senkouBPeriod as number;
    const displacement = config.params.displacement as number;
    
    const {
      tenkan,
      kijun,
      senkouA,
      senkouB,
      chikou,
    } = calculateIchimoku(data, tenkanPeriod, kijunPeriod, senkouBPeriod, displacement);
    
    const crossovers = findCrossovers(data, tenkan, kijun);
    const breakouts = findCloudBreakouts(data, senkouA, senkouB);
    
    return {
      values: tenkan, // Use Tenkan-sen as main values
      lines: {
        tenkan,
        kijun,
        senkouA,
        senkouB,
        chikou,
      },
      points: [...crossovers, ...breakouts],
    };
  },
};