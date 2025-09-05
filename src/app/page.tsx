'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaceInput } from '@/types';
import { paceToSuggestedCadence, formatPace, parsePaceString, isValidPace } from '@/utils/paceUtils';

export default function Home() {
  const [pace, setPace] = useState<PaceInput>({ minutes: 7, seconds: 30, unit: 'mi' });
  const [cadence, setCadence] = useState<number>(175);
  const [isLoading, setIsLoading] = useState(false);
  const [paceInput, setPaceInput] = useState('7:30');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['pop', 'electronic', 'hip-hop']);
  const router = useRouter();

  const handlePaceChange = (value: string) => {
    setPaceInput(value);
    const parsed = parsePaceString(value);
    if (parsed) {
      const newPace = { ...parsed, unit: pace.unit };
      setPace(newPace);
      setCadence(paceToSuggestedCadence(newPace));
    }
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleGeneratePlaylist = async () => {
    if (!isValidPace(pace)) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pace: JSON.stringify(pace),
        cadence: cadence.toString(),
        genres: JSON.stringify(selectedGenres)
      });
      router.push(`/results?${params.toString()}`);
    } catch (error) {
      console.error('Error generating playlist:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900">
      <nav className="relative z-10 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/40 dark:border-gray-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">RunBeats</span>
            </div>
            <div className="flex items-center space-x-4"></div>
          </div>
        </div>
      </nav>

      <div className="relative">
        <div className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                Make a playlist for your run
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Enter your pace. We suggest a cadence and find songs that fit.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-8 lg:p-10">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Enter your details</h2>
                      <p className="text-gray-600 dark:text-gray-400">Pace in minutes per mile. Adjust the cadence if you like.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3 block">
                          Running Pace
                        </span>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={paceInput}
                              onChange={(e) => handlePaceChange(e.target.value)}
                              placeholder="7:30"
                              className="w-full px-6 py-4 text-2xl font-bold text-center border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800/50 dark:text-white transition-all duration-200"
                            />
                          </div>
                          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                            <div className="px-4 py-3 rounded-md text-sm font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              min/mi
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                          Format: MM:SS (e.g., 7:30)
                        </p>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 block">
                          Target Cadence
                        </span>
                        <div className="rounded-2xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                          <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                              {cadence}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              Steps Per Minute
                            </div>
                          </div>
                          
                          <div className="relative px-2">
                            <input
                              type="range"
                              min="165"
                              max="180"
                              value={cadence}
                              onChange={(e) => setCadence(parseInt(e.target.value))}
                              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider relative z-10"
                              style={{
                                background: `linear-gradient(to right, #f97316 0%, #f97316 ${((cadence - 165) / 15) * 100}%, #e5e7eb ${((cadence - 165) / 15) * 100}%, #e5e7eb 100%)`
                              }}
                            />
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-3 px-1">
                              <span className="font-medium">165</span>
                              <span className="font-medium">180</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">Suggested from your pace</p>
                        </div>
                      </label>
                    </div>

                    <div className="rounded-2xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                        Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {formatPace(pace)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Running Pace
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                            {cadence} SPM
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Target Cadence
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 block">
                          Preferred Genres
                        </span>
                        <div className="rounded-2xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'pop', label: 'Pop', icon: '🎵' },
                              { id: 'electronic', label: 'Electronic', icon: '🎛️' },
                              { id: 'hip-hop', label: 'Hip-Hop', icon: '🎤' },
                              { id: 'rock', label: 'Rock', icon: '🎸' },
                              { id: 'dance', label: 'Dance', icon: '💃' },
                              { id: 'indie', label: 'Indie', icon: '🎭' }
                            ].map((genre) => (
                              <button
                                key={genre.id}
                                type="button"
                                onClick={() => handleGenreToggle(genre.id)}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                  selectedGenres.includes(genre.id)
                                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="text-2xl mb-1">{genre.icon}</div>
                                  <div className="text-sm font-medium">{genre.label}</div>
                                </div>
                                {selectedGenres.includes(genre.id) && (
                                  <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">Pick a few you like</p>
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={handleGeneratePlaylist}
                      disabled={!isValidPace(pace) || isLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center relative z-10">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          <span className="text-base">Finding songs…</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center relative z-10">
                          <span className="text-base">Create playlist</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
