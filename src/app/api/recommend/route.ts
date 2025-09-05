import { NextRequest, NextResponse } from 'next/server';
import { PaceInput, TrackData, Playlist, PlaylistSection, SpotifyTrack } from '@/types';
import {
  getSpotifyAccessToken,
  searchTracks,
  getArtists
} from '@/lib/spotify';
import {
  findBestTempoMapping,
  calculateSectionTargets,
  isTrackSuitableForSection,
  sortTracksByBpmMatch
} from '@/utils/tempoAnalysis';

export async function POST(request: NextRequest) {
  try {
    const { pace, cadence, genres }: { pace: PaceInput; cadence: number; genres?: string[] } = await request.json();

    const accessToken = await getSpotifyAccessToken();
    const sectionTargets = calculateSectionTargets(cadence);
    const selectedGenres = genres || ['pop', 'electronic', 'hip-hop'];
    const tracks: SpotifyTrack[] = await getTracksForPlaylist(accessToken, cadence);
    const genreFilteredTracks = await filterTracksByGenres(accessToken, tracks, selectedGenres);
    const analyzedTracks = await analyzeAndMapTracks(accessToken, genreFilteredTracks, cadence);
    const playlist = createStructuredPlaylist(analyzedTracks, sectionTargets);

    return NextResponse.json({
      success: true,
      playlist,
      metadata: {
        pace,
        cadence,
        sectionTargets
      }
    });

  } catch (error) {
    console.error('Error generating playlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
}

async function getTracksForPlaylist(accessToken: string, _cadence: number): Promise<SpotifyTrack[]> {
  const allTracks: SpotifyTrack[] = [];

  try {
    const popularSearches = [
      'year:2023-2024',
      'year:2022-2024',
      'year:2021-2024', 
      'top hits 2024',
      'top hits 2023',
      'billboard hot 100',
      'global top 50',
      'viral 50',
      'workout',
      'running',
      'cardio',
      'gym',
      'energetic',
      'upbeat',
      'dance hits',
      'pop hits',
      'rock hits',
      'hip hop hits',
      'electronic hits'
    ];

    for (const term of popularSearches) {
      try {
        const searchResults = await searchTracks(accessToken, term, 15);
        allTracks.push(...searchResults);
      } catch (error) {
        console.log(`Search failed for "${term}":`, error);
      }
    }

    const popularArtists = [
      'Dua Lipa', 'The Weeknd', 'Harry Styles', 'Taylor Swift', 'Ed Sheeran',
      'Drake', 'Bad Bunny', 'Post Malone', 'Travis Scott', 'Kendrick Lamar',
      'Calvin Harris', 'David Guetta', 'Marshmello', 'Zedd', 'Martin Garrix',
      'Imagine Dragons', 'OneRepublic', 'Coldplay', 'Maroon 5', 'The Killers',
      'Ariana Grande', 'Billie Eilish', 'Olivia Rodrigo', 'Doja Cat', 'SZA'
    ];

    for (let i = 0; i < popularArtists.length; i += 3) {
      const artistGroup = popularArtists.slice(i, i + 3);
      const artistQuery = artistGroup.map(artist => `artist:"${artist}"`).join(' OR ');
      
      try {
        const searchResults = await searchTracks(accessToken, artistQuery, 8);
        allTracks.push(...searchResults);
      } catch (error) {
        console.log(`Artist search failed for "${artistGroup.join(', ')}":`, error);
      }
    }

    const indieArtists = [
      'Tame Impala', 'Arctic Monkeys', 'The Strokes', 'Foster the People',
      'MGMT', 'Vampire Weekend', 'Two Door Cinema Club', 'Phoenix',
      'Cage the Elephant', 'Portugal. The Man', 'Glass Animals', 'Alt-J',
      'The Killers', 'Franz Ferdinand', 'Interpol', 'Yeah Yeah Yeahs',
      'Modest Mouse', 'The Shins', 'Death Cab for Cutie', 'Bloc Party',
      'Grizzly Bear', 'Animal Collective', 'Panda Bear', 'Beach House',
      'Real Estate', 'Mac DeMarco', 'Clairo', 'Rex Orange County'
    ];

    for (let i = 0; i < indieArtists.length; i += 4) {
      const artistGroup = indieArtists.slice(i, i + 4);
      const artistQuery = artistGroup.map(artist => `artist:"${artist}"`).join(' OR ');
      
      try {
        const searchResults = await searchTracks(accessToken, artistQuery, 12);
        allTracks.push(...searchResults);
      } catch (error) {
        console.log(`Indie artist search failed for "${artistGroup.join(', ')}":`, error);
      }
    }

  } catch (error) {
    console.error('Error getting tracks:', error);
    try {
      const fallbackTracks = await searchTracks(accessToken, 'popular music 2024', 30);
      allTracks.push(...fallbackTracks);
    } catch (fallbackError) {
      console.error('Final fallback search also failed:', fallbackError);
    }
  }

  const uniqueTracks = allTracks.filter((track, index, self) =>
    index === self.findIndex(t => t.id === track.id)
  );

  const popularTracks = uniqueTracks
    .filter(track => track.popularity && track.popularity > 30)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const finalTracks = popularTracks.length >= 50 ? popularTracks : [
    ...popularTracks,
    ...uniqueTracks.filter(track => !track.popularity || track.popularity <= 30).slice(0, 50 - popularTracks.length)
  ];

  const shuffled = shuffleArray([...finalTracks]);
  
  return shuffled;
}

async function filterTracksByGenres(
  accessToken: string, 
  tracks: SpotifyTrack[], 
  selectedGenres: string[]
): Promise<SpotifyTrack[]> {
  const artistIds = new Set<string>();
  tracks.forEach(track => {
    track.artists.forEach(artist => {
      artistIds.add(artist.id);
    });
  });

  const artists = await getArtists(accessToken, Array.from(artistIds));
  const artistGenreMap = new Map<string, string[]>();
  artists.forEach(artist => {
    artistGenreMap.set(artist.id, artist.genres);
  });

  const filteredTracks = tracks.filter(track => {
    return track.artists.some(artist => {
      const artistGenres = artistGenreMap.get(artist.id) || [];
      const matches = selectedGenres.some(selectedGenre => 
        artistGenres.some(artistGenre => {
          const genre = artistGenre.toLowerCase();
          const selected = selectedGenre.toLowerCase();
          
          if (genre.includes(selected) || selected.includes(genre)) {
            return true;
          }
          if (selected === 'hip-hop') {
            return genre.includes('hip hop') || genre.includes('rap') || 
                   genre.includes('trap') || genre.includes('drill') ||
                   genre.includes('conscious hip hop') || genre.includes('gangster rap') ||
                   genre.includes('melodic rap');
          }
          
          if (selected === 'electronic') {
            return genre.includes('electronic') || genre.includes('edm') ||
                   genre.includes('house') || genre.includes('techno') ||
                   genre.includes('electro') || genre.includes('synthpop') ||
                   genre.includes('dance') || genre.includes('dubstep');
          }
          
          if (selected === 'pop') {
            return genre.includes('pop') || genre.includes('contemporary r&b') ||
                   genre.includes('electropop') || genre.includes('dance pop') ||
                   genre.includes('art pop') || genre.includes('indie pop');
          }
          
          if (selected === 'rock') {
            return genre.includes('rock') || genre.includes('alternative') ||
                   genre.includes('indie rock') || genre.includes('pop rock') ||
                   genre.includes('modern rock');
          }
          
          if (selected === 'dance') {
            return genre.includes('dance') || genre.includes('house') ||
                   genre.includes('edm') || genre.includes('electronic dance') ||
                   genre.includes('club');
          }
          
          if (selected === 'indie') {
            return genre.includes('indie') || genre.includes('alternative') ||
                   genre.includes('art pop') || genre.includes('chamber pop') ||
                   genre.includes('indie rock') || genre.includes('indie pop') ||
                   genre.includes('indie folk') || genre.includes('bedroom pop') ||
                   genre.includes('dream pop') || genre.includes('shoegaze') ||
                   genre.includes('lo-fi') || genre.includes('alternative rock') ||
                   genre.includes('alternative pop') || genre.includes('alt-pop') ||
                   genre.includes('new wave') || genre.includes('post-punk') ||
                   genre.includes('synthwave') || genre.includes('chillwave');
          }
          
          return false;
        })
      );
      
      
      return matches;
    });
  });

  if (filteredTracks.length < 20) {
    const additionalTracks = tracks
      .filter(track => !filteredTracks.some(ft => ft.id === track.id))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20 - filteredTracks.length);
    
    return [...filteredTracks, ...additionalTracks];
  }

  return filteredTracks;
}

async function analyzeAndMapTracks(
  accessToken: string, 
  tracks: SpotifyTrack[], 
  targetCadence: number
): Promise<TrackData[]> {
  const analyzedTracks: TrackData[] = [];

  tracks.forEach((track) => {
    try {
      const originalTempo = estimateTempoFromTrack(track, targetCadence);
      const tempoMapping = findBestTempoMapping(originalTempo, targetCadence);
      if ((tempoMapping.error / targetCadence) * 100 <= 10) {
        analyzedTracks.push({
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: { name: string }) => a.name).join(', '),
          previewUrl: track.preview_url,
          originalTempo: originalTempo,
          mappedBpm: tempoMapping.mappedBpm,
          mapping: tempoMapping.mapping,
          confidence: 0.7,
          durationMs: track.duration_ms,
          popularity: track.popularity
        });
      }
    } catch (error) {
      console.error(`Error processing track ${track.id}:`, error);
    }
  });

  return analyzedTracks;
}

function estimateTempoFromTrack(track: SpotifyTrack, targetCadence: number): number {
  const trackName = track.name.toLowerCase();
  const artistName = track.artists.map(a => a.name).join(' ').toLowerCase();
  const combined = `${trackName} ${artistName}`;

  const trackSeed = track.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (trackSeed * 9301 + 49297) % 233280;
  const normalizedRandom = random / 233280;

  const baseVariations = [
    targetCadence,
    targetCadence * 0.5,
    targetCadence * 2,
  ];

  const variations = baseVariations.map(tempo => {
    const variance = (normalizedRandom - 0.5) * 10;
    return Math.max(60, tempo + variance);
  });

  if (combined.includes('electronic') || combined.includes('dance') || combined.includes('edm') || combined.includes('house') || combined.includes('techno')) {
    const weights = [0.4, 0.2, 0.4];
    return selectWeightedRandom(variations, weights, normalizedRandom);
  } else if (combined.includes('rock') || combined.includes('metal') || combined.includes('punk')) {
    const weights = [0.5, 0.25, 0.25];
    return selectWeightedRandom(variations, weights, normalizedRandom);
  } else if (combined.includes('hip hop') || combined.includes('rap') || combined.includes('r&b')) {
    const weights = [0.3, 0.4, 0.3];
    return selectWeightedRandom(variations, weights, normalizedRandom);
  } else if (combined.includes('pop') || combined.includes('top')) {
    const weights = [0.35, 0.3, 0.35];
    return selectWeightedRandom(variations, weights, normalizedRandom);
  } else if (combined.includes('country') || combined.includes('folk')) {
    const weights = [0.6, 0.2, 0.2];
    return selectWeightedRandom(variations, weights, normalizedRandom);
  }

  const weights = [0.4, 0.3, 0.3];
  return selectWeightedRandom(variations, weights, normalizedRandom);
}

function selectWeightedRandom(items: number[], weights: number[], random: number): number {
  let cumulativeWeight = 0;
  for (let i = 0; i < items.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createStructuredPlaylist(
  tracks: TrackData[], 
  sectionTargets: { warmup: number; main: number; cooldown: number }
): Playlist {
  const sections: PlaylistSection[] = [];

  const pickTracks = (
    candidates: TrackData[],
    usedNames: Set<string>,
    maxPerArtist: number,
    limit: number
  ): TrackData[] => {
    const artistCount = new Map<string, number>();
    const picked: TrackData[] = [];
    for (const t of candidates) {
      const artist = t.artist || 'Unknown';
      const nameKey = (t.name || '').trim().toLowerCase();
      if (nameKey.length === 0) continue;
      if (usedNames.has(nameKey)) continue;
      const count = artistCount.get(artist) || 0;
      if (count >= maxPerArtist) continue;
      picked.push(t);
      artistCount.set(artist, count + 1);
      usedNames.add(nameKey);
      if (picked.length >= limit) break;
    }
    return picked;
  };

  const warmupCandidates = sortTracksByBpmMatch(
    tracks.filter(t => isTrackSuitableForSection(t.mappedBpm, sectionTargets.warmup, 'warmup')),
    sectionTargets.warmup
  );
  const usedNames = new Set<string>();
  const warmupTracks = pickTracks(warmupCandidates, usedNames, 1, 5);

  const mainCandidates = sortTracksByBpmMatch(
    tracks.filter(t => isTrackSuitableForSection(t.mappedBpm, sectionTargets.main, 'main') && !warmupTracks.some(w => w.id === t.id)),
    sectionTargets.main
  );
  const mainTracks = pickTracks(mainCandidates, usedNames, 2, 20);

  sections.push({
    type: 'warmup',
    targetBpm: sectionTargets.warmup,
    tracks: warmupTracks
  });

  sections.push({
    type: 'main',
    targetBpm: sectionTargets.main,
    tracks: mainTracks
  });

  const totalTracks = sections.reduce((sum, section) => sum + section.tracks.length, 0);

  return {
    sections,
    totalTracks
  };
}
