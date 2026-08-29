import type { TaxonSafetyFlag } from './types';

const SAFETY_COPY: Record<TaxonSafetyFlag, string> = {
  venomous: 'This organism can inject venom. Give it space.',
  poisonous: 'This organism can be harmful if eaten or touched. Do not consume it.',
  toxic: 'This organism may be toxic. Observe without contact.',
  irritant: 'Contact may irritate skin or eyes.',
  dangerousWildlife: 'Keep a respectful distance from wildlife.',
  doNotHandle: 'Do not handle.',
  protected: 'This organism is protected. Observe without disturbance.',
  sensitiveLocation: 'Exact locations for this organism are kept private.',
};

export function safetyNotice(flag: TaxonSafetyFlag): string {
  return SAFETY_COPY[flag];
}

export function assertNeverClaimsEdibility(copy: string): void {
  const forbidden = /safe to eat|edible|safe to consum|safe to handle/i;
  if (forbidden.test(copy)) {
    throw new Error('Wildmark must never claim an organism is safe to eat or handle from identification.');
  }
}

export function identificationSafetyDisclaimer(): string {
  return 'Wildmark never says a wild organism is safe to eat or handle from a photograph.';
}
