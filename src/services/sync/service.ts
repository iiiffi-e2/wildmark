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
    private readonly readQueue: () => { type: string; payload: Record<string, unknown> }[],
  ) {}

  async flush(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    for (const action of this.readQueue()) {
      try {
        await this.adapter.push(action);
        processed += 1;
      } catch {
        failed += 1;
      }
    }
    return { processed, failed };
  }
}
