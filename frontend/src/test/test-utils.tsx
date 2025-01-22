import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../providers/ThemeProvider';
import { NotificationProvider } from '../providers/NotificationProvider';
import { WalletProvider } from '../providers/WalletProvider';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { expect } from '@jest/globals';

type ProvidersProps = {
  children: React.ReactNode;
};

interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const mockSession: Session | null = null;

  const AllProviders: React.FC<ProvidersProps> = ({ children }) => (
    <SessionProvider session={mockSession}>
      <ThemeProvider>
        <NotificationProvider>
          <WalletProvider>{children}</WalletProvider>
        </NotificationProvider>
      </ThemeProvider>
    </SessionProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
};

// Mock price data generator
export const generateMockPriceData = (length: number = 100): PriceData[] => {
  const data: PriceData[] = [];
  let price = 100;
  const now = Date.now();
  
  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * 2;
    price += change;
    const high = price + Math.random();
    const low = price - Math.random();
    
    data.push({
      timestamp: now - (length - i) * 60000,
      open: price - change,
      high,
      low,
      close: price,
      volume: Math.floor(Math.random() * 1000000),
    });
  }
  
  return data;
};

// Custom matchers for technical indicators
expect.extend({
  toHaveIndicatorResults(received) {
    const pass = received?.results && 
                Array.isArray(received.results.values) &&
                received.results.values.length > 0;
    return {
      pass,
      message: () => pass
        ? 'Expected indicator not to have results'
        : 'Expected indicator to have valid results array',
    };
  },
  
  toHaveValidOverlayData(received) {
    const hasLines = received?.lines && typeof received.lines === 'object';
    const hasBands = !received.bands || (
      received.bands.upper && 
      received.bands.middle && 
      received.bands.lower
    );
    const hasPoints = !received.points || Array.isArray(received.points);
    
    const pass = hasLines && hasBands && hasPoints;
    
    return {
      pass,
      message: () => pass
        ? 'Expected overlay data to be invalid'
        : 'Expected overlay data to have valid structure',
    };
  },
  
  toMatchIndicatorSettings(received, settings) {
    const pass = Object.entries(settings).every(([key, value]) => 
      received?.settings?.[key] === value
    );
    return {
      pass,
      message: () => pass
        ? 'Expected indicator settings not to match'
        : 'Expected indicator settings to match provided settings',
    };
  },
});

// Mock WebSocket for testing real-time data
export class MockWebSocket {
  private listeners: { [key: string]: Function[] } = {};
  public readyState: number = WebSocket.CONNECTING;
  public binaryType: BinaryType = 'blob';
  public bufferedAmount = 0;
  public extensions = '';
  public protocol = '';
  public url = '';
  public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  public onopen: ((this: WebSocket, ev: Event) => any) | null = null;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  constructor(url: string | URL) {
    this.url = url.toString();
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.emit('open', {});
    }, 0);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {}
  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    this.emit('close', {});
  }

  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener as Function);
  }

  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Helper method to simulate receiving data
  mockMessage(data: any) {
    this.emit('message', { data: JSON.stringify(data) });
  }
}

// Mock chart canvas context
export const createMockCanvasContext = () => ({
  canvas: document.createElement('canvas'),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  setLineDash: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
});

// Mock Solana wallet
export const mockSolanaWallet = {
  publicKey: {
    toString: () => 'mock-public-key',
  },
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Test data generators
export const generateMockPortfolioData = () => ({
  assets: [
    { symbol: 'BTC', quantity: 1.5, value: 45000 },
    { symbol: 'ETH', quantity: 10, value: 2500 },
  ],
  totalValue: 70000,
  pnl: 5000,
  pnlPercentage: 7.5,
});

export const generateMockRiskMetrics = () => ({
  sharpeRatio: 1.5,
  volatility: 0.2,
  beta: 1.1,
  alpha: 0.05,
  maxDrawdown: -0.15,
  var: -0.1,
});

// Re-export testing library utilities
export * from '@testing-library/react';
export { customRender as render };