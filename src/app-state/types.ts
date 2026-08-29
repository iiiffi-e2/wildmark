export type ExperienceMode = 'standard' | 'explorer';
export type LocationMode = 'none' | 'approximate' | 'precise';
export type AppearanceMode = 'system' | 'light' | 'dark';

export type User = {
  id: string;
  remoteId: string | null;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  experienceMode: ExperienceMode;
  locationMode: LocationMode;
  onboardingCompleted: boolean;
  appearance: AppearanceMode;
  soundEnabled: boolean;
  favoriteTaxonId: string | null;
};
