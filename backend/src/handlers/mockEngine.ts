import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { APIGatewayEventV2, APIGatewayResponse, MockRouteRecord } from '../types/index.js';
import { handleCorsPreflight, withCors } from '../middleware/cors.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimiter.js';
import { applyChaos } from '../middleware/chaos.js';
import { resolveRoute, normalizePath } from '../engine/routeMatcher.js';
import { parseTemplate } from '../engine/templateParser.js';

/**
 * Main Lambda Handler for the sudoend Public Mocking Engine.
 * Path pattern: ANY /mock/{projectId}/{proxy+}
 */
export async function handler(event: APIGatewayEventV2): Promise<APIGatewayResponse> {
  const method = event.requestContext?.http?.method || 'GET';

  // 1. Intercept CORS OPTIONS preflight
  const corsResponse = handleCorsPreflight(method);
  if (corsResponse) {
    return corsResponse;
  }

  // 2. Parse projectId and sub-path from rawPath
  // Expected rawPath format: /mock/<projectId>/<subPath...> or /mock/<projectId>
  const rawPath = event.rawPath || '';
  const pathSegments = rawPath.replace(/^\//, '').split('/');

  if (pathSegments.length < 2 || pathSegments[0] !== 'mock') {
    return withCors({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid path format. Expected /mock/{projectId}/{endpointPath}'
      })
    });
  }

  const projectId = pathSegments[1];
  const subPath = '/' + pathSegments.slice(2).join('/');
  const normalizedSubPath = normalizePath(subPath);

  // 3. Authenticate Request via API Key
  const { auth, errorResponse: authError } = await authenticateApiKey(event);
  if (authError || !auth) {
    return authError!;
  }

  const { user, project, apiKey } = auth;

  // Verify that the API Key belongs to the project requested in the URL
  if (project.id !== projectId && user.role !== 'admin') {
    return withCors({
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Forbidden',
        message: `API key does not have access to project "${projectId}".`
      })
    });
  }

  // 4. Enforce Multi-Tier Rate Limiting & Quota Consumption
  const rateLimitResult = await checkRateLimit(apiKey, user);
  if (!rateLimitResult.allowed && rateLimitResult.errorResponse) {
    return rateLimitResult.errorResponse;
  }

  // 5. Parse request body if present
  let parsedBody: any = null;
  if (event.body) {
    try {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = event.body;
    }
  }

  // 6. Handle Global /echo Endpoint
  if (normalizedSubPath === '/echo') {
    return withCors({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'x-ratelimit-limit': rateLimitResult.limit.toString(),
        'x-ratelimit-remaining': rateLimitResult.remaining.toString()
      },
      body: JSON.stringify({
        echo: true,
        receivedMethod: method,
        receivedPath: rawPath,
        receivedHeaders: event.headers,
        receivedQueryParams: event.queryStringParameters || {},
        receivedBody: parsedBody,
        timestamp: new Date().toISOString()
      }, null, 2)
    });
  }

  try {
    // 7. Query Mock Routes for this Project from DynamoDB
    const routesQuery = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `PROJ#${projectId}`,
          ':skPrefix': 'ROUTE#'
        }
      })
    );

    const routes = (routesQuery.Items || []) as MockRouteRecord[];

    // 8. Resolve Route Match
    const match = resolveRoute(routes, method, normalizedSubPath);

    if (!match) {
      return withCors({
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'x-ratelimit-limit': rateLimitResult.limit.toString(),
          'x-ratelimit-remaining': rateLimitResult.remaining.toString()
        },
        body: JSON.stringify({
          error: 'Not Found',
          message: `No mock route configured for [${method}] "${normalizedSubPath}" in project "${projectId}".`,
          suggestion: 'Open your sudoend Developer Portal to add this endpoint or test with /mock/' + projectId + '/echo'
        })
      });
    }

    const { matchedRoute, params } = match;

    // 9. Evaluate Chaos Engine (Latency & Fault Injection)
    const chaosError = await applyChaos({
      latencyMs: matchedRoute.latencyMs,
      failureRatePercent: matchedRoute.failureRatePercent
    });

    if (chaosError) {
      return chaosError;
    }

    // 10. Parse Dynamic Template Tags
    const context = {
      params,
      query: event.queryStringParameters || {},
      body: parsedBody
    };

    let responsePayload: any;
    if (matchedRoute.isEcho) {
      responsePayload = {
        echo: true,
        method,
        path: subPath,
        params,
        query: event.queryStringParameters || {},
        body: parsedBody,
        echoTime: new Date().toISOString()
      };
    } else {
      responsePayload = parseTemplate(matchedRoute.responseBody, context);
    }

    // 11. Format & Dispatch Response
    const finalHeaders = {
      'Content-Type': 'application/json',
      'x-ratelimit-limit': rateLimitResult.limit.toString(),
      'x-ratelimit-remaining': rateLimitResult.remaining.toString(),
      ...(matchedRoute.headers || {})
    };

    const responseBodyString =
      typeof responsePayload === 'string'
        ? responsePayload
        : JSON.stringify(responsePayload);

    return withCors({
      statusCode: matchedRoute.statusCode || 200,
      headers: finalHeaders,
      body: responseBodyString
    });
  } catch (err: any) {
    console.error('Mock engine execution error:', err);
    return withCors({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while evaluating the mock route.'
      })
    });
  }
}

