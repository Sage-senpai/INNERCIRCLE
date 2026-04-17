// File: src/app/api/token-proxy/route.ts
// ============================================================================
// Token Metrics Proxy - Handles CORS for DexScreener and Jupiter APIs
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// Allowed API hosts for security
const ALLOWED_HOSTS = [
  'api.dexscreener.com',
  'api.jup.ag',
  'price.jup.ag',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Validate the target URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    );
  }

  // Security check - only allow specific hosts
  if (!ALLOWED_HOSTS.includes(parsedUrl.host)) {
    return NextResponse.json(
      { error: 'Host not allowed' },
      { status: 403 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'InnerCircle/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Token proxy error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upstream API timed out', source: parsedUrl.host },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch from upstream API' },
      { status: 502 }
    );
  }
}
