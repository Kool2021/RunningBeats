import { SpotifyAudioAnalysis, TrackData } from '@/types';

export function calculateMedianTempo(analysis: SpotifyAudioAnalysis): number {
  const highConfidenceSections = analysis.sections.filter(
    section => section.confidence >= 0.7 && section.tempo_confidence >= 0.7
  );

  if (highConfidenceSections.length === 0) {
    const allSections = analysis.sections.filter(section => section.tempo > 0);
    if (allSections.length === 0) return 0;
    return calculateWeightedMedian(allSections);
  }

  return calculateWeightedMedian(highConfidenceSections);
}

function calculateWeightedMedian(sections: Array<{ duration: number; tempo: number }>): number {
  if (sections.length === 0) return 0;
  if (sections.length === 1) return sections[0].tempo;

  const weightedTempos: number[] = [];
  
  sections.forEach(section => {
    const weight = Math.max(1, Math.round(section.duration * 10));
    for (let i = 0; i < weight; i++) {
      weightedTempos.push(section.tempo);
    }
  });

  weightedTempos.sort((a, b) => a - b);
  const mid = Math.floor(weightedTempos.length / 2);
  
  if (weightedTempos.length % 2 === 0) {
    return (weightedTempos[mid - 1] + weightedTempos[mid]) / 2;
  } else {
    return weightedTempos[mid];
  }
}

export function findBestTempoMapping(originalTempo: number, targetCadence: number): {
  mappedBpm: number;
  mapping: 'half' | 'normal' | 'double';
  error: number;
} {
  const multipliers = [
    { multiplier: 0.5, mapping: 'half' as const },
    { multiplier: 1, mapping: 'normal' as const },
    { multiplier: 2, mapping: 'double' as const }
  ];

  let bestMatch: {
    mappedBpm: number;
    mapping: 'half' | 'normal' | 'double';
    error: number;
  } = {
    mappedBpm: originalTempo,
    mapping: 'normal',
    error: Math.abs(originalTempo - targetCadence)
  };

  multipliers.forEach(({ multiplier, mapping }) => {
    const mappedTempo = originalTempo * multiplier;
    const error = Math.abs(mappedTempo - targetCadence);
    const errorPercentage = (error / targetCadence) * 100;

    if (errorPercentage <= 3 && error < bestMatch.error) {
      bestMatch = {
        mappedBpm: mappedTempo,
        mapping,
        error
      };
    }
  });

  return bestMatch;
}

export function calculateSectionTargets(baseCadence: number): {
  warmup: number;
  main: number;
  cooldown: number;
} {
  return {
    warmup: Math.round(baseCadence - 5),
    main: baseCadence,
    cooldown: Math.round(baseCadence * 0.9)
  };
}

export function isTrackSuitableForSection(
  mappedBpm: number, 
  targetBpm: number, 
  sectionType: 'warmup' | 'main' | 'cooldown'
): boolean {
  let tolerance: number;
  
  switch (sectionType) {
    case 'main':
      tolerance = targetBpm * 0.02;
      break;
    case 'warmup':
      tolerance = targetBpm * 0.05;
      break;
    case 'cooldown':
      tolerance = targetBpm * 0.08;
      break;
  }

  return Math.abs(mappedBpm - targetBpm) <= tolerance;
}

export function sortTracksByBpmMatch(tracks: TrackData[], targetBpm: number): TrackData[] {
  return tracks
    .map(track => {
      const bpmError = Math.abs(track.mappedBpm - targetBpm);
      const popularity = typeof track.popularity === 'number' ? track.popularity : 0;
      const popularityScore = popularity / 100;
      const maxAcceptableError = Math.max(1, targetBpm * 0.08);
      const bpmScore = Math.max(0, 1 - bpmError / maxAcceptableError);
      const score = 0.7 * bpmScore + 0.3 * popularityScore;
      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ track }) => track);
}
