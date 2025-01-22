import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';
import { Position } from '@/types/portfolio';

export function usePortfolioWebSocket() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Fetch initial portfolio data
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/portfolio');
        if (!response.ok) throw new Error('Failed to fetch portfolio data');
        const data = await response.json();
        
        // Transform the data to match Position type
        const transformedData: Position[] = data.map((item: any) => ({
          symbol: item.symbol,
          quantity: item.quantity,
          value: item.value,
          allocation: item.allocation,
          contractId: item.contractId,
          lastPrice: item.lastPrice,
          assetClass: item.assetClass || 'other',
          change24h: item.change24h || 0
        }));
        
        setPositions(transformedData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load portfolio data');
        setLoading(false);
        addNotification({
          type: 'error',
          title: 'Portfolio Error',
          message: 'Failed to load portfolio data',
          userId: 'system'
        });
      }
    };

    fetchPortfolio();

    // Set up WebSocket connection
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/portfolio/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to market data for all positions
      if (positions.length > 0) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          contractIds: positions.map(p => p.contractId)
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'portfolioUpdate') {
          setPositions(message.positions.map((item: any) => ({
            symbol: item.symbol,
            quantity: item.quantity,
            value: item.value,
            allocation: item.allocation,
            contractId: item.contractId,
            lastPrice: item.lastPrice,
            assetClass: item.assetClass || 'other',
            change24h: item.change24h || 0
          })));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Lost connection to portfolio data feed',
        userId: 'system'
      });
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [session?.user?.id, addNotification]);

  return {
    positions,
    loading,
    error
  };
}