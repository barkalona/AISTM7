import { useState, useMemo, useCallback } from 'react';
import { indicators, TechnicalIndicator, IndicatorConfig } from '../components/indicators';
import { PriceData } from '../components/indicators/MovingAverage';

export interface ActiveIndicator {
  name: string;
  config: IndicatorConfig;
  results?: {
    values: number[];
    lines?: { [key: string]: number[] };
    bands?: { upper: number[]; middle: number[]; lower: number[] };
    points?: { x: number; y: number; label: string }[];
  };
}

export interface IndicatorSettings {
  [key: string]: {
    enabled: boolean;
    params: Record<string, number | string>;
    style: {
      color: string;
      lineWidth: number;
      opacity: number;
    };
  };
}

interface BandData {
  upper: number[];
  middle: number[];
  lower: number[];
}

interface OverlayData {
  lines: { [key: string]: { data: number[]; style: any }[] };
  bands: { data: BandData; style: any }[];
  points: { x: number; y: number; label: string; style: any }[];
}

export const useIndicators = (priceData: PriceData[]) => {
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);
  const [settings, setSettings] = useState<IndicatorSettings>(() => {
    const initialSettings: IndicatorSettings = {};
    Object.entries(indicators).forEach(([name, indicator]) => {
      initialSettings[name] = { ...indicator.defaultConfig };
    });
    return initialSettings;
  });

  // Calculate indicator results whenever price data or settings change
  const indicatorResults = useMemo(() => {
    return activeIndicators.map(indicator => {
      const config = settings[indicator.name];
      if (!config.enabled) return null;

      const calculatedResults = indicators[indicator.name].calculate(priceData, config);
      return {
        ...indicator,
        results: calculatedResults,
      };
    }).filter(Boolean) as ActiveIndicator[];
  }, [priceData, activeIndicators, settings]);

  // Add an indicator to the chart
  const addIndicator = useCallback((name: string) => {
    if (!indicators[name]) return;

    setActiveIndicators(prev => {
      if (prev.some(i => i.name === name)) return prev;
      return [...prev, { name, config: settings[name] }];
    });
  }, [settings]);

  // Remove an indicator from the chart
  const removeIndicator = useCallback((name: string) => {
    setActiveIndicators(prev => prev.filter(i => i.name !== name));
  }, []);

  // Update indicator settings
  const updateIndicatorSettings = useCallback((
    name: string,
    updates: Partial<IndicatorConfig>
  ) => {
    setSettings(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        ...updates,
      },
    }));
  }, []);

  // Get available parameters for an indicator
  const getIndicatorParams = useCallback((name: string) => {
    return indicators[name]?.params || [];
  }, []);

  // Get indicator description
  const getIndicatorDescription = useCallback((name: string) => {
    return indicators[name]?.description || '';
  }, []);

  // Check if an indicator is active
  const isIndicatorActive = useCallback((name: string) => {
    return activeIndicators.some(i => i.name === name);
  }, [activeIndicators]);

  // Get all available indicators
  const availableIndicators = useMemo(() => {
    return Object.entries(indicators).map(([name, indicator]) => ({
      name,
      description: indicator.description,
      isActive: isIndicatorActive(name),
    }));
  }, [isIndicatorActive]);

  // Get overlay data for the chart
  const getOverlayData = useCallback((): OverlayData => {
    const overlays: OverlayData = {
      lines: {},
      bands: [],
      points: [],
    };

    indicatorResults.forEach(indicator => {
      const style = settings[indicator.name].style;
      
      if (indicator.results?.lines) {
        Object.entries(indicator.results.lines).forEach(([key, data]) => {
          if (!overlays.lines[key]) overlays.lines[key] = [];
          overlays.lines[key].push({ data, style });
        });
      }

      if (indicator.results?.bands) {
        overlays.bands.push({
          data: indicator.results.bands,
          style,
        });
      }

      if (indicator.results?.points) {
        overlays.points.push(
          ...indicator.results.points.map(point => ({
            ...point,
            style,
          }))
        );
      }
    });

    return overlays;
  }, [indicatorResults, settings]);

  return {
    activeIndicators: indicatorResults,
    availableIndicators,
    settings,
    addIndicator,
    removeIndicator,
    updateIndicatorSettings,
    getIndicatorParams,
    getIndicatorDescription,
    isIndicatorActive,
    getOverlayData,
  };
};

export type UseIndicatorsReturn = ReturnType<typeof useIndicators>;