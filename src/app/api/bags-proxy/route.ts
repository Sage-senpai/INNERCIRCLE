// File: src/app/api/bags-proxy/route.ts
// ============================================================================
// Server-side proxy for Bags API to avoid CORS issues
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

const BAGS_API_BASE = (process.env.NEXT_PUBLIC_BAGS_API_URL || 'https://public-api-v2.bags.fm/api/v1').replace(/\/+$/, '');
const BAGS_API_KEY = process.env.NEXT_PUBLIC_BAGS_API_KEY || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  // Construct the full URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BAGS_API_BASE}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(BAGS_API_KEY ? { 'x-api-key': BAGS_API_KEY } : {}),
      },
    });

    // Get the response data
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || `API request failed: ${response.statusText}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Bags API proxy error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch from Bags API',
        status: 500
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    );
  }

  // Construct the full URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BAGS_API_BASE}${normalizedEndpoint}`;

  try {
    const body = await request.json().catch(() => null);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(BAGS_API_KEY ? { 'x-api-key': BAGS_API_KEY } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get the response data
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || `API request failed: ${response.statusText}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Bags API proxy error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch from Bags API',
        status: 500
      },
      { status: 500 }
    );
  }
}
