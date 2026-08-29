# Wildmark

**Discover what’s around you.**

Wildmark is a local-first field instrument for noticing living organisms, marking first discoveries, and keeping every encounter in a Field Journal.

## First vertical slice

Discover → Scan → Identify → New Wildmark / Another Sighting → Collection → Journal

The loop uses an on-device mock classifier and a hybrid engine. A `CloudIdentificationEngine` is implemented against iNaturalist computer vision and activates only when `EXPO_PUBLIC_INATURALIST_TOKEN` is set.

Collection is the game: New Wildmark reveals progress, mystery slots show what is still missing, and Home offers one more reason to look.

## Stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript strict
- Expo Router tabs
- Local persistence: durable store on web, `expo-sqlite` on native
- Domain layer for Observation, Taxon, Identification, Wildmark, Collection, Quest

## Scripts

```bash
npm start
npm run web
npm run test:ci
npm run typecheck
npm run lint
```

On Discover, long-press the greeting (development builds only) to open the hidden debug panel.

## Product rules

- First sighting of a taxon is a New Wildmark
- A later sighting is Another Sighting
- Uncertain results are never forced into a species
- A failed identification keeps the photograph
- Wildmark never says a wild organism is safe to eat or handle
