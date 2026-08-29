import { isDue, markFailed, markSucceeded, type QueuedSyncAction } from './backoff';

export type SyncAdapter = {
  push(action: { type: string; payload: Record<string, unknown> }): Promise<void>;
};

export class LocalOnlySyncAdapter implements SyncAdapter {
  async push(): Promise<void> {
    return;
  }
}

export class SyncService {
  constructor(
    private readonly adapter: SyncAdapter,
    private readonly readQueue: () => QueuedSyncAction[],
    private readonly writeQueue?: (actions: QueuedSyncAction[]) => void,
  ) {}

  async flush(now = new Date()): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    const next = this.readQueue().map((action) => ({ ...action }));
    for (let index = 0; index < next.length; index += 1) {
      const action = next[index];
      if (!action || !isDue(action, now)) {
        continue;
      }
      try {
        await this.adapter.push({ type: action.type, payload: action.payload });
        next[index] = markSucceeded(action);
        processed += 1;
      } catch (error) {
        next[index] = markFailed(action, error instanceof Error ? error.message : 'sync failed', now);
        failed += 1;
      }
    }
    this.writeQueue?.(next);
    return { processed, failed };
  }
}
