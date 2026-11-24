import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { APIGatewayEventV2, APIGatewayResponse, MockRouteRecord, EnvironmentConfig } from '../types/index.js';
import { handleCorsPreflight, withCors } from '../middleware/cors.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimiter.js';
import { applyChaos } from '../middleware/chaos.js';
import { resolveRoute, normalizePath } from '../engine/routeMatcher.js';
import { parseTemplate } from '../engine/templateParser.js';
import { normalizeEnvironment, DEFAULT_ENV_CONFIGS } from '../engine/environmentManager.js';
import { recordRequestLog, captureDatabaseSnapshot } from '../engine/timeTravel.js';
import { extractResourceName } from '../engine/relationshipEngine.js';

/**
 * Main Lambda Handler for the Pseudoend Public Mocking Engine.
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

  // Detect active environment
  const envHeader = event.headers?.['x-pseudoend-env'] || event.headers?.['X-Pseudoend-Env'] || event.queryStringParameters?.env;
  const environment = normalizeEnvironment(envHeader);

  const startTime = performance.now();

  // Helper to record logs before returning response
  const dispatchResponse = async (statusCode: number, headers: Record<string, string>, bodyObjOrString: any): Promise<APIGatewayResponse> => {
    const durationMs = Math.round(performance.now() - startTime);
    const bodyStr = typeof bodyObjOrString === 'string' ? bodyObjOrString : JSON.stringify(bodyObjOrString);

    // Asynchronously record request into audit history (non-blocking for speed)
    recordRequestLog(projectId, environment, {
      method: method as any,
      endpoint: rawPath,
      status: statusCode,
      durationMs,
      requestHeaders: (event.headers || {}) as Record<string, string>,
      requestBody: parsedBody,
      responseHeaders: headers,
      responseBody: typeof bodyObjOrString === 'string' ? (() => { try { return JSON.parse(bodyObjOrString); } catch { return bodyObjOrString; } })() : bodyObjOrString,
      sourceIp: event.requestContext?.http?.sourceIp
    }).catch(e => console.error('Error writing request log:', e));

    return withCors({
      statusCode,
      headers: {
        'x-pseudoend-env': environment,
        ...headers
      },
      body: bodyStr
    });
  };

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
    return dispatchResponse(200, {
      'Content-Type': 'application/json',
      'x-ratelimit-limit': rateLimitResult.limit.toString(),
      'x-ratelimit-remaining': rateLimitResult.remaining.toString()
    }, {
      echo: true,
      environment,
      receivedMethod: method,
      receivedPath: rawPath,
      receivedHeaders: event.headers,
      receivedQueryParams: event.queryStringParameters || {},
      receivedBody: parsedBody,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // 7. Load environment-specific chaos and routes
    let envLatency = DEFAULT_ENV_CONFIGS[environment].latencyMs;
    let envFailureRate = DEFAULT_ENV_CONFIGS[environment].failureRatePercent;

    try {
      const envRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PROJ#${projectId}`, SK: `ENV#${environment}` }
      }));
      if (envRes.Item) {
        const item = envRes.Item as EnvironmentConfig;
        envLatency = item.latencyMs;
        envFailureRate = item.failureRatePercent;
      }
    } catch {}

    // Query Mock Routes for this Project from DynamoDB
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
      return dispatchResponse(404, {
        'Content-Type': 'application/json',
        'x-ratelimit-limit': rateLimitResult.limit.toString(),
        'x-ratelimit-remaining': rateLimitResult.remaining.toString()
      }, {
        error: 'Not Found',
        message: `No mock route configured for [${method}] "${normalizedSubPath}" in project "${projectId}" (${environment.toUpperCase()}).`,
        suggestion: `Open your Pseudoend Developer Portal to add this endpoint or test with /mock/${projectId}/echo`
      });
    }

    const { matchedRoute, params } = match;

    // 9. Evaluate Combined Chaos Engine (Environment + Route settings)
    const totalLatency = (matchedRoute.latencyMs || 0) + envLatency;
    const totalFailureRate = Math.max(matchedRoute.failureRatePercent || 0, envFailureRate);

    const chaosError = await applyChaos({
      latencyMs: totalLatency,
      failureRatePercent: totalFailureRate
    });

    if (chaosError) {
      return dispatchResponse(chaosError.statusCode, chaosError.headers, chaosError.body);
    }

    // 10. Check Stateful Mocking in Active Environment
    const resource = extractResourceName(normalizedSubPath);

    if (resource && (matchedRoute.isStateful || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method))) {
      // Query stateful records for this resource in this environment
      const stateQuery = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `PROJ#${projectId}#ENV#${environment}`,
          ':skPrefix': `DATA#${resource}#`
        }
      }));

      const stateRecords = (stateQuery.Items || []).map(i => i.data || i);

      // GET Collection
      if (method === 'GET' && !params.id) {
        if (stateRecords.length > 0) {
          return dispatchResponse(200, {
            'Content-Type': 'application/json',
            'x-pseudoend-stateful': 'true'
          }, stateRecords);
        }
      }

      // GET Single Item by ID
      if (method === 'GET' && params.id) {
        const found = stateRecords.find(r => (r.id || r._id) === params.id);
        if (found) {
          return dispatchResponse(200, {
            'Content-Type': 'application/json',
            'x-pseudoend-stateful': 'true'
          }, found);
        }
      }

      // POST Create Item
      if (method === 'POST') {
        // Auto-capture database snapshot before creation for Time-Travel
        await captureDatabaseSnapshot(
          projectId, 
          environment, 
          `Auto-snapshot before POST ${normalizedSubPath}`, 
          'auto'
        ).catch(() => {});

        const newId = parsedBody?.id || `${resource.slice(0, 3)}_${uuidv4().slice(0, 8)}`;
        const newRecord = {
          id: newId,
          ...(typeof parsedBody === 'object' ? parsedBody : { payload: parsedBody }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `PROJ#${projectId}#ENV#${environment}`,
            SK: `DATA#${resource}#${newId}`,
            resource,
            data: newRecord,
            createdAt: newRecord.createdAt,
            updatedAt: newRecord.updatedAt
          }
        }));

        return dispatchResponse(201, {
          'Content-Type': 'application/json',
          'x-pseudoend-stateful': 'true'
        }, newRecord);
      }

      // DELETE Item by ID
      if (method === 'DELETE' && params.id) {
        // Auto-capture snapshot before deletion for Time-Travel
        await captureDatabaseSnapshot(
          projectId, 
          environment, 
          `Auto-snapshot before DELETE ${normalizedSubPath}`, 
          'auto'
        ).catch(() => {});

        await docClient.send(new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `PROJ#${projectId}#ENV#${environment}`,
            SK: `DATA#${resource}#${params.id}`
          }
        }));

        return dispatchResponse(200, {
          'Content-Type': 'application/json',
          'x-pseudoend-stateful': 'true'
        }, {
          message: `Record ${params.id} deleted from ${resource} (${environment.toUpperCase()}).`,
          deletedId: params.id
        });
      }

      // PUT/PATCH Update Item by ID
      if (['PUT', 'PATCH'].includes(method) && params.id) {
        await captureDatabaseSnapshot(
          projectId, 
          environment, 
          `Auto-snapshot before ${method} ${normalizedSubPath}`, 
          'auto'
        ).catch(() => {});

        const existing = stateRecords.find(r => (r.id || r._id) === params.id) || { id: params.id };
        const updatedRecord = {
          ...existing,
          ...(typeof parsedBody === 'object' ? parsedBody : {}),
          updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `PROJ#${projectId}#ENV#${environment}`,
            SK: `DATA#${resource}#${params.id}`,
            resource,
            data: updatedRecord,
            updatedAt: updatedRecord.updatedAt
          }
        }));

        return dispatchResponse(200, {
          'Content-Type': 'application/json',
          'x-pseudoend-stateful': 'true'
        }, updatedRecord);
      }
    }

    // 11. Parse Dynamic Template Tags
    const context = {
      params,
      query: event.queryStringParameters || {},
      body: parsedBody
    };

    let responsePayload: any;
    if (matchedRoute.isEcho) {
      responsePayload = {
        echo: true,
        environment,
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

    // 12. Format & Dispatch Response
    const finalHeaders = {
      'Content-Type': 'application/json',
      'x-ratelimit-limit': rateLimitResult.limit.toString(),
      'x-ratelimit-remaining': rateLimitResult.remaining.toString(),
      ...(matchedRoute.headers || {})
    };

    return dispatchResponse(matchedRoute.statusCode || 200, finalHeaders, responsePayload);
  } catch (err: any) {
    console.error('Mock engine execution error:', err);
    return dispatchResponse(500, { 'Content-Type': 'application/json' }, {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while evaluating the mock route.'
    });
  }
}

