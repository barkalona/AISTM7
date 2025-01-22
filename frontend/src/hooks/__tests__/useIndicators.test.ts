import { renderHook, act } from '@testing-library/react';
import { useIndicators } from '../useIndicators';

// Mock price data for testing
const mockPriceData = [
  { timestamp: 1, close: 100, high: 105, low: 95, volume: 1000 },
  { timestamp: 2, close: 101, high: 106, low: 96, volume: 1100 },
  { timestamp: 3, close: 102, high: 107, low: 97, volume: 1200 },
];

describe('useIndicators', () => {
  it('initializes with empty active indicators', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    expect(result.current.activeIndicators).toHaveLength(0);
    expect(result.current.availableIndicators.length).toBeGreaterThan(0);
  });

  it('adds an indicator correctly', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
    });
    
    expect(result.current.activeIndicators).toHaveLength(1);
    expect(result.current.activeIndicators[0].name).toBe('ma');
    expect(result.current.isIndicatorActive('ma')).toBe(true);
  });

  it('removes an indicator correctly', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
    });
    
    expect(result.current.activeIndicators).toHaveLength(1);
    
    act(() => {
      result.current.removeIndicator('ma');
    });
    
    expect(result.current.activeIndicators).toHaveLength(0);
    expect(result.current.isIndicatorActive('ma')).toBe(false);
  });

  it('updates indicator settings correctly', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
    });
    
    const newParams = { period: 50 };
    
    act(() => {
      result.current.updateIndicatorSettings('ma', { params: newParams });
    });
    
    expect(result.current.settings.ma.params.period).toBe(50);
  });

  it('calculates indicator results when settings change', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
    });
    
    const initialResults = result.current.activeIndicators[0].results;
    
    act(() => {
      result.current.updateIndicatorSettings('ma', {
        params: { period: 50 },
      });
    });
    
    const updatedResults = result.current.activeIndicators[0].results;
    expect(updatedResults).not.toEqual(initialResults);
  });

  it('provides correct overlay data for charts', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('bb'); // Bollinger Bands
    });
    
    const overlayData = result.current.getOverlayData();
    
    expect(overlayData).toHaveProperty('lines');
    expect(overlayData).toHaveProperty('bands');
    expect(overlayData).toHaveProperty('points');
  });

  it('prevents duplicate indicators', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
      result.current.addIndicator('ma'); // Try to add same indicator again
    });
    
    expect(result.current.activeIndicators).toHaveLength(1);
  });

  it('handles invalid indicator names', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      // @ts-ignore - Testing invalid indicator name
      result.current.addIndicator('invalid');
    });
    
    expect(result.current.activeIndicators).toHaveLength(0);
  });

  it('maintains indicator settings after removal and re-addition', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
      result.current.updateIndicatorSettings('ma', {
        params: { period: 50 },
      });
    });
    
    const originalSettings = { ...result.current.settings.ma };
    
    act(() => {
      result.current.removeIndicator('ma');
      result.current.addIndicator('ma');
    });
    
    expect(result.current.settings.ma).toEqual(originalSettings);
  });

  it('provides correct indicator parameters', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    const maParams = result.current.getIndicatorParams('ma');
    expect(maParams).toContainEqual(
      expect.objectContaining({
        name: 'period',
        type: 'number',
      })
    );
  });

  it('provides indicator descriptions', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    const description = result.current.getIndicatorDescription('ma');
    expect(description).toBeTruthy();
    expect(typeof description).toBe('string');
  });

  it('updates multiple indicators independently', () => {
    const { result } = renderHook(() => useIndicators(mockPriceData));
    
    act(() => {
      result.current.addIndicator('ma');
      result.current.addIndicator('rsi');
    });
    
    act(() => {
      result.current.updateIndicatorSettings('ma', {
        params: { period: 50 },
      });
    });
    
    expect(result.current.settings.ma.params.period).toBe(50);
    expect(result.current.settings.rsi.params.period).toBe(14); // Default RSI period
  });
});