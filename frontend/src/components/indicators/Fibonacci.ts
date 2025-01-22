import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

// Standard Fibonacci ratios
const FIBONACCI_LEVELS = {
  EXTENSION_1618: 1.618,
  EXTENSION_1272: 1.272,
  EXTENSION_1000: 1.000,
  RETRACEMENT_786: 0.786,
  RETRACEMENT_618: 0.618,
  RETRACEMENT_500: 0.500,
  RETRACEMENT_382: 0.382,
  RETRACEMENT_236: 0.236,
  RETRACEMENT_000: 0.000,
};

interface SwingPoint {
  price: number;
  index: number;
  type: 'high' | 'low';
}

const findSwingPoints = (data: PriceData[], lookback: number): SwingPoint[] => {
  const points: SwingPoint[] = [];
  
  for (let i = lookback; i < data.length - lookback; i++) {
    const currentHigh = data[i].high || data[i].close;
    const currentLow = data[i].low || data[i].close;
    
    // Check if this is a swing high
    let isSwingHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if ((data[j].high || data[j].close) > currentHigh) {
        isSwingHigh = false;
        break;
      }
    }
    
    // Check if this is a swing low
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if ((data[j].low || data[j].close) < currentLow) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      points.push({ price: currentHigh, index: i, type: 'high' });
    }
    if (isSwingLow) {
      points.push({ price: currentLow, index: i, type: 'low' });
    }
  }
  
  return points;
};

const calculateFibonacciLevels = (
  startPrice: number,
  endPrice: number,
  trend: 'up' | 'down'
): { level: number; price: number; name: string }[] => {
  const diff = endPrice - startPrice;
  const levels: { level: number; price: number; name: string }[] = [];
  
  Object.entries(FIBONACCI_LEVELS).forEach(([name, ratio]) => {
    let price: number;
    if (trend === 'up') {
      if (ratio > 1) {
        // Extension levels above the high
        price = endPrice + (diff * (ratio - 1));
      } else {
        // Retracement levels below the high
        price = endPrice - (diff * (1 - ratio));
      }
    } else {
      if (ratio > 1) {
        // Extension levels below the low
        price = endPrice - (diff * (ratio - 1));
      } else {
        // Retracement levels above the low
        price = endPrice + (diff * (1 - ratio));
      }
    }
    
    levels.push({
      level: ratio,
      price,
      name: name.toLowerCase()
        .replace('_', ' ')
        .replace(/(\d{3})/g, '0.$1')
        .replace(/extension|retracement/g, '')
        .trim(),
    });
  });
  
  return levels;
};

const findTrendPoints = (
  swingPoints: SwingPoint[],
  lookback: number
): { start: SwingPoint; end: SwingPoint; trend: 'up' | 'down' } | null => {
  if (swingPoints.length < 2) return null;
  
  // Get recent swing points within lookback period
  const recentPoints = swingPoints.slice(-lookback);
  
  // Find the highest high and lowest low
  let highestPoint = recentPoints[0];
  let lowestPoint = recentPoints[0];
  
  recentPoints.forEach(point => {
    if (point.price > highestPoint.price) highestPoint = point;
    if (point.price < lowestPoint.price) lowestPoint = point;
  });
  
  // Determine trend based on which extreme is more recent
  if (highestPoint.index > lowestPoint.index) {
    return {
      start: lowestPoint,
      end: highestPoint,
      trend: 'up',
    };
  } else {
    return {
      start: highestPoint,
      end: lowestPoint,
      trend: 'down',
    };
  }
};

export const FibonacciIndicator: TechnicalIndicator = {
  name: 'Fibonacci Retracement/Extension',
  description: 'Identifies potential support and resistance levels based on Fibonacci ratios',
  defaultConfig: {
    enabled: true,
    params: {
      swingLookback: 5,
      trendLookback: 20,
    },
    style: {
      color: '#8E24AA',
      lineWidth: 1,
      opacity: 0.8,
    },
  },
  params: [
    {
      name: 'swingLookback',
      type: 'number',
      default: 5,
      min: 2,
      max: 20,
      step: 1,
    },
    {
      name: 'trendLookback',
      type: 'number',
      default: 20,
      min: 5,
      max: 100,
      step: 1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const swingLookback = config.params.swingLookback as number;
    const trendLookback = config.params.trendLookback as number;
    
    const swingPoints = findSwingPoints(data, swingLookback);
    const trend = findTrendPoints(swingPoints, trendLookback);
    
    if (!trend) {
      return {
        values: [],
        lines: {},
        points: [],
      };
    }
    
    const levels = calculateFibonacciLevels(
      trend.start.price,
      trend.end.price,
      trend.trend
    );
    
    // Create horizontal lines for each level
    const lines: { [key: string]: number[] } = {};
    levels.forEach(level => {
      lines[`fib_${level.name}`] = Array(data.length).fill(level.price);
    });
    
    // Create points for level intersections with price
    const points = levels.map(level => ({
      x: data[trend.end.index].timestamp,
      y: level.price,
      label: `${level.name} (${(level.level * 100).toFixed(1)}%)`,
    }));
    
    return {
      values: Object.values(lines)[0], // Use first level as main values
      lines,
      points,
    };
  },
};