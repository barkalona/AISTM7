import { NextRequest, NextResponse } from 'next/server';

// New way to configure API routes in Next.js 14
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Simulate load test
    const result = await simulateLoad();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Load test failed' },
      { status: 500 }
    );
  }
}

async function simulateLoad() {
  // Simulate some load testing logic
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    responseTime: Math.random() * 100,
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration = 1000, concurrent = 1 } = body;

    // Run load test with parameters
    const result = await runLoadTest(duration, concurrent);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Load test failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId } = body;
    
    // Update test configuration
    return NextResponse.json({ 
      success: true, 
      message: `Test ${testId} updated` 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json(
        { success: false, error: 'Test ID required' },
        { status: 400 }
      );
    }

    // Delete test configuration
    return NextResponse.json({ 
      success: true, 
      message: `Test ${testId} deleted` 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Deletion failed' },
      { status: 500 }
    );
  }
}

async function runLoadTest(duration: number, concurrent: number) {
  // Simulate concurrent load testing
  const promises = Array(concurrent).fill(0).map(() => simulateLoad());
  const results = await Promise.all(promises);
  
  return {
    totalRequests: concurrent,
    duration,
    results
  };
}