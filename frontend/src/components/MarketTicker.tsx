import { useEffect, useState } from 'react';
import { formatCurrency, formatPercentage } from '../utils/format';

interface MarketPrice {
  symbol: string;
  price: number;
  change: number;
}

const initialPrices: MarketPrice[] = [
  { symbol: 'BTC', price: 43250.75, change: 2.4 },
  { symbol: 'ETH', price: 2280.50, change: -1.2 },
  { symbol: 'SOL', price: 98.45, change: 5.7 },
  { symbol: 'AVAX', price: 32.80, change: 3.1 },
  { symbol: 'DOT', price: 6.90, change: -0.8 },
];

export default function MarketTicker() {
  const [prices, setPrices] = useState<MarketPrice[]>(initialPrices);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setPrices(currentPrices =>
          currentPrices.map(price => ({
            ...price,
            price: price.price * (1 + (Math.random() - 0.5) * 0.002),
            change: price.change + (Math.random() - 0.5) * 0.2,
          }))
        );
      } catch (err) {
        setError('Error updating market prices');
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="w-full bg-red-900/20 backdrop-blur-sm py-2 px-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/50 backdrop-blur-sm py-2 overflow-hidden border-b border-gray-800">
      <div className="market-ticker">
        {prices.map((price, index) => (
          <div
            key={`${price.symbol}-${index}`}
            className={`market-ticker-item ${price.change >= 0 ? 'up' : 'down'} px-4`}
          >
            <span className="font-mono font-medium">{price.symbol}</span>
            <span className="font-mono">{formatCurrency(price.price)}</span>
            <span className="flex items-center gap-1 font-mono">
              {price.change >= 0 ? '↑' : '↓'}
              {formatPercentage(Math.abs(price.change / 100))}
            </span>
          </div>
        ))}
        {/* Duplicate items for seamless loop */}
        {prices.map((price, index) => (
          <div
            key={`${price.symbol}-duplicate-${index}`}
            className={`market-ticker-item ${price.change >= 0 ? 'up' : 'down'} px-4`}
          >
            <span className="font-mono font-medium">{price.symbol}</span>
            <span className="font-mono">{formatCurrency(price.price)}</span>
            <span className="flex items-center gap-1 font-mono">
              {price.change >= 0 ? '↑' : '↓'}
              {formatPercentage(Math.abs(price.change / 100))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}