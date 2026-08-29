export const featureFlags = {
  explorerMode: true,
  birdAudio: false,
  cloudVerification: false,
  familyProfiles: false,
  travelCollections: false,
  socialSharing: false,
  expertVerification: false,
  premiumCollections: false,
} as const;

export const isDevToolsEnabled = typeof __DEV__ !== 'undefined' && __DEV__;
