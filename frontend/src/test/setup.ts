import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock ResizeObserver
class ResizeObserverMock implements ResizeObserver {
  observe(target: Element) {}
  unobserve(target: Element) {}
  disconnect() {}
}

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  
  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return true; },
  };
};

// Mock canvas context
const createMockContext2D = () => ({
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
  getContextAttributes: () => ({
    alpha: true,
    colorSpace: 'srgb',
    desynchronized: false,
    willReadFrequently: false,
  }),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low' as ImageSmoothingQuality,
  strokeStyle: '#000',
  fillStyle: '#000',
  filter: 'none',
  lineCap: 'butt' as CanvasLineCap,
  lineDashOffset: 0,
  lineJoin: 'miter' as CanvasLineJoin,
  lineWidth: 1,
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  direction: 'ltr',
  font: '10px sans-serif',
  textAlign: 'start' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
});

const createMockContextWebGL = () => ({
  canvas: document.createElement('canvas'),
  getContextAttributes: () => ({
    alpha: true,
    antialias: true,
    depth: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'default',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: false,
  }),
});

const createMockContextBitmapRenderer = () => ({
  canvas: document.createElement('canvas'),
  transferFromImageBitmap: jest.fn(),
});

HTMLCanvasElement.prototype.getContext = jest.fn(function(contextId: string) {
  switch (contextId) {
    case '2d':
      return createMockContext2D();
    case 'webgl':
    case 'webgl2':
      return createMockContextWebGL();
    case 'bitmaprenderer':
      return createMockContextBitmapRenderer();
    default:
      return null;
  }
}) as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock WebSocket
class WebSocketMock implements WebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = WebSocketMock.CONNECTING;
  readonly OPEN = WebSocketMock.OPEN;
  readonly CLOSING = WebSocketMock.CLOSING;
  readonly CLOSED = WebSocketMock.CLOSED;

  binaryType: BinaryType = 'blob';
  bufferedAmount = 0;
  extensions = '';
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  protocol = '';
  readyState: number = this.CONNECTING;
  url = '';

  constructor(url: string | URL, protocols?: string | string[]) {
    this.url = url.toString();
  }

  close(code?: number, reason?: string): void {}
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {}
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
    // Implementation
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
    // Implementation
  }
  dispatchEvent(event: Event): boolean {
    return true;
  }
}

// Mock TextEncoder/TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

// Assign mocks to global object
global.ResizeObserver = ResizeObserverMock;
global.IntersectionObserver = IntersectionObserverMock;
global.WebSocket = WebSocketMock;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock crypto for UUID generation
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr: any) => crypto.getRandomValues(arr),
    subtle: crypto.subtle,
  },
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
  })
) as jest.Mock;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Console error/warning filters
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      /Warning/.test(args[0]) ||
      /React does not recognize/.test(args[0]) ||
      /Invalid DOM property/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      /Warning/.test(args[0]) ||
      /React does not recognize/.test(args[0]) ||
      /Invalid DOM property/.test(args[0])
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});