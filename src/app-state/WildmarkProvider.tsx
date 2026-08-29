import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { openPersistence, type AppPersistence } from '@/src/data/database/client';
import { SEED_COLLECTION_TAXA, SEED_TAXA, TAXON_SAFETY } from '@/src/data/seed';
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
import type { UnlockedMilestone } from '@/src/domain/milestones/types';
import { explorerRank } from '@/src/domain/milestones/evaluate';
import { getRecommendations } from '@/src/domain/progression/next-discovery';
import { monthlyRecap, categoryBreakdown } from '@/src/domain/progression/recap';
import type { MonthlyRecap, NextDiscoveryRecommendation } from '@/src/domain/progression/types';
import { CloudIdentificationEngine } from '@/src/services/identification/cloud-engine';
import { HybridIdentificationEngine } from '@/src/services/identification/hybrid-engine';
import { OnDeviceIdentificationEngine } from '@/src/services/identification/on-device-engine';
import {
  IDENTIFICATION_FIXTURE_IDS,
  type IdentificationFixtureId,
} from '@/src/services/identification/fixtures';
import { MockOccurrenceService, type OccurrenceResult } from '@/src/services/occurrence/mock';
import { persistCapturedPhoto } from '@/src/services/photos/storage';
import { feedbackLevelFor, playFeedback } from '@/src/services/feedback/service';
import { LocalOnlySyncAdapter, SyncService } from '@/src/services/sync/service';
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
  displayUri?: string;
  thumbnailUri?: string;
};

type ExplorerSession = {
  sessionId: string;
  taxonId: string;
  clueIndex: number;
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
  recommendations: NextDiscoveryRecommendation[];
  lastDiscovery: DiscoveryResult | null;
  unlockedMilestones: UnlockedMilestone[];
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
  updateObservation: (observationId: string, patch: Partial<Pick<Observation, 'notes' | 'favorite'>>) => Promise<void>;
  toggleFavoriteTaxon: (taxonId: string) => Promise<void>;
  taxonById: (id: string) => Taxon | undefined;
  observationById: (id: string) => Observation | undefined;
  safetyFor: (taxonId: string) => string[];
  collectionTaxonIds: (collectionId: string) => string[];
  startExplorerSession: (taxonId: string) => string;
  explorerSession: (sessionId: string) => ExplorerSession | undefined;
  advanceExplorerClue: (sessionId: string) => void;
  recapForCurrentMonth: () => MonthlyRecap;
  categoryCounts: { category: string; count: number }[];
  explorerRank: { id: string; name: string };
  inspectStore: () => unknown;
  resetLocalData: () => Promise<void>;
  fillJournal: () => Promise<void>;
  simulateDiscovery: (fixtureId: IdentificationFixtureId, occurrenceClass?: OccurrenceResult['occurrenceClass']) => Promise<IdentifyOutcome>;
  simulateHalfCentury: () => Promise<IdentifyOutcome>;
  simulateCollectionComplete: () => Promise<IdentifyOutcome>;
  simulateQuestComplete: () => Promise<void>;
  resetMilestones: () => Promise<void>;
  flushSync: () => Promise<{ processed: number; failed: number }>;
  lastOutcome: IdentifyOutcome | null;
};

const WildmarkContext = createContext<WildmarkContextValue | null>(null);

const onDeviceEngine = new OnDeviceIdentificationEngine();
const cloudEngine = new CloudIdentificationEngine(process.env.EXPO_PUBLIC_INATURALIST_TOKEN);
const occurrence = new MockOccurrenceService();

function appearanceTheme(appearance: AppearanceMode, system?: string | null) {
  const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  return createTheme(scheme);
}

function occurrenceFor(taxonId: string, nearby: OccurrenceResult[]): OccurrenceResult['occurrenceClass'] | undefined {
  return nearby.find((item) => item.taxonId === taxonId)?.occurrenceClass;
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
  const [unlockedMilestones, setUnlockedMilestones] = useState<UnlockedMilestone[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<IdentificationFixtureId>('northern-cardinal');
  const [offline, setOffline] = useState(false);
  const [sessions, setSessions] = useState<ExplorerSession[]>([]);
  const [lastOutcome, setLastOutcome] = useState<IdentifyOutcome | null>(null);
  const [lastDiscovery, setLastDiscovery] = useState<DiscoveryResult | null>(null);

  const refresh = useCallback(async (deps: DiscoveryDependencies, currentUser: User) => {
    const [nextTaxa, nextObservations, nextUserTaxa, nextCollections, nextQuests, nextMilestones] = await Promise.all([
      deps.taxa.list(),
      deps.observations.list({ userId: currentUser.id }),
      deps.userTaxa.list(currentUser.id),
      deps.collections.list(),
      deps.quests.list(),
      deps.milestones.list(currentUser.id),
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
        previousCount: ids.filter((id) => discovered.has(id)).length,
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
    setUnlockedMilestones(nextMilestones);
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
      const hybrid = new HybridIdentificationEngine(onDeviceEngine, cloudEngine, !offline);
      return hybrid.identify({
        imageUri: image.localUri,
        observedAt: image.capturedAt,
        fixtureId: selectedFixture,
      });
    },
    [offline, selectedFixture],
  );

  const celebrate = useCallback(
    async (discovery: DiscoveryResult, currentUser: User) => {
      setLastDiscovery(discovery);
      const level = feedbackLevelFor({
        isNewWildmark: discovery.isNewWildmark,
        collectionCompleted: discovery.collectionDeltas.some((item) => item.newlyCompleted),
        milestoneUnlocked: discovery.milestones.length > 0,
        questAdvanced: discovery.questDeltas.some((item) => item.current > 0),
      });
      await playFeedback(level, currentUser.soundEnabled);
    },
    [],
  );

  const captureAndIdentify = useCallback(
    async (image: CapturedDraft): Promise<IdentifyOutcome> => {
      if (!persistence || !user) {
        throw new Error('Wildmark is still opening the field journal.');
      }
      analytics.track('image_captured');
      const stored = await persistCapturedPhoto(image);
      const prepared = { ...image, ...stored };
      await playFeedback(1, user.soundEnabled);
      const result = await identifyWithEngine(prepared);
      if (result.kind === 'highConfidence') {
        const discovery = await recordAcceptedIdentification(persistence.deps, {
          userId: user.id,
          image: prepared,
          observedAt: prepared.capturedAt,
          selectedTaxonId: result.taxonId,
          confidence: result.confidence,
          identificationStatus: 'identified',
          occurrenceClass: occurrenceFor(result.taxonId, nearby) ?? (selectedFixture === 'rare-find' ? 'rare' : undefined),
          identification: { engine: 'hybrid', modelVersion: 'fixtures-1', result },
        });
        analytics.track(discovery.isNewWildmark ? 'wildmark_discovered' : 'repeat_sighting');
        await celebrate(discovery, user);
        await refresh(persistence.deps, user);
        const identified = { status: 'identified' as const, result, discovery };
        setLastOutcome(identified);
        return identified;
      }
      if (result.kind === 'candidate') {
        analytics.track('identification_ambiguous');
        const ambiguous = { status: 'ambiguous' as const, result, image: prepared };
        setLastOutcome(ambiguous);
        return ambiguous;
      }
      const recorded = await recordUnidentifiedObservation(persistence.deps, {
        userId: user.id,
        image: prepared,
        observedAt: prepared.capturedAt,
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
    [celebrate, identifyWithEngine, nearby, persistence, refresh, selectedFixture, user],
  );

  const acceptCandidate = useCallback(
    async (image: CapturedDraft, taxonId: string, confidence: number) => {
      if (!persistence || !user) throw new Error('Not ready');
      const stored = await persistCapturedPhoto(image);
      const result = await recordAcceptedIdentification(persistence.deps, {
        userId: user.id,
        image: { ...image, ...stored },
        observedAt: image.capturedAt,
        selectedTaxonId: taxonId,
        confidence,
        identificationStatus: 'identified',
        occurrenceClass: occurrenceFor(taxonId, nearby),
        identification: {
          engine: 'hybrid',
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
      await celebrate(result, user);
      await refresh(persistence.deps, user);
      return result;
    },
    [celebrate, nearby, persistence, refresh, user],
  );

  const saveUnconfirmed = useCallback(
    async (image: CapturedDraft, result: Extract<IdentificationResult, { kind: 'candidate' }>) => {
      if (!persistence || !user) throw new Error('Not ready');
      const stored = await persistCapturedPhoto(image);
      const top = result.candidates[0];
      const recorded = await recordAcceptedIdentification(persistence.deps, {
        userId: user.id,
        image: { ...image, ...stored },
        observedAt: image.capturedAt,
        selectedTaxonId: top?.taxonId ?? 'unknown',
        confidence: top?.confidence ?? 0,
        identificationStatus: 'ambiguous',
        identification: { engine: 'hybrid', modelVersion: 'fixtures-1', result },
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
      await celebrate(result, user);
      await refresh(persistence.deps, user);
      return result;
    },
    [celebrate, persistence, refresh, user],
  );

  const recommendations = useMemo(
    () =>
      getRecommendations({
        nearby,
        discoveredIds: new Set(userTaxa.map((item) => item.taxonId)),
        taxaById: new Map(taxa.map((taxon) => [taxon.id, taxon])),
        collections: collectionProgress,
        quests: quests.map((quest) => {
          const progress = questProgress.find((item) => item.questId === quest.id);
          return {
            questId: quest.id,
            questName: quest.name,
            current: progress?.current ?? 0,
            target: progress?.target ?? 1,
            newlyCompleted: false,
          };
        }),
        userTaxa,
      }),
    [collectionProgress, nearby, questProgress, quests, taxa, userTaxa],
  );

  const value = useMemo<WildmarkContextValue | null>(() => {
    if (!persistence || !user) return null;
    const theme = appearanceTheme(user.appearance, systemScheme);
    const taxaById = new Map(taxa.map((taxon) => [taxon.id, taxon]));
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
      recommendations,
      lastDiscovery,
      unlockedMilestones,
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
      async updateObservation(observationId, patch) {
        await persistence.deps.observations.update(observationId, patch);
        await refresh(persistence.deps, user);
      },
      async toggleFavoriteTaxon(taxonId) {
        const owned = await persistence.deps.userTaxa.get(user.id, taxonId);
        if (!owned) return;
        await persistence.deps.userTaxa.upsert({ ...owned, favorite: !owned.favorite });
        const nextFavorite = !owned.favorite ? taxonId : user.favoriteTaxonId === taxonId ? null : user.favoriteTaxonId;
        const next = await persistence.updateUser({ favoriteTaxonId: nextFavorite });
        setUser(next);
        await refresh(persistence.deps, next);
      },
      taxonById: (id) => taxa.find((item) => item.id === id),
      observationById: (id) => observations.find((item) => item.id === id),
      safetyFor: (taxonId) => TAXON_SAFETY[taxonId] ?? [],
      collectionTaxonIds: (collectionId) =>
        SEED_COLLECTION_TAXA.filter((item) => item.collectionId === collectionId).map((item) => item.taxonId),
      startExplorerSession: (taxonId) => {
        const sessionId = `look-${Math.random().toString(36).slice(2, 10)}`;
        setSessions((current) => [...current, { sessionId, taxonId, clueIndex: 1 }]);
        analytics.track('explorer_mode_started');
        return sessionId;
      },
      explorerSession: (sessionId) => sessions.find((item) => item.sessionId === sessionId),
      advanceExplorerClue: (sessionId) => {
        setSessions((current) =>
          current.map((session) =>
            session.sessionId === sessionId ? { ...session, clueIndex: Math.min(3, session.clueIndex + 1) } : session,
          ),
        );
      },
      recapForCurrentMonth: () =>
        monthlyRecap({
          month: new Date(),
          observations,
          userTaxa,
          taxaById,
          collections: collectionProgress,
          nearby,
        }),
      categoryCounts: categoryBreakdown(userTaxa, taxaById),
      explorerRank: explorerRank(userTaxa.length),
      inspectStore: () => persistence.inspect(),
      async resetLocalData() {
        await persistence.clearAll();
        const next = await persistence.refreshUser();
        setUser(next);
        setLastDiscovery(null);
        await refresh(persistence.deps, next);
      },
      async fillJournal() {
        for (const fixture of IDENTIFICATION_FIXTURE_IDS.slice(0, 8)) {
          if (fixture === 'blurry' || fixture === 'unsupported' || fixture === 'ambiguous-swallowtail' || fixture === 'rare-find') {
            continue;
          }
          setSelectedFixture(fixture);
          await captureAndIdentify({
            localUri: `fixture://${fixture}`,
            width: 1200,
            height: 1600,
            capturedAt: new Date().toISOString(),
          });
        }
      },
      lastOutcome,
      simulateDiscovery: (fixtureId, occurrenceClass) => {
        setSelectedFixture(fixtureId);
        if (occurrenceClass === 'rare') {
          setSelectedFixture(fixtureId === 'rare-find' ? 'rare-find' : fixtureId);
        }
        return captureAndIdentify({
          localUri: `fixture://${fixtureId}`,
          width: 1200,
          height: 1600,
          capturedAt: new Date().toISOString(),
        });
      },
      async simulateHalfCentury() {
        if (!persistence || !user) throw new Error('Not ready');
        const owned = new Set((await persistence.deps.userTaxa.list(user.id)).map((item) => item.taxonId));
        const fillers = SEED_TAXA.filter((item) => !owned.has(item.id)).slice(0, 49);
        for (const [index, taxon] of fillers.entries()) {
          await persistence.deps.userTaxa.upsert({
            userId: user.id,
            taxonId: taxon.id,
            firstObservationId: `seed-${taxon.id}`,
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            observationCount: 1,
            favorite: false,
            verifiedStatus: 'userConfirmed',
          });
          if (index >= 48) break;
        }
        await refresh(persistence.deps, user);
        setSelectedFixture('live-oak');
        return captureAndIdentify({
          localUri: 'fixture://live-oak',
          width: 1200,
          height: 1600,
          capturedAt: new Date().toISOString(),
        });
      },
      async simulateCollectionComplete() {
        setSelectedFixture('honey-bee');
        await captureAndIdentify({
          localUri: 'fixture://honey-bee',
          width: 1200,
          height: 1600,
          capturedAt: new Date().toISOString(),
        });
        setSelectedFixture('american-bumble-bee');
        return captureAndIdentify({
          localUri: 'fixture://american-bumble-bee',
          width: 1200,
          height: 1600,
          capturedAt: new Date().toISOString(),
        });
      },
      async simulateQuestComplete() {
        for (const fixture of ['northern-cardinal', 'blue-jay', 'downy-woodpecker', 'monarch', 'green-anole'] as const) {
          setSelectedFixture(fixture);
          await captureAndIdentify({
            localUri: `fixture://${fixture}`,
            width: 1200,
            height: 1600,
            capturedAt: new Date().toISOString(),
          });
        }
      },
      async resetMilestones() {
        if (!persistence || !user) return;
        await persistence.deps.milestones.reset(user.id);
        await refresh(persistence.deps, user);
      },
      async flushSync() {
        const queue = persistence.inspect().syncActions;
        const sync = new SyncService(new LocalOnlySyncAdapter(), () => queue);
        return sync.flush();
      },
    };
  }, [
    acceptCandidate,
    captureAndIdentify,
    collectionProgress,
    collections,
    correctObservation,
    lastDiscovery,
    lastOutcome,
    nearby,
    observations,
    offline,
    persistence,
    photosByObservation,
    questProgress,
    quests,
    recommendations,
    refresh,
    saveUnconfirmed,
    selectedFixture,
    sessions,
    systemScheme,
    taxa,
    unlockedMilestones,
    user,
    userTaxa,
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
