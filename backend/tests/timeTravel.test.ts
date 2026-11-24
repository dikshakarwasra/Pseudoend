import { describe, it, expect } from 'vitest';
import { sanitizePayload, compareDatabaseStates } from '../src/engine/timeTravel.js';

describe('Time-Travel Engine', () => {
  it('redacts sensitive authentication headers and passwords', () => {
    const rawData = {
      user: 'alice',
      password: 'superSecretPassword123',
      nested: {
        authorization: 'Bearer eyJhbGciOi...',
        apiKey: 'sk_live_12345',
        age: 30
      }
    };

    const sanitized = sanitizePayload(rawData);

    expect(sanitized.user).toBe('alice');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.nested.authorization).toBe('[REDACTED]');
    expect(sanitized.nested.apiKey).toBe('[REDACTED]');
    expect(sanitized.nested.age).toBe(30);
  });

  it('accurately detects added, removed, and modified database records between snapshots', () => {
    // 10:00 AM state (5 users)
    const state1000 = {
      users: [
        { id: 'usr_1', name: 'Alice', role: 'admin' },
        { id: 'usr_2', name: 'Bob', role: 'user' },
        { id: 'usr_3', name: 'Charlie', role: 'user' },
        { id: 'usr_4', name: 'Dave', role: 'user' },
        { id: 'usr_5', name: 'Eve', role: 'user' }
      ]
    };

    // 10:05 AM state: usr_5 deleted, usr_2 updated to admin, usr_6 added
    const state1005 = {
      users: [
        { id: 'usr_1', name: 'Alice', role: 'admin' },
        { id: 'usr_2', name: 'Bob', role: 'admin' }, // modified
        { id: 'usr_3', name: 'Charlie', role: 'user' },
        { id: 'usr_4', name: 'Dave', role: 'user' },
        { id: 'usr_6', name: 'Frank', role: 'user' }  // added
        // usr_5 removed!
      ]
    };

    const diff = compareDatabaseStates(state1000, state1005);

    expect(diff.removed.length).toBe(1);
    expect(diff.removed[0].item.id).toBe('usr_5');

    expect(diff.added.length).toBe(1);
    expect(diff.added[0].item.id).toBe('usr_6');

    expect(diff.modified.length).toBe(1);
    expect(diff.modified[0].id).toBe('usr_2');
    expect(diff.modified[0].changes).toContain('role');
    expect(diff.modified[0].before.role).toBe('user');
    expect(diff.modified[0].after.role).toBe('admin');
  });
});
