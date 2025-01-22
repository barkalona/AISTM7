import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndicatorManager } from '../IndicatorManager';
import { UseIndicatorsReturn } from '../../hooks/useIndicators';

// Mock data
const mockIndicatorSettings = {
  ma: {
    enabled: true,
    params: {
      period: 20,
      type: 'sma',
    },
    style: {
      color: '#2196F3',
      lineWidth: 2,
      opacity: 1,
    },
  },
  rsi: {
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
};

const mockIndicators: Partial<UseIndicatorsReturn> = {
  activeIndicators: [
    {
      name: 'ma',
      config: mockIndicatorSettings.ma,
      results: {
        values: [1, 2, 3],
        lines: { ma: [1, 2, 3] },
      },
    },
  ],
  availableIndicators: [
    { name: 'ma', description: 'Moving Average', isActive: true },
    { name: 'rsi', description: 'Relative Strength Index', isActive: false },
  ],
  settings: mockIndicatorSettings,
  addIndicator: jest.fn(),
  removeIndicator: jest.fn(),
  updateIndicatorSettings: jest.fn(),
  getIndicatorParams: jest.fn().mockReturnValue([
    {
      name: 'period',
      type: 'number',
      default: 20,
      min: 1,
      max: 200,
      step: 1,
    },
  ]),
  getIndicatorDescription: jest.fn(),
  isIndicatorActive: jest.fn(),
  getOverlayData: jest.fn(),
};

describe('IndicatorManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders available indicators', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    expect(screen.getByText('Moving Average')).toBeInTheDocument();
    expect(screen.getByText('Relative Strength Index')).toBeInTheDocument();
  });

  it('shows add/remove buttons correctly', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    // MA is active, should show Remove button
    expect(screen.getByText('Remove')).toBeInTheDocument();
    // RSI is not active, should show Add button
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('calls addIndicator when Add button is clicked', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    expect(mockIndicators.addIndicator).toHaveBeenCalledWith('rsi');
  });

  it('calls removeIndicator when Remove button is clicked', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    expect(mockIndicators.removeIndicator).toHaveBeenCalledWith('ma');
  });

  it('shows indicator settings when indicator is selected', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    // Click on the active indicator to show settings
    const indicator = screen.getByText('ma');
    fireEvent.click(indicator);
    
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
  });

  it('updates indicator parameters when changed', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    // Click on the active indicator to show settings
    const indicator = screen.getByText('ma');
    fireEvent.click(indicator);
    
    // Find and change the period input
    const periodInput = screen.getByLabelText('period:');
    fireEvent.change(periodInput, { target: { value: '25' } });
    
    expect(mockIndicators.updateIndicatorSettings).toHaveBeenCalledWith('ma', {
      params: {
        ...mockIndicatorSettings.ma.params,
        period: 25,
      },
    });
  });

  it('updates indicator style when changed', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    // Click on the active indicator to show settings
    const indicator = screen.getByText('ma');
    fireEvent.click(indicator);
    
    // Find and change the line width input
    const lineWidthInput = screen.getByLabelText('Line Width:');
    fireEvent.change(lineWidthInput, { target: { value: '3' } });
    
    expect(mockIndicators.updateIndicatorSettings).toHaveBeenCalledWith('ma', {
      style: {
        ...mockIndicatorSettings.ma.style,
        lineWidth: 3,
      },
    });
  });

  it('collapses indicator settings when clicked again', () => {
    render(<IndicatorManager indicators={mockIndicators as UseIndicatorsReturn} />);
    
    // Click to show settings
    const indicator = screen.getByText('ma');
    fireEvent.click(indicator);
    
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    
    // Click again to hide settings
    fireEvent.click(indicator);
    
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
  });

  it('handles empty active indicators', () => {
    const emptyIndicators = {
      ...mockIndicators,
      activeIndicators: [],
    };
    
    render(<IndicatorManager indicators={emptyIndicators as UseIndicatorsReturn} />);
    
    expect(screen.queryByText('Active Indicators')).not.toBeInTheDocument();
  });
});