import { describe, it, expect } from 'vitest';
import { normalizePath, matchPathPattern, resolveRoute } from '../src/engine/routeMatcher.js';
import { MockRouteRecord } from '../src/types/index.js';

describe('routeMatcher', () => {
  it('normalizes paths consistently', () => {
    expect(normalizePath('users')).toBe('/users');
    expect(normalizePath('/users/')).toBe('/users');
    expect(normalizePath('api/v1/posts/')).toBe('/api/v1/posts');
  });

  it('matches exact paths and extracts empty params', () => {
    const match = matchPathPattern('/api/v1/products', '/api/v1/products');
    expect(match).toEqual({});
  });

  it('matches parameterized paths and extracts named parameters', () => {
    const match = matchPathPattern('/api/v1/users/:id/orders/:orderId', '/api/v1/users/usr_99/orders/ord_123');
    expect(match).toEqual({
      id: 'usr_99',
      orderId: 'ord_123'
    });
  });

  it('matches wildcard routes', () => {
    const match = matchPathPattern('/static/*', '/static/images/avatar.png');
    expect(match).toEqual({
      wildcard: 'images/avatar.png'
    });
  });

  it('resolves routes with correct precedence', () => {
    const routes: MockRouteRecord[] = [
      {
        projectId: 'p1',
        method: 'GET',
        path: '/users/:id',
        statusCode: 200,
        headers: {},
        responseBody: { type: 'parameterized' },
        latencyMs: 0,
        failureRatePercent: 0,
        isEcho: false,
        isStateful: false,
        ttl: 0,
        createdAt: ''
      },
      {
        projectId: 'p1',
        method: 'GET',
        path: '/users/me',
        statusCode: 200,
        headers: {},
        responseBody: { type: 'exact' },
        latencyMs: 0,
        failureRatePercent: 0,
        isEcho: false,
        isStateful: false,
        ttl: 0,
        createdAt: ''
      }
    ];

    // Exact match must win over parameterized
    const exactMatch = resolveRoute(routes, 'GET', '/users/me');
    expect(exactMatch?.matchedRoute.path).toBe('/users/me');
    expect(exactMatch?.matchedRoute.responseBody.type).toBe('exact');

    // Parameterized matches other IDs
    const paramMatch = resolveRoute(routes, 'GET', '/users/42');
    expect(paramMatch?.matchedRoute.path).toBe('/users/:id');
    expect(paramMatch?.params.id).toBe('42');
  });
});

