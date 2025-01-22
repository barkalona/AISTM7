import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Target minimum USD value for access
const TARGET_USD_VALUE = 20;

// Cache price data to avoid excessive API calls
let priceCache: {
  price: number;
  timestamp: number;
  minimumTokens: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchTokenPrice(): Promise<number> {
  try {
    // TODO: Replace with actual price feed integration
    // For now, simulate a price that would require around 700,000 tokens
    // to meet the $20 minimum value
    const mockPrice = 0.0000285714; // $20 / 700,000

    // In production, integrate with a price oracle or DEX API
    // const response = await fetch('PRICE_FEED_URL');
    // const data = await response.json();
    // return data.price;

    return mockPrice;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check cache
    if (
      priceCache &&
      Date.now() - priceCache.timestamp < CACHE_DURATION
    ) {
      return NextResponse.json(priceCache);
    }

    // Fetch new price
    const price = await fetchTokenPrice();
    const minimumTokens = Math.ceil(TARGET_USD_VALUE / price);

    // Update cache
    priceCache = {
      price,
      timestamp: Date.now(),
      minimumTokens
    };

    return NextResponse.json(priceCache);
  } catch (error) {
    console.error('Error in token price API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Webhook endpoint for price updates
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify webhook signature
    // TODO: Implement webhook signature verification

    const data = await request.json();
    
    if (!data.price || typeof data.price !== 'number') {
      return new NextResponse('Invalid price data', { status: 400 });
    }

    // Update cache with new price
    const minimumTokens = Math.ceil(TARGET_USD_VALUE / data.price);
    priceCache = {
      price: data.price,
      timestamp: Date.now(),
      minimumTokens
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in price webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to calculate minimum tokens needed
export function calculateMinimumTokens(price: number): number {
  return Math.ceil(TARGET_USD_VALUE / price);
}