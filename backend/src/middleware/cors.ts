import { APIGatewayResponse } from '../types/index.js';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-pseudoend-key, x-sudoend-key, x-requested-with, x-api-key',
  'Access-Control-Max-Age': '86400'
};

// Check if running inside AWS Lambda behind API Gateway HTTP API v2 (which manages CORS via cors_configuration)
const IS_AWS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Checks if incoming request is an HTTP OPTIONS pre-flight request.
 * In AWS, API Gateway's cors_configuration intercepts OPTIONS at the edge.
 * For local environments or direct invocations, this returns 204 with CORS headers.
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
 * Injects headers into outgoing response.
 * When running in AWS Lambda, API Gateway's native cors_configuration automatically
 * appends Access-Control-* headers. Omitting them here prevents duplicate "*, *" headers
 * which modern browsers reject with "TypeError: Failed to fetch".
 */
export function withCors(response: APIGatewayResponse): APIGatewayResponse {
  const baseHeaders = IS_AWS_LAMBDA ? {} : CORS_HEADERS;
  return {
    ...response,
    headers: {
      ...baseHeaders,
      ...(response.headers || {})
    }
  };
}

