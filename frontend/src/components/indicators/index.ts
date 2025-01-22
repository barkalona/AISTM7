import { MovingAverageIndicator } from './MovingAverage';
import { RSIIndicator } from './RSI';
import { BollingerBandsIndicator } from './BollingerBands';
import { MACDIndicator } from './MACD';
import { StochasticIndicator } from './Stochastic';
import { ATRIndicator } from './ATR';
import { VolumeProfileIndicator } from './VolumeProfile';
import { FibonacciIndicator } from './Fibonacci';
import { IchimokuIndicator } from './Ichimoku';
import { PivotPointsIndicator } from './PivotPoints';

export interface IndicatorConfig {
  enabled: boolean;
  params: Record<string, number | string>;
  style: {
    color: string;
    lineWidth: number;
    opacity: number;
  };
}

export interface IndicatorResult {
  values: number[];
  lines?: { [key: string]: number[] };
  bands?: { upper: number[]; middle: number[]; lower: number[] };
  points?: { x: number; y: number; label: string }[];
}

export interface TechnicalIndicator {
  name: string;
  calculate: (data: any[], config: IndicatorConfig) => IndicatorResult;
  defaultConfig: IndicatorConfig;
  description: string;
  params: {
    name: string;
    type: 'number' | 'string';
    default: number | string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
  }[];
}

export const indicators: { [key: string]: TechnicalIndicator } = {
  ma: MovingAverageIndicator,
  rsi: RSIIndicator,
  bb: BollingerBandsIndicator,
  macd: MACDIndicator,
  stoch: StochasticIndicator,
  atr: ATRIndicator,
  vp: VolumeProfileIndicator,
  fib: FibonacciIndicator,
  ichimoku: IchimokuIndicator,
  pivots: PivotPointsIndicator,
};

export const calculateIndicator = (
  name: string,
  data: any[],
  config: IndicatorConfig
): IndicatorResult => {
  const indicator = indicators[name];
  if (!indicator) {
    throw new Error(`Indicator ${name} not found`);
  }
  return indicator.calculate(data, config);
};

export const getDefaultConfig = (name: string): IndicatorConfig => {
  const indicator = indicators[name];
  if (!indicator) {
    throw new Error(`Indicator ${name} not found`);
  }
  return { ...indicator.defaultConfig };
};

export const getIndicatorDescription = (name: string): string => {
  const indicator = indicators[name];
  if (!indicator) {
    throw new Error(`Indicator ${name} not found`);
  }
  return indicator.description;
};

export const getIndicatorParams = (name: string) => {
  const indicator = indicators[name];
  if (!indicator) {
    throw new Error(`Indicator ${name} not found`);
  }
  return indicator.params;
};