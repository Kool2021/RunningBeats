export interface PaceInput {
  minutes: number;
  seconds: number;
  unit: 'km' | 'mi';
}

export interface TrackData {
  id: string;
  name: string;
  artist: string;
  previewUrl: string | null;
  originalTempo: number;
  mappedBpm: number;
  mapping: 'half' | 'normal' | 'double';
  confidence: number;
  durationMs: number;
  popularity?: number;
}

export interface PlaylistSection {
  type: 'warmup' | 'main' | 'cooldown';
  targetBpm: number;
  tracks: TrackData[];
}

export interface Playlist {
  sections: PlaylistSection[];
  totalTracks: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  preview_url: string | null;
  duration_ms: number;
  popularity?: number;
  audio_features?: {
    tempo: number;
    time_signature: number;
  };
}

export interface SpotifyAudioAnalysis {
  sections: Array<{
    start: number;
    duration: number;
    confidence: number;
    tempo: number;
    tempo_confidence: number;
  }>;
}

