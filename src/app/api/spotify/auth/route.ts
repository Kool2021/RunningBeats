import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const userData = await response.json();
    return NextResponse.json({
      authenticated: true,
      user: { name: userData.display_name, id: userData.id }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
