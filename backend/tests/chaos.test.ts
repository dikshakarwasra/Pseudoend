import { describe, it, expect } from 'vitest';
import { applyChaos } from '../src/middleware/chaos.js';

describe('chaos & latency middleware', () => {
  it('returns null when failure rate is 0', async () => {
    const result = await applyChaos({ latencyMs: 10, failureRatePercent: 0 });
    expect(result).toBeNull();
  });

  it('triggers HTTP 500 when failure rate is 100%', async () => {
    const result = await applyChaos({ latencyMs: 0, failureRatePercent: 100 });
    expect(result).not.toBeNull();
    expect(result?.statusCode).toBe(500);
    const body = JSON.parse(result?.body || '{}');
    expect(body.isSimulated).toBe(true);
  });

  it('delays response when latencyMs is specified', async () => {
    const start = performance.now();
    await applyChaos({ latencyMs: 60, failureRatePercent: 0 });
    const duration = performance.now() - start;
    expect(duration).toBeGreaterThanOrEqual(50);
  });
});

