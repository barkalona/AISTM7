import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import loadTestRunner from '../../../../../backend/tests/performance/notification_load_test';

// Validate test configuration
function validateConfig(config: any) {
    if (!config) {
        throw new Error('Test configuration is required');
    }

    if (!config.targetUrl || typeof config.targetUrl !== 'string') {
        throw new Error('Valid target URL is required');
    }

    if (!config.duration || typeof config.duration !== 'string') {
        throw new Error('Valid duration is required');
    }

    if (!config.vus || typeof config.vus !== 'number' || config.vus < 1 || config.vus > 1000) {
        throw new Error('Virtual users must be between 1 and 1000');
    }

    // Validate URL format
    try {
        new URL(config.targetUrl);
    } catch {
        throw new Error('Invalid target URL format');
    }

    // Validate duration format (e.g., "30s", "5m", "1h")
    if (!/^\d+[smh]$/.test(config.duration)) {
        throw new Error('Invalid duration format. Use format: 30s, 5m, 1h');
    }

    return true;
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json();
        const { action, config } = body;

        if (action === 'start') {
            try {
                validateConfig(config);
            } catch (error: any) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }

            // Check if test is already running
            const status = loadTestRunner.getStatus();
            if (status.isRunning) {
                return NextResponse.json(
                    { error: 'Test already in progress' },
                    { status: 409 }
                );
            }

            // Start test
            try {
                await loadTestRunner.startTest(config);
                return NextResponse.json({ status: 'started' });
            } catch (error: any) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
        }

        if (action === 'stop') {
            // Stop test
            try {
                await loadTestRunner.stopTest();
                return NextResponse.json({ status: 'stopped' });
            } catch (error: any) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
        }

        if (action === 'status') {
            // Get test status
            const status = loadTestRunner.getStatus();
            return NextResponse.json(status);
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Load test error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Only allow POST requests
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}

// Rate limiting configuration
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
        externalResolver: true,
    },
};