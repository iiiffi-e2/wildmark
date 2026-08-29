import type { LocationMode } from '@/src/app-state/types';

export type PrivacySafePoint = {
  latitude: number;
  longitude: number;
};

export function privacySafeLocality(
  label: string | null | undefined,
  mode: LocationMode,
): string | null {
  if (mode === 'none' || !label) {
    return null;
  }
  return label;
}

export function privacySafeCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  mode: LocationMode,
): PrivacySafePoint | null {
  if (mode === 'none' || latitude == null || longitude == null) {
    return null;
  }
  if (mode === 'approximate') {
    return {
      latitude: Math.round(latitude * 20) / 20,
      longitude: Math.round(longitude * 20) / 20,
    };
  }
  return {
    latitude: Math.round(latitude * 50) / 50,
    longitude: Math.round(longitude * 50) / 50,
  };
}

export function shouldExposeExactWildlifeLocation(): boolean {
  return false;
}
