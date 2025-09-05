import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(`${process.env.APP_ORIGIN}/auth/error?error=${error}`);
  }

  if (!code || state !== 'playlist_creation') {
    return NextResponse.redirect(`${process.env.APP_ORIGIN}/auth/error?error=invalid_callback`);
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri!,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await response.json();

    const redirectResponse = NextResponse.redirect(`${process.env.APP_ORIGIN}/auth/success`);
    redirectResponse.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
    });

    if (tokens.refresh_token) {
      redirectResponse.cookies.set('spotify_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return redirectResponse;
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(`${process.env.APP_ORIGIN}/auth/error?error=token_exchange_failed`);
  }
}

