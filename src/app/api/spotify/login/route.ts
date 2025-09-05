import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Spotify configuration missing' },
      { status: 500 }
    );
  }

  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: 'playlist_creation',
  });

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  return NextResponse.redirect(spotifyAuthUrl);
}
