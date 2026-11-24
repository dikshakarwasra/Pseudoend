import { describe, it, expect } from 'vitest';
import { normalizeEnvironment, ENVIRONMENTS, DEFAULT_ENV_CONFIGS } from '../src/engine/environmentManager.js';

describe('Environment Manager', () => {
  it('normalizes valid and invalid environment names', () => {
    expect(normalizeEnvironment('sandbox')).toBe('sandbox');
    expect(normalizeEnvironment('DEVELOPMENT')).toBe('development');
    expect(normalizeEnvironment('Staging')).toBe('staging');
    expect(normalizeEnvironment('live')).toBe('live');
    expect(normalizeEnvironment('unknown')).toBe('sandbox');
    expect(normalizeEnvironment('')).toBe('sandbox');
    expect(normalizeEnvironment(null)).toBe('sandbox');
  });

  it('contains all 4 required environments with default configurations', () => {
    expect(ENVIRONMENTS).toEqual(['sandbox', 'development', 'staging', 'live']);
    expect(DEFAULT_ENV_CONFIGS.sandbox.latencyMs).toBe(50);
    expect(DEFAULT_ENV_CONFIGS.staging.failureRatePercent).toBe(5);
    expect(DEFAULT_ENV_CONFIGS.live.isEnabled).toBe(true);
  });
});
