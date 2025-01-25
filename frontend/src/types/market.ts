export interface MarketData {
  contractId: string;
  last: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: number;
}

export interface MarketDataUpdate {
  contractId: string;
  data: MarketData;
}

export interface BatchUpdate {
  updates: MarketDataUpdate[];
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketMessage {
  type: string;
  contractId?: string;
  data?: MarketData;
  updates?: MarketDataUpdate[];
}

export interface UseMarketDataReturn {
  data: Record<string, MarketData>;
  subscribe: (contractIds: string[]) => Promise<void>;
  unsubscribe: (contractIds: string[]) => Promise<void>;
  connectionState: ConnectionState;
  error: Error | null;
}