export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'scan_opened'
  | 'image_captured'
  | 'identification_started'
  | 'identification_completed'
  | 'identification_ambiguous'
  | 'identification_failed'
  | 'wildmark_discovered'
  | 'repeat_sighting'
  | 'species_viewed'
  | 'collection_viewed'
  | 'around_you_viewed'
  | 'explorer_mode_started'
  | 'quest_started'
  | 'quest_completed'
  | 'journal_viewed'
  | 'account_created';

export interface Analytics {
  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void;
}

export class LocalAnalytics implements Analytics {
  readonly events: { event: AnalyticsEvent; properties?: Record<string, string | number | boolean> }[] = [];

  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void {
    const safe = { ...properties };
    delete safe.imageUri;
    delete safe.latitude;
    delete safe.longitude;
    delete safe.notes;
    this.events.push({ event, properties: safe });
  }
}

export const analytics = new LocalAnalytics();
