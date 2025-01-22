import { TechnicalIndicator, IndicatorConfig, IndicatorResult } from './index';
import { PriceData } from './MovingAverage';

interface VolumeByPrice {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
}

const calculateVolumeProfile = (
  data: PriceData[],
  numberOfBins: number
): VolumeByPrice[] => {
  // Find price range
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const binSize = priceRange / numberOfBins;

  // Initialize bins
  const bins: VolumeByPrice[] = Array.from({ length: numberOfBins }, (_, i) => ({
    price: minPrice + (i + 0.5) * binSize, // Use middle of bin as price
    volume: 0,
    buyVolume: 0,
    sellVolume: 0,
  }));

  // Distribute volume into bins
  data.forEach((candle, i) => {
    const volume = candle.volume || 0;
    const binIndex = Math.min(
      Math.floor(((candle.close - minPrice) / priceRange) * numberOfBins),
      numberOfBins - 1
    );

    bins[binIndex].volume += volume;

    // Determine if it's buying or selling volume based on price movement
    if (i > 0) {
      const priceChange = candle.close - data[i - 1].close;
      if (priceChange > 0) {
        bins[binIndex].buyVolume += volume;
      } else if (priceChange < 0) {
        bins[binIndex].sellVolume += volume;
      } else {
        // Split volume equally if price didn't change
        bins[binIndex].buyVolume += volume / 2;
        bins[binIndex].sellVolume += volume / 2;
      }
    } else {
      // For the first candle, split volume equally
      bins[binIndex].buyVolume += volume / 2;
      bins[binIndex].sellVolume += volume / 2;
    }
  });

  return bins;
};

const findValueAreas = (
  bins: VolumeByPrice[],
  threshold: number
): { x: number; y: number; label: string }[] => {
  const areas: { x: number; y: number; label: string }[] = [];
  const meanVolume = bins.reduce((sum, bin) => sum + bin.volume, 0) / bins.length;

  bins.forEach(bin => {
    if (bin.volume > meanVolume * threshold) {
      const buyRatio = bin.buyVolume / bin.volume;
      areas.push({
        x: bin.price,
        y: bin.volume,
        label: buyRatio > 0.6 ? 'High Volume Support' : 
               buyRatio < 0.4 ? 'High Volume Resistance' : 
               'High Volume Area',
      });
    }
  });

  return areas;
};

const calculatePOC = (bins: VolumeByPrice[]): number => {
  let maxVolume = 0;
  let pocPrice = 0;

  bins.forEach(bin => {
    if (bin.volume > maxVolume) {
      maxVolume = bin.volume;
      pocPrice = bin.price;
    }
  });

  return pocPrice;
};

export const VolumeProfileIndicator: TechnicalIndicator = {
  name: 'Volume Profile',
  description: 'Shows trading activity distribution across price levels',
  defaultConfig: {
    enabled: true,
    params: {
      bins: 24,
      threshold: 1.5, // Multiplier of mean volume to identify significant areas
      period: 20, // Number of periods to analyze
    },
    style: {
      color: '#3F51B5',
      lineWidth: 2,
      opacity: 0.8,
    },
  },
  params: [
    {
      name: 'bins',
      type: 'number',
      default: 24,
      min: 10,
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
    {
      name: 'period',
      type: 'number',
      default: 20,
      min: 5,
      max: 100,
      step: 1,
    },
  ],
  calculate: (data: PriceData[], config: IndicatorConfig): IndicatorResult => {
    const bins = config.params.bins as number;
    const threshold = config.params.threshold as number;
    const period = config.params.period as number;

    // Use only the most recent 'period' candles
    const recentData = data.slice(-period);
    
    const volumeProfile = calculateVolumeProfile(recentData, bins);
    const valueAreas = findValueAreas(volumeProfile, threshold);
    const poc = calculatePOC(volumeProfile);

    // Create arrays for visualization
    const prices = volumeProfile.map(bin => bin.price);
    const volumes = volumeProfile.map(bin => bin.volume);
    const buyVolumes = volumeProfile.map(bin => bin.buyVolume);
    const sellVolumes = volumeProfile.map(bin => bin.sellVolume);

    return {
      values: volumes,
      lines: {
        prices,
        volumes,
        buyVolumes,
        sellVolumes,
        poc: Array(volumes.length).fill(poc),
      },
      points: valueAreas,
    };
  },
};