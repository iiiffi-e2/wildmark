import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { openPersistence, type AppPersistence } from '@/src/data/database/client';
import { SEED_TAXA, TAXON_SAFETY } from '@/src/data/seed';
import {
  correctObservationIdentification,
  recordAcceptedIdentification,
  recordUnidentifiedObservation,
  type DiscoveryDependencies,
} from '@/src/domain/discovery/record-discovery';
import type { DiscoveryResult } from '@/src/domain/discovery/types';
import type { IdentificationResult } from '@/src/domain/identification/types';
import type { Collection, CollectionProgressDelta } from '@/src/domain/collections/types';
import type { Observation, ObservationPhoto, UserTaxon } from '@/src/domain/observations/types';
import type { Quest, UserQuestProgress } from '@/src/domain/quests/types';
import type { Taxon } from '@/src/domain/taxa/types';
import { revealMystery } from '@/src/domain/taxa/mystery';
import { MockIdentificationEngine } from '@/src/services/identification/mock-engine';
import {
  IDENTIFICATION_FIXTURE_IDS,
  type IdentificationFixtureId,
} from '@/src/services/identification/fixtures';
import { CloudIdentificationEngine } from '@/src/services/identification/cloud-engine';
import { MockOccurrenceService, type OccurrenceResult } from '@/src/services/occurrence/mock';
import { analytics } from '@/src/services/analytics/service';
import { ThemeContext, createTheme, type Theme } from '@/src/design-system/theme';
import type { AppearanceMode, User } from './types';

export type IdentifyOutcome =
  | { status: 'identified'; result: Extract<IdentificationResult, { kind: 'highConfidence' }>; discovery: DiscoveryResult }
  | { status: 'ambiguous'; result: Extract<IdentificationResult, { kind: 'candidate' }>; image: CapturedDraft }
  | { status: 'higherRank'; result: Extract<IdentificationResult, { kind: 'higherRank' }>; observationId: string }
  | { status: 'failed'; result: Extract<IdentificationResult, { kind: 'failed' }>; observationId: string }
  | { status: 'unsupported'; result: Extract<IdentificationResult, { kind: 'unsupported' }>; observationId: string };

export type CapturedDraft = {
  localUri: string;
  width: number;
  height: number;
  capturedAt: string;
};

type ExplorerSession = {
  sessionId: string;
  taxonId: string;
};

type WildmarkContextValue = {
  ready: boolean;
  user: User;
  theme: Theme;
  taxa: Taxon[];
  observations: Observation[];
  photosByObservation: Record<string, ObservationPhoto[]>;
  userTaxa: UserTaxon[];
  collections: Collection[];
  collectionProgress: CollectionProgressDelta[];
  quests: Quest[];
  questProgress: UserQuestProgress[];
  nearby: OccurrenceResult[];
  selectedFixture: IdentificationFixtureId;
  offline: boolean;
  persistenceKind: 'sqlite' | 'memory';
  setFixture: (id: IdentificationFixtureId) => void;
  setOffline: (value: boolean) => void;
  completeOnboarding: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  captureAndIdentify: (image: CapturedDraft) => Promise<IdentifyOutcome>;
  acceptCandidate: (image: CapturedDraft, taxonId: string, confidence: number) => Promise<DiscoveryResult>;
  saveUnconfirmed: (image: CapturedDraft, result: Extract<IdentificationResult, { kind: 'candidate' }>) => Promise<string>;
  correctObservation: (observationId: string, taxonId: string) => Promise<DiscoveryResult>;
  taxonById: (id: string) => Taxon | undefined;
  observationById: (id: string) => Observation | undefined;
  safetyFor: (taxonId: string) => string[];
  startExplorerSession: (taxonId: string) => string;
  explorerSession: (sessionId: string) => ExplorerSession | undefined;
  inspectStore: () => unknown;
  resetLocalData: () => Promise<void>;
  fillJournal: () => Promise<void>;
  simulateDiscovery: (fixtureId: IdentificationFixtureId) => Promise<IdentifyOutcome>;
  lastOutcome: IdentifyOutcome | null;
};

const WildmarkContext = createContext<WildmarkContextValue | null>(null);

const mockEngine = new MockIdentificationEngine(0);
const cloudEngine = new CloudIdentificationEngine(process.env.EXPO_PUBLIC_INATURALIST_TOKEN);
const occurrence = new MockOccurrenceService();

function appearanceTheme(appearance: AppearanceMode, system?: string | null) {
  const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  return createTheme(scheme);
}

export function WildmarkProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [persistence, setPersistence] = useState<AppPersistence | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [photosByObservation, setPhotosByObservation] = useState<Record<string, ObservationPhoto[]>>({});
  const [userTaxa, setUserTaxa] = useState<UserTaxon[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionProgress, setCollectionProgress] = useState<CollectionProgressDelta[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questProgress, setQuestProgress] = useState<UserQuestProgress[]>([]);
  const [nearby, setNearby] = useState<OccurrenceResult[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<IdentificationFixtureId>('northern-cardinal');
  const [offline, setOffline] = useState(false);
  const [sessions, setSessions] = useState<ExplorerSession[]>([]);
  const [lastOutcome, setLastOutcome] = useState<IdentifyOutcome | null>(null);

  const refresh = useCallback(async (deps: DiscoveryDependencies, currentUser: User) => {
    const [nextTaxa, nextObservations, nextUserTaxa, nextCollections, nextQuests] = await Promise.all([
      deps.taxa.list(),
      deps.observations.list({ userId: currentUser.id }),
      deps.userTaxa.list(currentUser.id),
      deps.collections.list(),
      deps.quests.list(),
    ]);
    const photos: Record<string, ObservationPhoto[]> = {};
    for (const observation of nextObservations) {
      photos[observation.id] = await deps.photos.listForObservation(observation.id);
    }
    const progress: CollectionProgressDelta[] = [];
    const discovered = new Set(nextUserTaxa.map((item) => item.taxonId));
    for (const collection of nextCollections) {
      const ids = await deps.collections.listTaxonIds(collection.id);
      progress.push({
        collectionId: collection.id,
        collectionName: collection.name,
        discoveredCount: ids.filter((id) => discovered.has(id)).length,
        totalCount: ids.length,
        newlyCompleted: false,
      });
    }
    const questRows: UserQuestProgress[] = [];
    for (const quest of nextQuests) {
      const row = await deps.quests.getProgress(currentUser.id, quest.id);
      if (row) questRows.push(row);
    }
    const likely = await occurrence.getLikelyTaxa({ discoveredTaxonIds: [...discovered] });
    setTaxa(nextTaxa);
    setObservations(nextObservations);
    setPhotosByObservation(photos);
    setUserTaxa(nextUserTaxa);
    setCollections(nextCollections);
    setCollectionProgress(progress);
    setQuests(nextQuests);
    setQuestProgress(questRows);
    setNearby(likely);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const opened = await openPersistence();
      if (!active) return;
      setPersistence(opened);
      setUser(opened.user);
      await refresh(opened.deps, opened.user);
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const identifyWithEngine = useCallback(
    async (image: CapturedDraft): Promise<IdentificationResult> => {
      analytics.track('identification_started');
      if (!offline) {
        const cloud = await cloudEngine.getCapabilities();
        if (cloud.available) {
          const cloudResult = await cloudEngine.identify({
            imageUri: image.localUri,
            observedAt: image.capturedAt,
          });
          if (cloudResult.kind !== 'failed') {
            return cloudResult;
          }
        }
      }
      return mockEngine.identify({
        imageUri: image.localUri,
        observedAt: image.capturedAt,
        fixtureId: selectedFixture,
      });
    },
    [offline, selectedFixture],
  );

  const captureAndIdentify = useCallback(
    async (image: CapturedDraft): Promise<IdentifyOutcome> => {
      if (!persistence || !user) {
        throw new Error('Wildmark is still opening the field journal.');
      }
      analytics.track('image_captured');
      const result = await identifyWithEngine(image);
      if (result.kind === 'highConfidence') {
        const discovery = await recordAcceptedIdentification(persistence.deps, {
          userId: user.id,
          image,
          observedAt: image.capturedAt,
          selectedTaxonId: result.taxonId,
          confidence: result.confidence,
          identificationStatus: 'identified',
          identification: { engine: 'mock', modelVersion: 'fixtures-1', result },
        });
        analytics.track(discovery.isNewWildmark ? 'wildmark_discovered' : 'repeat_sighting');
        await refresh(persistence.deps, user);
        const identified = { status: 'identified' as const, result, discovery };
        setLastOutcome(identified);
        return identified;
      }
      if (result.kind === 'candidate') {
        analytics.track('identification_ambiguous');
        const ambiguous = { status: 'ambiguous' as const, result, image };
        setLastOutcome(ambiguous);
        return ambiguous;
      }
      const recorded = await recordUnidentifiedObservation(persistence.deps, {
        userId: user.id,
        image,
        observedAt: image.capturedAt,
        status: result.kind === 'failed' ? 'failed' : result.kind === 'unsupported' ? 'unsupported' : 'unidentified',
      });
      analytics.track('identification_failed');
      await refresh(persistence.deps, user);
      if (result.kind === 'higherRank') {
        const higher = { status: 'higherRank' as const, result, observationId: recorded.observationId };
        setLastOutcome(higher);
        return higher;
      }
      if (result.kind === 'unsupported') {
        const unsupported = { status: 'unsupported' as const, result, observationId: recorded.observationId };
        setLastOutcome(unsupported);
        return unsupported;
      }
      const failed = { status: 'failed' as const, result, observationId: recorded.observationId };
      setLastOutcome(failed);
      return failed;
    },
    [identifyWithEngine, persistence, refresh, user],
  );

  const acceptCandidate = useCallback(
    async (image: CapturedDraft, taxonId: string, confidence: number) => {
      if (!persistence || !user) throw new Error('Not ready');
      const result = await recordAcceptedIdentification(persistence.deps, {
        userId: user.id,
        image,
        observedAt: image.capturedAt,
        selectedTaxonId: taxonId,
        confidence,
        identificationStatus: 'identified',
        identification: {
          engine: 'mock',
          modelVersion: 'fixtures-1',
          result: {
            kind: 'highConfidence',
            taxonId,
            commonName: SEED_TAXA.find((item) => item.id === taxonId)?.commonName ?? 'Species',
            scientificName: SEED_TAXA.find((item) => item.id === taxonId)?.scientificName ?? '',
            confidence,
            trail: [],
          },
        },
      });
      await refresh(persistence.deps, user);
      return result;
    },
    [persistence, refresh, user],
  );

  const saveUnconfirmed = useCallback(
    async (image: CapturedDraft, result: Extract<IdentificationResult, { kind: 'candidate' }>) => {
      if (!persistence || !user) throw new Error('Not ready');
      const top = result.candidates[0];
      const recorded = await recordAcceptedIdentification(persistence.deps, {
        userId: user.id,
        image,
        observedAt: image.capturedAt,
        selectedTaxonId: top?.taxonId ?? 'unknown',
        confidence: top?.confidence ?? 0,
        identificationStatus: 'ambiguous',
        identification: { engine: 'mock', modelVersion: 'fixtures-1', result },
      });
      await refresh(persistence.deps, user);
      return recorded.observationId;
    },
    [persistence, refresh, user],
  );

  const correctObservation = useCallback(
    async (observationId: string, taxonId: string) => {
      if (!persistence || !user) throw new Error('Not ready');
      const result = await correctObservationIdentification(persistence.deps, {
        userId: user.id,
        observationId,
        selectedTaxonId: taxonId,
      });
      await refresh(persistence.deps, user);
      return result;
    },
    [persistence, refresh, user],
  );

  const value = useMemo<WildmarkContextValue | null>(() => {
    if (!persistence || !user) return null;
    const theme = appearanceTheme(user.appearance, systemScheme);
    return {
      ready: true,
      user,
      theme,
      taxa,
      observations,
      photosByObservation,
      userTaxa,
      collections,
      collectionProgress,
      quests,
      questProgress,
      nearby,
      selectedFixture,
      offline,
      persistenceKind: persistence.kind,
      setFixture: setSelectedFixture,
      setOffline,
      async completeOnboarding() {
        const next = await persistence.updateUser({ onboardingCompleted: true });
        setUser(next);
        analytics.track('onboarding_completed');
      },
      async updateUser(patch) {
        const next = await persistence.updateUser(patch);
        setUser(next);
      },
      captureAndIdentify,
      acceptCandidate,
      saveUnconfirmed,
      correctObservation,
      taxonById: (id) => taxa.find((item) => item.id === id),
      observationById: (id) => observations.find((item) => item.id === id),
      safetyFor: (taxonId) => TAXON_SAFETY[taxonId] ?? [],
      startExplorerSession: (taxonId) => {
        const sessionId = `look-${Math.random().toString(36).slice(2, 10)}`;
        setSessions((current) => [...current, { sessionId, taxonId }]);
        analytics.track('explorer_mode_started');
        return sessionId;
      },
      explorerSession: (sessionId) => sessions.find((item) => item.sessionId === sessionId),
      inspectStore: () => persistence.inspect(),
      async resetLocalData() {
        await persistence.clearAll();
        const next = await persistence.refreshUser();
        setUser(next);
        await refresh(persistence.deps, next);
      },
      async fillJournal() {
        for (const fixture of IDENTIFICATION_FIXTURE_IDS.slice(0, 6)) {
          if (fixture === 'blurry' || fixture === 'unsupported' || fixture === 'ambiguous-swallowtail') {
            continue;
          }
          await captureAndIdentify({
            localUri: `fixture://${fixture}`,
            width: 1200,
            height: 1600,
            capturedAt: new Date().toISOString(),
          });
          setSelectedFixture(fixture);
        }
      },
      lastOutcome,
      simulateDiscovery: (fixtureId) => {
        setSelectedFixture(fixtureId);
        return captureAndIdentify({
          localUri: `fixture://${fixtureId}`,
          width: 1200,
          height: 1600,
          capturedAt: new Date().toISOString(),
        });
      },
    };
  }, [
    acceptCandidate,
    captureAndIdentify,
    collectionProgress,
    collections,
    correctObservation,
    nearby,
    observations,
    offline,
    persistence,
    photosByObservation,
    questProgress,
    quests,
    refresh,
    saveUnconfirmed,
    selectedFixture,
    sessions,
    systemScheme,
    taxa,
    user,
    userTaxa,
    lastOutcome,
  ]);

  const fallbackTheme = appearanceTheme('system', systemScheme);
  if (!value) {
    return <ThemeContext.Provider value={fallbackTheme}>{children}</ThemeContext.Provider>;
  }

  return (
    <ThemeContext.Provider value={value.theme}>
      <WildmarkContext.Provider value={value}>{children}</WildmarkContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useWildmarkOptional(): WildmarkContextValue | null {
  return useContext(WildmarkContext);
}

export function useWildmark(): WildmarkContextValue {
  const value = useContext(WildmarkContext);
  if (!value) {
    throw new Error('useWildmark must be used inside WildmarkProvider');
  }
  return value;
}

export function mysteryForTaxon(taxon: Taxon, explorer: boolean) {
  return revealMystery(taxon, explorer ? 'basicClue' : 'silhouette');
}

export { IDENTIFICATION_FIXTURE_IDS };
