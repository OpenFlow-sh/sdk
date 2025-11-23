import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Syncs Coinbase user with Onyx backend
 * Creates or updates user and sets session cookie
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, coinbaseUserId, walletAddress } = body;

    if (!email || !coinbaseUserId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call Onyx backend to create/update user and get session
    const backendUrl = process.env.INTERNAL_URL || 'http://api_server:8080';
    const response = await fetch(`${backendUrl}/api/auth/coinbase-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        coinbase_user_id: coinbaseUserId,
        wallet_address: walletAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Authentication failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Backend should set session cookie via Set-Cookie header
    // Forward it to the client
    const setCookieHeader = response.headers.get('set-cookie');
    const nextResponse = NextResponse.json({
      success: true,
      user: data.user,
    });

    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error('Coinbase sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}