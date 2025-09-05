import { PaceInput } from '@/types';

export function paceToSuggestedCadence(pace: PaceInput): number {
  const totalMinutes = pace.minutes + pace.seconds / 60;
  const pacePerKm = pace.unit === 'mi' ? totalMinutes / 1.60934 : totalMinutes;
  
  if (pacePerKm <= 3.5) return 180;
  if (pacePerKm <= 4.0) return 178;
  if (pacePerKm <= 4.5) return 176;
  if (pacePerKm <= 5.0) return 174;
  if (pacePerKm <= 5.5) return 172;
  if (pacePerKm <= 6.0) return 170;
  if (pacePerKm <= 7.0) return 168;
  return 165;
}

export function formatPace(pace: PaceInput): string {
  const mins = Math.floor(pace.minutes);
  const secs = Math.floor(pace.seconds);
  return `${mins}:${secs.toString().padStart(2, '0')} min/${pace.unit}`;
}

export function parsePaceString(paceStr: string): { minutes: number; seconds: number } | null {
  const match = paceStr.match(/^(\d+):([0-5]\d)$/);
  if (!match) return null;
  
  return {
    minutes: parseInt(match[1], 10),
    seconds: parseInt(match[2], 10)
  };
}

export function isValidPace(pace: PaceInput): boolean {
  return pace.minutes >= 0 && 
         pace.seconds >= 0 && 
         pace.seconds < 60 && 
         (pace.minutes > 0 || pace.seconds > 0);
}

