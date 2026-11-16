import { APIGatewayResponse } from '../types/index.js';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sudoend-key, x-requested-with',
  'Access-Control-Max-Age': '86400'
};

/**
 * Checks if incoming request is an HTTP OPTIONS pre-flight request.
 * If true, returns an immediate 204 No Content response with all CORS headers.
 */
export function handleCorsPreflight(httpMethod: string): APIGatewayResponse | null {
  if (httpMethod.toUpperCase() === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS },
      body: ''
    };
  }
  return null;
}

/**
 * Injects CORS headers into any outgoing response object.
 */
export function withCors(response: APIGatewayResponse): APIGatewayResponse {
  return {
    ...response,
    headers: {
      ...CORS_HEADERS,
      ...(response.headers || {})
    }
  };
}

