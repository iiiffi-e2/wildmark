# Wildmark Vertical Slice Design

Date: 2026-08-29

## Intent

Build the first complete Wildmark loop from the master product prompt:

**Discover → Scan → Identify → New Wildmark / Another Sighting → Collection → Journal**

The slice must already look like Wildmark: field-instrument + field-journal, not a generic Expo starter. Identification is an enabling technology. Discovery is the product.

## Scope

In:

- Expo SDK 57, TypeScript strict, Expo Router tabs
- Design tokens and branded components
- Local-first SQLite with migrations and seed taxa
- Domain types for Observation, Taxon, Identification, Wildmark, Collection, Quest
- Discovery transaction that distinguishes New Wildmark vs Another Sighting
- MockIdentificationEngine covering high-confidence, ambiguous, higher-rank, failed, unsupported
- CloudIdentificationEngine interface for iNaturalist computer vision when a token is configured
- Camera + gallery import + durable local photo records
- Around You / Explorer Mode / quests with fixture data
- Settings/privacy and a development-only debug panel
- Durable sync queue with a local-only adapter (no secrets)

Out of this slice:

- Social, messaging, AR, marketplace, family profiles
- Full Supabase production backend
- Claiming edibility or handling safety from an image

## Architecture

Layers:

1. Presentation (`app/`, `src/features/`, `src/design-system/`)
2. Application (`src/domain/discovery`, quest evaluation)
3. Domain types and pure rules
4. Data repositories (memory for tests, SQLite for the app)
5. Platform services (camera, identification, occurrence, analytics, sync)

UI never imports a backend client. Identification engines are swappable behind `IdentificationEngine`.

## Success tests

1. First Northern Cardinal → one New Wildmark, collection + journal persist across restart
2. Second Cardinal → Another Sighting, `observation_count = 2`, no duplicate unlock
3. Swallowtail 51/37 → uncertain UI, no forced species
4. Failed identification → photo and unidentified observation remain
