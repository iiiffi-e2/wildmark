export type QueuedSyncAction = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  state: 'pending' | 'syncing' | 'succeeded' | 'failed';
  attemptCount: number;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
};

export function nextRetryDelayMs(attemptCount: number): number {
  return Math.min(32_000, 1000 * 2 ** Math.max(0, attemptCount));
}

export function nextRetryAt(attemptCount: number, now = new Date()): string {
  return new Date(now.getTime() + nextRetryDelayMs(attemptCount)).toISOString();
}

export function isDue(action: QueuedSyncAction, now = new Date()): boolean {
  if (action.state === 'succeeded') {
    return false;
  }
  if (!action.nextRetryAt) {
    return true;
  }
  return action.nextRetryAt <= now.toISOString();
}

export function markFailed(action: QueuedSyncAction, error: string, now = new Date()): QueuedSyncAction {
  const attemptCount = action.attemptCount + 1;
  return {
    ...action,
    state: 'failed',
    attemptCount,
    lastError: error,
    nextRetryAt: nextRetryAt(attemptCount, now),
  };
}

export function markSucceeded(action: QueuedSyncAction): QueuedSyncAction {
  return {
    ...action,
    state: 'succeeded',
    lastError: null,
    nextRetryAt: null,
  };
}
