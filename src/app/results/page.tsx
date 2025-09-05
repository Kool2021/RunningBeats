'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PaceInput, Playlist, TrackData } from '@/types';
import { formatPace } from '@/utils/paceUtils';

function ResultsContent() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pace, setPace] = useState<PaceInput | null>(null);
  const [cadence, setCadence] = useState<number>(0);
  const [syncingToSpotify, setSyncingToSpotify] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const generatePlaylist = async () => {
      try {
        const paceParam = searchParams.get('pace');
        const cadenceParam = searchParams.get('cadence');
        const genresParam = searchParams.get('genres');

        if (!paceParam || !cadenceParam) {
          router.push('/');
          return;
        }

        const parsedPace = JSON.parse(paceParam) as PaceInput;
        const parsedCadence = parseInt(cadenceParam);
        const parsedGenres = genresParam ? JSON.parse(genresParam) : ['pop', 'electronic', 'hip-hop'];

        setPace(parsedPace);
        setCadence(parsedCadence);

        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pace: parsedPace,
            cadence: parsedCadence,
            genres: parsedGenres,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate playlist');
        }

        const data = await response.json();
        setPlaylist(data.playlist);
      } catch (err) {
        setError('Failed to generate playlist. Please try again.');
        console.error('Error generating playlist:', err);
      } finally {
        setLoading(false);
      }
    };

    generatePlaylist();
  }, [searchParams, router]);

  const handleSyncToSpotify = async () => {
    if (!playlist || !playlist.sections) {
      console.error('No playlist data available');
      return;
    }

    // Safely collect all tracks
    const allTracks = playlist.sections
      .filter(section => section && section.tracks)
      .flatMap(section => section.tracks)
      .filter(track => track && track.id);

    if (allTracks.length === 0) {
      alert('No tracks available to sync');
      return;
    }

    setSyncingToSpotify(true);
    try {
      // First, check if user is authenticated
      const authResponse = await fetch('/api/spotify/auth');
      
      if (!authResponse.ok) {
        // Redirect to Spotify OAuth
        window.location.href = '/api/spotify/login';
        return;
      }

      // Create playlist
      const createResponse = await fetch('/api/spotify/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Running Playlist - ${pace ? formatPace(pace) : 'Custom'} @ ${cadence} SPM`,
          tracks: allTracks,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create playlist');
      }

      const result = await createResponse.json();
      alert(`Playlist "${result.name}" created successfully in your Spotify account!`);
    } catch (err) {
      alert('Failed to sync to Spotify. Please try again.');
      console.error('Spotify sync error:', err);
    } finally {
      setSyncingToSpotify(false);
    }
  };

  const getTempoDisplayInfo = (track: TrackData) => {
    switch (track.mapping) {
      case 'half':
        return { label: '0.5×', color: 'text-blue-600 dark:text-blue-400' };
      case 'double':
        return { label: '2×', color: 'text-red-600 dark:text-red-400' };
      default:
        return { label: '1×', color: 'text-green-600 dark:text-green-400' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Generating Your Perfect Playlist
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Analyzing tracks and matching tempos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!playlist || !pace) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900">
      <nav className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Generator</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">RunBeats</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative">
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                Your running soundtrack
              </h1>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-3 border border-gray-200 dark:border-gray-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatPace(pace)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Running Pace
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-3 border border-gray-200 dark:border-gray-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {cadence} SPM
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Target Cadence
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-3 border border-gray-200 dark:border-gray-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {playlist.totalTracks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Matched Tracks
                  </div>
                </div>
              </div>

              <button
                onClick={handleSyncToSpotify}
                disabled={syncingToSpotify}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {syncingToSpotify ? (
                  <div className="flex items-center justify-center relative z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span className="text-base">Saving to Spotify…</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center relative z-10">
                    <span className="text-base">Save to Spotify</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="space-y-8">
            {playlist.sections.filter(section => section.type !== 'cooldown').map((section, sectionIndex) => {
              const sectionConfig = {
                warmup: {
                  title: 'Warm-Up Phase',
                  icon: '🔥',
                  gradient: 'from-orange-500 to-yellow-500',
                  bgGradient: 'from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10',
                  borderColor: 'border-orange-200/50 dark:border-orange-800/30'
                },
                main: {
                  title: 'Main Workout',
                  icon: '⚡',
                  gradient: 'from-red-500 to-pink-500',
                  bgGradient: 'from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10',
                  borderColor: 'border-red-200/50 dark:border-red-800/30'
                },
                cooldown: {
                  title: 'Cool-Down Phase',
                  icon: '🧘‍♂️',
                  gradient: 'from-blue-500 to-indigo-500',
                  bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10',
                  borderColor: 'border-blue-200/50 dark:border-blue-800/30'
                }
              }[section.type];

              return (
                <div key={sectionIndex} className="group relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${sectionConfig.bgGradient} rounded-3xl transform group-hover:scale-[1.01] transition-transform duration-300`}></div>
                  <div className={`relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-xl border ${sectionConfig.borderColor} overflow-hidden`}>
                    <div className={`bg-gradient-to-r ${sectionConfig.gradient} text-white p-6`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{sectionConfig.icon}</div>
                          <div>
                            <h2 className="text-2xl font-bold">
                              {sectionConfig.title}
                            </h2>
                            <p className="text-white/80 text-sm">
                              Target: {section.targetBpm} BPM • {section.tracks.length} tracks
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/60">SECTION {sectionIndex + 1}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      {section.tracks.map((track, trackIndex) => {
                        const tempoInfo = getTempoDisplayInfo(track);
                        return (
                          <div key={track.id} className="group/track p-6 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">
                                  {trackIndex + 1}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                                    {track.name}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400 truncate">
                                    {track.artist}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-6 ml-4">
                                <div className="text-right">
                                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(track.mappedBpm)}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    BPM
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    tempoInfo.label === '1×' 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                      : tempoInfo.label === '0.5×'
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                  }`}>
                                    {tempoInfo.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {Math.round(track.originalTempo)} orig
                                  </div>
                                </div>
                                
                                {track.previewUrl && (
                                  <div className="flex-shrink-0">
                                    <audio
                                      controls
                                      className="w-40 h-8"
                                      preload="none"
                                      style={{
                                        filter: 'sepia(1) hue-rotate(200deg) saturate(0.8)',
                                      }}
                                    >
                                      <source src={track.previewUrl} type="audio/mpeg" />
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading...</h2>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
