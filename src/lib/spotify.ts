import { SpotifyTrack, SpotifyAudioAnalysis } from '@/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to get Spotify access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function searchTracks(
  accessToken: string,
  query: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search tracks');
  }

  const data = await response.json();
  return data.tracks.items.map((track: {
    id: string;
    name: string;
    artists: { id: string; name: string }[];
    preview_url: string | null;
    duration_ms: number;
    popularity: number;
  }) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    preview_url: track.preview_url,
    duration_ms: track.duration_ms,
    popularity: track.popularity,
  }));
}

export async function getArtist(
  accessToken: string,
  artistId: string
): Promise<{ id: string; name: string; genres: string[] }> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/artists/${artistId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get artist');
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    genres: data.genres || []
  };
}

export async function getArtists(
  accessToken: string,
  artistIds: string[]
): Promise<Array<{ id: string; name: string; genres: string[] }>> {
  const batches = [];
  for (let i = 0; i < artistIds.length; i += 50) {
    batches.push(artistIds.slice(i, i + 50));
  }

  const allArtists = [];
  for (const batch of batches) {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/artists?ids=${batch.join(',')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Failed to get artists batch: ${response.status}`);
      continue;
    }

    const data = await response.json();
    allArtists.push(...data.artists.map((artist: {
      id: string;
      name: string;
      genres: string[];
    }) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres || []
    })));
  }

  return allArtists;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get playlist tracks');
  }

  const data = await response.json();
  return data.items
    .filter((item: { track: { type: string } }) => item.track && item.track.type === 'track')
    .map((item: {
      track: {
        id: string;
        name: string;
        artists: { id: string; name: string }[];
        preview_url: string | null;
        duration_ms: number;
        popularity: number;
      };
    }) => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map((artist) => ({ id: artist.id, name: artist.name })),
      preview_url: item.track.preview_url,
      duration_ms: item.track.duration_ms,
      popularity: item.track.popularity,
    }));
}

export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<Array<{ tempo: number; time_signature: number } | null>> {
  const chunks = chunkArray(trackIds, 100);
  const allFeatures: Array<{ tempo: number; time_signature: number } | null> = [];

  for (const chunk of chunks) {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/audio-features?ids=${chunk.join(',')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get audio features');
    }

    const data = await response.json();
    allFeatures.push(...data.audio_features.map((features: { tempo: number; time_signature: number } | null) => 
      features ? { tempo: features.tempo, time_signature: features.time_signature } : null
    ));
  }

  return allFeatures;
}

export async function getAudioAnalysis(
  accessToken: string,
  trackId: string
): Promise<SpotifyAudioAnalysis> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/audio-analysis/${trackId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get audio analysis');
  }

  const data = await response.json();
  return {
    sections: data.sections.map((section: { start: number; duration: number; confidence: number; tempo: number; tempo_confidence: number }) => ({
      start: section.start,
      duration: section.duration,
      confidence: section.confidence,
      tempo: section.tempo,
      tempo_confidence: section.tempo_confidence,
    })),
  };
}

export async function getRecommendations(
  accessToken: string,
  params: {
    seedGenres?: string[];
    seedTracks?: string[];
    targetTempo?: number;
    tempoRange?: { min: number; max: number };
    energy?: { min: number; max: number };
    danceability?: { min: number; max: number };
    limit?: number;
  }
): Promise<SpotifyTrack[]> {
  const queryParams = new URLSearchParams();
  
  if (params.seedGenres?.length) {
    queryParams.append('seed_genres', params.seedGenres.join(','));
  }
  
  if (params.seedTracks?.length) {
    queryParams.append('seed_tracks', params.seedTracks.join(','));
  }
  
  if (params.targetTempo) {
    queryParams.append('target_tempo', params.targetTempo.toString());
  }
  
  if (params.tempoRange) {
    queryParams.append('min_tempo', params.tempoRange.min.toString());
    queryParams.append('max_tempo', params.tempoRange.max.toString());
  }
  
  if (params.energy) {
    queryParams.append('min_energy', params.energy.min.toString());
    queryParams.append('max_energy', params.energy.max.toString());
  }
  
  if (params.danceability) {
    queryParams.append('min_danceability', params.danceability.min.toString());
    queryParams.append('max_danceability', params.danceability.max.toString());
  }
  
  queryParams.append('limit', (params.limit || 50).toString());

  const response = await fetch(
    `${SPOTIFY_API_BASE}/recommendations?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Spotify recommendations error:', response.status, errorData);
    console.error('Request URL:', `${SPOTIFY_API_BASE}/recommendations?${queryParams.toString()}`);
    throw new Error(`Failed to get recommendations: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return data.tracks.map((track: {
    id: string;
    name: string;
    artists: { id: string; name: string }[];
    preview_url: string | null;
    duration_ms: number;
  }) => ({
    id: track.id,
    name: track.name,
    artists: track.artists,
    preview_url: track.preview_url,
    duration_ms: track.duration_ms,
  }));
}

export async function getAvailableGenres(accessToken: string): Promise<string[]> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/recommendations/available-genre-seeds`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get available genres');
  }

  const data = await response.json();
  return data.genres;
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
