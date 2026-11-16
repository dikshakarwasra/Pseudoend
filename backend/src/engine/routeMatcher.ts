import { HttpMethod, MockRouteRecord } from '../types/index.js';

export interface RouteMatchResult {
  matchedRoute: MockRouteRecord;
  params: Record<string, string>;
}

/**
 * Normalizes a URL path by removing trailing slashes and ensuring a leading slash.
 */
export function normalizePath(path: string): string {
  let clean = path.trim();
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Checks if a requested path matches a route pattern with parameters (:id) or wildcards (*).
 * Returns extracted parameters if matched, or null if no match.
 */
export function matchPathPattern(
  pattern: string,
  actualPath: string
): Record<string, string> | null {
  const normPattern = normalizePath(pattern);
  const normActual = normalizePath(actualPath);

  // Exact match
  if (normPattern === normActual) {
    return {};
  }

  const patternParts = normPattern.split('/');
  const actualParts = normActual.split('/');

  // Wildcard match
  if (pattern.endsWith('/*')) {
    const basePattern = normPattern.slice(0, -2);
    if (normActual.startsWith(basePattern)) {
      return { wildcard: normActual.slice(basePattern.length).replace(/^\//, '') };
    }
  }

  if (patternParts.length !== actualParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pPart = patternParts[i];
    const aPart = actualParts[i];

    if (pPart.startsWith(':')) {
      const paramName = pPart.slice(1);
      params[paramName] = decodeURIComponent(aPart);
    } else if (pPart !== aPart) {
      return null;
    }
  }

  return params;
}

/**
 * Finds the best matching route for an incoming method and sub-path from a list of project routes.
 * Precedence:
 * 1. Exact path + method match
 * 2. Parameterized path + method match
 * 3. Wildcard path + method match
 * 4. ANY method match
 */
export function resolveRoute(
  routes: MockRouteRecord[],
  method: string,
  subPath: string
): RouteMatchResult | null {
  const upperMethod = method.toUpperCase() as HttpMethod;

  // Filter routes matching the method or defined as ANY
  const eligibleRoutes = routes.filter(
    (r) => r.method === upperMethod || (r.method as any) === 'ANY'
  );

  // 1. Try exact match
  for (const route of eligibleRoutes) {
    if (normalizePath(route.path) === normalizePath(subPath)) {
      return { matchedRoute: route, params: {} };
    }
  }

  // 2. Try parameterized match
  for (const route of eligibleRoutes) {
    if (route.path.includes(':')) {
      const params = matchPathPattern(route.path, subPath);
      if (params) {
        return { matchedRoute: route, params };
      }
    }
  }

  // 3. Try wildcard match
  for (const route of eligibleRoutes) {
    if (route.path.includes('*')) {
      const params = matchPathPattern(route.path, subPath);
      if (params) {
        return { matchedRoute: route, params };
      }
    }
  }

  return null;
}

