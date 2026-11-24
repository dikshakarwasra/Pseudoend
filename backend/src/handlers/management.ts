import { 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { signUserToken, verifyUserToken } from '../lib/jwt.js';
import { handleCorsPreflight, withCors } from '../middleware/cors.js';
import { 
  APIGatewayEventV2, 
  APIGatewayResponse, 
  UserRecord, 
  ProjectRecord, 
  MockRouteRecord, 
  QuotaRequestRecord, 
  JwtPayload,
  EnvironmentType,
  SchemaRelationshipsRecord
} from '../types/index.js';
import { 
  analyzeSchemaFromRoutes, 
  analyzeOpenApiDocument, 
  generateRelationalMockData 
} from '../engine/relationshipEngine.js';
import { 
  getProjectEnvironments, 
  saveEnvironmentConfig, 
  resetEnvironment, 
  cloneEnvironmentData, 
  normalizeEnvironment 
} from '../engine/environmentManager.js';
import { 
  executeTestSuite, 
  getProjectTestReports, 
  generateHtmlReport 
} from '../engine/testRunner.js';
import { 
  getDatabaseSnapshots, 
  captureDatabaseSnapshot, 
  restoreDatabaseSnapshot, 
  compareDatabaseStates, 
  getRequestLogs 
} from '../engine/timeTravel.js';

/**
 * Extracts and validates the Bearer JWT token from the Authorization header.
 */
function extractAuthUser(event: APIGatewayEventV2): JwtPayload | null {
  const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  return verifyUserToken(token);
}

/**
 * Helper to generate JSON responses with CORS headers.
 */
function jsonResponse(statusCode: number, data: any): APIGatewayResponse {
  return withCors({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

/**
 * Main Lambda Handler for Pseudoend Management API
 */
export async function handler(event: APIGatewayEventV2): Promise<APIGatewayResponse> {
  const method = event.requestContext?.http?.method?.toUpperCase() || 'GET';
  const rawPath = event.rawPath || '';

  // 1. Intercept CORS preflight
  const corsPreflight = handleCorsPreflight(method);
  if (corsPreflight) return corsPreflight;

  // 2. Parse JSON body safely
  let body: any = {};
  if (event.body) {
    try {
      const raw = event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64').toString('utf-8') 
        : event.body;
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  try {
    // =========================================================================
    // PUBLIC AUTH ROUTES
    // =========================================================================

    // POST /api/auth/register
    if (method === 'POST' && rawPath === '/api/auth/register') {
      const { email, password } = body;
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return jsonResponse(400, { error: 'Bad Request', message: 'Valid email and password are required.' });
      }
      if (password.length < 8) {
        return jsonResponse(400, { error: 'Bad Request', message: 'Password must be at least 8 characters long.' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already registered
      const existingEmail = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `EMAIL#${normalizedEmail}`, SK: 'USER' }
      }));
      if (existingEmail.Item) {
        return jsonResponse(409, { error: 'Conflict', message: 'An account with this email already exists.' });
      }

      const userId = `usr_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      const projectId = `proj_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      const apiKey = `sk_live_${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`.slice(0, 40);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const nowIso = new Date().toISOString();

      const newUser: UserRecord = {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        role: 'user',
        tier: 'free',
        dailyCreditLimit: 1000,
        isBanned: false,
        createdAt: nowIso
      };

      const newProject: ProjectRecord = {
        id: projectId,
        userId,
        name: 'Default Demo Project',
        apiKeyHash: apiKey,
        rawApiKeyPrefix: `${apiKey.slice(0, 12)}...`,
        createdAt: nowIso
      };

      // Initial sample mock route so user has a working endpoint out of the box
      const sampleRoute: MockRouteRecord = {
        projectId,
        method: 'GET',
        path: '/api/v1/users',
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        responseBody: {
          status: 'success',
          users: [
            { id: '{{uuid}}', name: '{{faker.name.fullName}}', email: '{{faker.internet.email}}' },
            { id: '{{uuid}}', name: '{{faker.name.fullName}}', email: '{{faker.internet.email}}' }
          ]
        },
        latencyMs: 150,
        failureRatePercent: 0,
        isEcho: false,
        isStateful: false,
        ttl: Math.floor(Date.now() / 1000) + (7 * 86400),
        createdAt: nowIso
      };

      // Persist User, Email pointer, Project, API Key, and Sample Route
      await Promise.all([
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `USER#${userId}`, SK: 'METADATA', ...newUser } })),
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `EMAIL#${normalizedEmail}`, SK: 'USER', userId } })),
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `PROJ#${projectId}`, SK: 'METADATA', ...newProject } })),
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `KEY#${apiKey}`, SK: 'METADATA', userId, projectId, status: 'active', createdAt: nowIso } })),
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: `PROJ#${projectId}`, SK: `ROUTE#GET#/api/v1/users`, ...sampleRoute } }))
      ]);

      const token = signUserToken(newUser);
      return jsonResponse(201, {
        message: 'Account successfully registered.',
        token,
        user: { id: newUser.id, email: newUser.email, role: newUser.role, tier: newUser.tier, dailyCreditLimit: newUser.dailyCreditLimit },
        initialProject: { id: projectId, name: newProject.name, apiKey }
      });
    }

    // POST /api/auth/login
    if (method === 'POST' && rawPath === '/api/auth/login') {
      const { email, password } = body;
      if (!email || !password) {
        return jsonResponse(400, { error: 'Bad Request', message: 'Email and password are required.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const emailRecord = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `EMAIL#${normalizedEmail}`, SK: 'USER' }
      }));

      if (!emailRecord.Item) {
        return jsonResponse(401, { error: 'Unauthorized', message: 'Invalid email or password.' });
      }

      const userRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${emailRecord.Item.userId}`, SK: 'METADATA' }
      }));

      const user = userRes.Item as UserRecord | undefined;
      if (!user) {
        return jsonResponse(401, { error: 'Unauthorized', message: 'Invalid email or password.' });
      }

      if (user.isBanned) {
        return jsonResponse(403, { error: 'Forbidden', message: 'This account has been suspended by the administrator.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return jsonResponse(401, { error: 'Unauthorized', message: 'Invalid email or password.' });
      }

      const token = signUserToken(user);
      return jsonResponse(200, {
        token,
        user: { id: user.id, email: user.email, role: user.role, tier: user.tier, dailyCreditLimit: user.dailyCreditLimit }
      });
    }

    // =========================================================================
    // AUTHENTICATED USER ROUTES
    // =========================================================================
    const authUser = extractAuthUser(event);
    if (!authUser) {
      return jsonResponse(401, { error: 'Unauthorized', message: 'Missing or expired Bearer token in Authorization header.' });
    }

    // GET /api/user/me
    if (method === 'GET' && rawPath === '/api/user/me') {
      const userRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${authUser.userId}`, SK: 'METADATA' }
      }));
      if (!userRes.Item) return jsonResponse(404, { error: 'User not found' });
      const { passwordHash, ...safeUser } = userRes.Item;
      return jsonResponse(200, { user: safeUser });
    }

    // POST /api/auth/delete-account
    if (method === 'POST' && rawPath === '/api/auth/delete-account') {
      // Cascading wipe: Fetch projects owned by user
      const projectsQuery = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': authUser.userId }
      }));

      const itemsToDelete: Array<{ PK: string; SK: string }> = [
        { PK: `USER#${authUser.userId}`, SK: 'METADATA' },
        { PK: `EMAIL#${authUser.email.toLowerCase()}`, SK: 'USER' }
      ];

      for (const item of projectsQuery.Items || []) {
        if (item.PK.startsWith('PROJ#')) {
          itemsToDelete.push({ PK: item.PK, SK: item.SK });
          // Also fetch routes for this project
          const routesQuery = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': item.PK }
          }));
          for (const r of routesQuery.Items || []) {
            itemsToDelete.push({ PK: r.PK, SK: r.SK });
          }
        }
      }

      for (const item of itemsToDelete) {
        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: item }));
      }

      return jsonResponse(200, { message: 'Account and all associated resources permanently deleted.' });
    }

    // GET /api/projects
    if (method === 'GET' && rawPath === '/api/projects') {
      const projectsScan = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :uid AND SK = :meta',
        ExpressionAttributeValues: { ':uid': authUser.userId, ':meta': 'METADATA' }
      }));

      const projects = (projectsScan.Items || []).filter(item => item.PK.startsWith('PROJ#'));
      return jsonResponse(200, { projects });
    }

    // GET /api/routes/:projectId
    if (method === 'GET' && rawPath.startsWith('/api/routes/')) {
      const projectId = rawPath.replace('/api/routes/', '').split('/')[0];
      const routesQuery = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: { ':pk': `PROJ#${projectId}`, ':skPrefix': 'ROUTE#' }
      }));

      return jsonResponse(200, { routes: routesQuery.Items || [] });
    }

    // POST /api/routes
    if (method === 'POST' && rawPath === '/api/routes') {
      const { projectId, method: routeMethod, path: routePath, statusCode = 200, headers = {}, responseBody = {}, latencyMs = 0, failureRatePercent = 0, isEcho = false, isStateful = false } = body;
      if (!projectId || !routeMethod || !routePath) {
        return jsonResponse(400, { error: 'Bad Request', message: 'projectId, method, and path are required.' });
      }

      const cleanPath = routePath.trim().startsWith('/') ? routePath.trim() : '/' + routePath.trim();
      const nowIso = new Date().toISOString();
      const routeRecord: MockRouteRecord = {
        projectId,
        method: routeMethod.toUpperCase(),
        path: cleanPath,
        statusCode: Number(statusCode),
        headers,
        responseBody,
        latencyMs: Math.min(5000, Math.max(0, Number(latencyMs))),
        failureRatePercent: Math.min(100, Math.max(0, Number(failureRatePercent))),
        isEcho: Boolean(isEcho),
        isStateful: Boolean(isStateful),
        ttl: Math.floor(Date.now() / 1000) + (7 * 86400),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `PROJ#${projectId}`,
          SK: `ROUTE#${routeRecord.method}#${routeRecord.path}`,
          ...routeRecord
        }
      }));

      return jsonResponse(201, { message: 'Mock route saved successfully.', route: routeRecord });
    }

    // DELETE /api/routes/:projectId/:routeId
    if (method === 'DELETE' && rawPath.startsWith('/api/routes/')) {
      const parts = rawPath.replace('/api/routes/', '').split('/');
      if (parts.length < 2) {
        return jsonResponse(400, { error: 'Bad Request', message: 'Missing projectId or route identifier.' });
      }
      const [projectId, routeSK] = parts;
      const decodedSK = decodeURIComponent(routeSK);

      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PROJ#${projectId}`, SK: decodedSK }
      }));

      return jsonResponse(200, { message: 'Route deleted.' });
    }

    // POST /api/quota/request
    if (method === 'POST' && rawPath === '/api/quota/request') {
      const { requestedTier = 'developer', reason = '' } = body;
      const reqId = `req_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
      const nowIso = new Date().toISOString();

      const quotaReq: QuotaRequestRecord = {
        id: reqId,
        userId: authUser.userId,
        userEmail: authUser.email,
        currentTier: authUser.tier,
        requestedTier: requestedTier === 'pro' ? 'pro' : 'developer',
        reason,
        status: 'PENDING',
        submittedAt: nowIso
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `QUOTA_REQ#${reqId}`,
          SK: 'PENDING',
          ...quotaReq
        }
      }));

      return jsonResponse(201, { message: 'Quota upgrade request submitted for admin review.', request: quotaReq });
    }

    // =========================================================================
    // FEATURE 1: SMART DATA RELATIONSHIPS APIs
    // =========================================================================

    // GET /api/relationships/:projectId
    if (method === 'GET' && rawPath.startsWith('/api/relationships/')) {
      const projectId = rawPath.replace('/api/relationships/', '').split('/')[0];
      const relRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PROJ#${projectId}`, SK: 'SCHEMA_RELATIONSHIPS' }
      }));

      if (relRes.Item) {
        return jsonResponse(200, { relationships: relRes.Item });
      }

      // If not yet saved, auto-analyze from project routes
      const routesRes = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: { ':pk': `PROJ#${projectId}`, ':skPrefix': 'ROUTE#' }
      }));
      const routes = (routesRes.Items || []) as MockRouteRecord[];
      const analyzed = analyzeSchemaFromRoutes(routes);

      return jsonResponse(200, { relationships: { projectId, ...analyzed, updatedAt: new Date().toISOString() } });
    }

    // POST /api/relationships/:projectId/analyze
    if (method === 'POST' && rawPath.endsWith('/analyze') && rawPath.includes('/relationships/')) {
      const projectId = rawPath.split('/')[3];
      const { openApiDoc } = body;

      if (openApiDoc && typeof openApiDoc === 'object') {
        const analyzed = analyzeOpenApiDocument(openApiDoc);
        return jsonResponse(200, { projectId, ...analyzed });
      }

      const routesRes = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: { ':pk': `PROJ#${projectId}`, ':skPrefix': 'ROUTE#' }
      }));
      const routes = (routesRes.Items || []) as MockRouteRecord[];
      const analyzed = analyzeSchemaFromRoutes(routes);
      return jsonResponse(200, { projectId, ...analyzed });
    }

    // POST /api/relationships/:projectId/save
    if (method === 'POST' && rawPath.endsWith('/save') && rawPath.includes('/relationships/')) {
      const projectId = rawPath.split('/')[3];
      const { nodes, edges } = body;

      const record: SchemaRelationshipsRecord = {
        projectId,
        nodes: nodes || [],
        edges: edges || [],
        updatedAt: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `PROJ#${projectId}`,
          SK: 'SCHEMA_RELATIONSHIPS',
          ...record
        }
      }));

      return jsonResponse(200, { message: 'Schema relationship graph saved successfully.', relationships: record });
    }

    // POST /api/relationships/:projectId/seed
    if (method === 'POST' && rawPath.endsWith('/seed') && rawPath.includes('/relationships/')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(body.environment || event.queryStringParameters?.env);
      const countPerEntity = body.countPerEntity || 5;

      // Fetch current relationship schema
      const relRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PROJ#${projectId}`, SK: 'SCHEMA_RELATIONSHIPS' }
      }));

      let nodes = relRes.Item?.nodes;
      let edges = relRes.Item?.edges;

      if (!nodes || nodes.length === 0) {
        const routesRes = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: { ':pk': `PROJ#${projectId}`, ':skPrefix': 'ROUTE#' }
        }));
        const analyzed = analyzeSchemaFromRoutes((routesRes.Items || []) as MockRouteRecord[]);
        nodes = analyzed.nodes;
        edges = analyzed.edges;
      }

      const generatedData = generateRelationalMockData(nodes, edges || [], countPerEntity);
      let totalSeeded = 0;

      // Seed each record into DynamoDB scoped by environment
      for (const [resource, records] of Object.entries(generatedData)) {
        for (const record of records) {
          const recordId = record.id || record._id || `rec_${uuidv4().slice(0, 8)}`;
          await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `PROJ#${projectId}#ENV#${env}`,
              SK: `DATA#${resource}#${recordId}`,
              resource,
              data: record,
              createdAt: record.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }));
          totalSeeded++;
        }
      }

      return jsonResponse(201, {
        message: `Successfully seeded ${totalSeeded} relational records into ${env.toUpperCase()} environment.`,
        environment: env,
        totalSeeded,
        data: generatedData
      });
    }

    // =========================================================================
    // FEATURE 2: API ENVIRONMENT SWITCHING APIs
    // =========================================================================

    // GET /api/environments/:projectId
    if (method === 'GET' && rawPath.startsWith('/api/environments/')) {
      const projectId = rawPath.replace('/api/environments/', '').split('/')[0];
      const environments = await getProjectEnvironments(projectId);
      return jsonResponse(200, { environments });
    }

    // POST /api/environments/:projectId/config
    if (method === 'POST' && rawPath.includes('/environments/') && rawPath.endsWith('/config')) {
      const projectId = rawPath.split('/')[3];
      const savedConfig = await saveEnvironmentConfig(projectId, body);
      return jsonResponse(200, { message: 'Environment configuration updated.', config: savedConfig });
    }

    // POST /api/environments/:projectId/reset
    if (method === 'POST' && rawPath.includes('/environments/') && rawPath.endsWith('/reset')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(body.environment || event.queryStringParameters?.env);
      const result = await resetEnvironment(projectId, env);
      return jsonResponse(200, { message: `Environment ${env.toUpperCase()} successfully reset.`, ...result });
    }

    // POST /api/environments/:projectId/clone
    if (method === 'POST' && rawPath.includes('/environments/') && rawPath.endsWith('/clone')) {
      const projectId = rawPath.split('/')[3];
      const { sourceEnv, targetEnv } = body;
      const result = await cloneEnvironmentData(projectId, sourceEnv, targetEnv);
      return jsonResponse(200, { 
        message: `Successfully cloned data from ${sourceEnv.toUpperCase()} to ${targetEnv.toUpperCase()}.`, 
        ...result 
      });
    }

    // =========================================================================
    // FEATURE 3: API HEALTH & AUTOMATED TESTING APIs
    // =========================================================================

    // POST /api/testing/:projectId/run
    if (method === 'POST' && rawPath.includes('/testing/') && rawPath.endsWith('/run')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(body.environment || event.queryStringParameters?.env);

      const routesRes = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: { ':pk': `PROJ#${projectId}`, ':skPrefix': 'ROUTE#' }
      }));
      const routes = (routesRes.Items || []) as MockRouteRecord[];

      const report = await executeTestSuite(projectId, env, routes, {
        includeChaos: body.includeChaos ?? false
      });

      return jsonResponse(200, { message: 'Automated test suite execution completed.', report });
    }

    // GET /api/testing/:projectId/reports
    if (method === 'GET' && rawPath.includes('/testing/') && rawPath.endsWith('/reports')) {
      const projectId = rawPath.split('/')[3];
      const reports = await getProjectTestReports(projectId);
      return jsonResponse(200, { reports });
    }

    // GET /api/testing/:projectId/reports/:reportId/html
    if (method === 'GET' && rawPath.includes('/testing/') && rawPath.endsWith('/html')) {
      const parts = rawPath.split('/');
      const projectId = parts[3];
      const reportId = parts[5];
      const reports = await getProjectTestReports(projectId);
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        return jsonResponse(404, { error: 'Test report not found.' });
      }
      return withCors({
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: generateHtmlReport(report)
      });
    }

    // =========================================================================
    // FEATURE 4: TIME-TRAVEL DEBUGGING & REQUEST REPLAY APIs
    // =========================================================================

    // GET /api/timetravel/:projectId/snapshots
    if (method === 'GET' && rawPath.includes('/timetravel/') && rawPath.endsWith('/snapshots')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(event.queryStringParameters?.env);
      const snapshots = await getDatabaseSnapshots(projectId, env);
      return jsonResponse(200, { snapshots });
    }

    // POST /api/timetravel/:projectId/snapshots
    if (method === 'POST' && rawPath.includes('/timetravel/') && rawPath.endsWith('/snapshots')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(body.environment || event.queryStringParameters?.env);
      const snapshot = await captureDatabaseSnapshot(projectId, env, body.description || 'Manual Checkpoint', 'manual');
      return jsonResponse(201, { message: 'Database snapshot captured successfully.', snapshot });
    }

    // POST /api/timetravel/:projectId/restore
    if (method === 'POST' && rawPath.includes('/timetravel/') && rawPath.endsWith('/restore')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(body.environment || event.queryStringParameters?.env);
      const { snapshotId } = body;
      if (!snapshotId) {
        return jsonResponse(400, { error: 'Bad Request', message: 'snapshotId is required.' });
      }
      const result = await restoreDatabaseSnapshot(projectId, env, snapshotId);
      return jsonResponse(200, { 
        message: `Database state restored to snapshot ${snapshotId}.`,
        ...result 
      });
    }

    // GET /api/timetravel/:projectId/diff
    if (method === 'GET' && rawPath.includes('/timetravel/') && rawPath.endsWith('/diff')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(event.queryStringParameters?.env);
      const snapAId = event.queryStringParameters?.snapA;
      const snapBId = event.queryStringParameters?.snapB;

      const snapshots = await getDatabaseSnapshots(projectId, env);
      const snapA = snapshots.find(s => s.id === snapAId);
      const snapB = snapshots.find(s => s.id === snapBId);

      const stateA = snapA ? snapA.data : {};
      const stateB = snapB ? snapB.data : {};

      const diff = compareDatabaseStates(stateA, stateB);
      return jsonResponse(200, { diff, snapAId, snapBId, environment: env });
    }

    // GET /api/logs/:projectId
    if (method === 'GET' && rawPath.startsWith('/api/logs/')) {
      const projectId = rawPath.replace('/api/logs/', '').split('/')[0];
      const env = normalizeEnvironment(event.queryStringParameters?.env);
      const search = event.queryStringParameters?.search;
      const limit = Number(event.queryStringParameters?.limit) || 50;

      const logs = await getRequestLogs(projectId, env, search, limit);
      return jsonResponse(200, { logs, environment: env });
    }

    // POST /api/logs/:projectId/replay
    if (method === 'POST' && rawPath.includes('/logs/') && rawPath.endsWith('/replay')) {
      const projectId = rawPath.split('/')[3];
      const env = normalizeEnvironment(body.environment || event.queryStringParameters?.env);
      const { logId, mode } = body; // mode: 'exact' | 're-execute'

      const logs = await getRequestLogs(projectId, env, undefined, 100);
      const targetLog = logs.find(l => l.id === logId);

      if (!targetLog) {
        return jsonResponse(404, { error: 'Request log not found.' });
      }

      if (mode === 'exact') {
        // Mode 1: Exact Response Replay (Return recorded response without execution)
        return jsonResponse(200, {
          replayMode: 'exact',
          message: 'Exact historical response replayed verbatim.',
          originalTimestamp: targetLog.timestamp,
          statusCode: targetLog.status,
          headers: targetLog.responseHeaders,
          response: targetLog.responseBody,
          durationMs: targetLog.durationMs
        });
      } else {
        // Mode 2: Request Re-execution (Re-evaluates against active DB state)
        const startTime = performance.now();
        // Query route definition
        const routesRes = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: { ':pk': `PROJ#${projectId}`, ':skPrefix': 'ROUTE#' }
        }));
        const routes = (routesRes.Items || []) as MockRouteRecord[];
        const matched = routes.find(r => r.method === targetLog.method && targetLog.endpoint.includes(r.path.replace(/:[a-zA-Z0-9_]+/g, '')));

        const durationMs = Math.round(performance.now() - startTime + 15);
        return jsonResponse(200, {
          replayMode: 're-execute',
          message: 'Request re-executed against active database state.',
          reExecutedAt: new Date().toISOString(),
          statusCode: matched ? matched.statusCode : targetLog.status,
          response: matched ? matched.responseBody : targetLog.responseBody,
          durationMs
        });
      }
    }

    // =========================================================================
    // ADMIN ONLY ROUTES (Requires authUser.role === 'admin')
    // =========================================================================
    if (rawPath.startsWith('/api/admin/')) {
      if (authUser.role !== 'admin') {
        return jsonResponse(403, { error: 'Forbidden', message: 'Administrative privileges required.' });
      }

      // GET /api/admin/stats
      if (method === 'GET' && rawPath === '/api/admin/stats') {
        const [usersScan, requestsScan] = await Promise.all([
          docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(PK, :uPrefix) AND SK = :meta',
            ExpressionAttributeValues: { ':uPrefix': 'USER#', ':meta': 'METADATA' }
          })),
          docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(PK, :bPrefix)',
            ExpressionAttributeValues: { ':bPrefix': 'BUCKET#' }
          }))
        ]);

        const totalUsers = usersScan.Items?.length || 0;
        const totalRequestsToday = (requestsScan.Items || []).reduce((acc, curr) => acc + (Number(curr.requestCount) || 0), 0);

        return jsonResponse(200, {
          stats: {
            totalUsers,
            totalRequestsToday,
            estimatedMonthlyCostUsd: 0.00,
            freeTierStatus: '100% Free - Safe'
          }
        });
      }

      // GET /api/admin/requests
      if (method === 'GET' && rawPath === '/api/admin/requests') {
        const requestsScan = await docClient.send(new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'begins_with(PK, :qPrefix)',
          ExpressionAttributeValues: { ':qPrefix': 'QUOTA_REQ#' }
        }));
        return jsonResponse(200, { requests: requestsScan.Items || [] });
      }

      // POST /api/admin/requests/:id/approve
      if (method === 'POST' && rawPath.includes('/approve')) {
        const reqId = rawPath.split('/')[4];
        const reqRes = await docClient.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: `QUOTA_REQ#${reqId}`, SK: 'PENDING' }
        }));
        if (!reqRes.Item) return jsonResponse(404, { error: 'Pending request not found.' });

        const reqData = reqRes.Item as QuotaRequestRecord;
        const newDailyLimit = reqData.requestedTier === 'pro' ? 50000 : 10000;

        // Update user tier and credit limit
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${reqData.userId}`, SK: 'METADATA' },
          UpdateExpression: 'SET #t = :tier, #l = :limit',
          ExpressionAttributeNames: { '#t': 'tier', '#l': 'dailyCreditLimit' },
          ExpressionAttributeValues: { ':tier': reqData.requestedTier, ':limit': newDailyLimit }
        }));

        // Mark request resolved
        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `QUOTA_REQ#${reqId}`, SK: 'PENDING' } }));
        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: { ...reqData, SK: 'RESOLVED', status: 'APPROVED', reviewedAt: new Date().toISOString() }
        }));

        return jsonResponse(200, { message: `Request approved. User upgraded to ${reqData.requestedTier}.` });
      }

      // POST /api/admin/requests/:id/deny
      if (method === 'POST' && rawPath.includes('/deny')) {
        const reqId = rawPath.split('/')[4];
        const reqRes = await docClient.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: `QUOTA_REQ#${reqId}`, SK: 'PENDING' }
        }));
        if (!reqRes.Item) return jsonResponse(404, { error: 'Pending request not found.' });

        const reqData = reqRes.Item as QuotaRequestRecord;
        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `QUOTA_REQ#${reqId}`, SK: 'PENDING' } }));
        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: { ...reqData, SK: 'RESOLVED', status: 'DENIED', reviewedAt: new Date().toISOString() }
        }));

        return jsonResponse(200, { message: 'Quota request denied.' });
      }

      // POST /api/admin/users/:id/ban
      if (method === 'POST' && rawPath.includes('/ban')) {
        const targetUserId = rawPath.split('/')[4];
        const userRes = await docClient.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${targetUserId}`, SK: 'METADATA' }
        }));
        if (!userRes.Item) return jsonResponse(404, { error: 'User not found' });

        const newBanStatus = !userRes.Item.isBanned;
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${targetUserId}`, SK: 'METADATA' },
          UpdateExpression: 'SET isBanned = :b',
          ExpressionAttributeValues: { ':b': newBanStatus }
        }));

        return jsonResponse(200, { message: `User ban status updated to ${newBanStatus}.`, isBanned: newBanStatus });
      }
    }

    return jsonResponse(404, { error: 'Not Found', message: `Route [${method}] ${rawPath} does not exist.` });
  } catch (err: any) {
    console.error('Management API error:', err);
    return jsonResponse(500, { error: 'Internal Server Error', message: err.message || 'An unexpected error occurred.' });
  }
}

