import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { 
  EnvironmentType, 
  DatabaseSnapshotRecord, 
  RequestLogRecord, 
  HttpMethod 
} from '../types/index.js';
import { normalizeEnvironment, getEnvironmentRecords } from './environmentManager.js';

/**
 * Redacts sensitive authentication tokens and passwords from headers and payloads.
 */
export function sanitizePayload(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    try {
      return sanitizePayload(JSON.parse(data));
    } catch {
      return data;
    }
  }

  if (Array.isArray(data)) {
    return data.map(sanitizePayload);
  }

  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('password') || 
        lower.includes('secret') || 
        lower === 'token' || 
        lower === 'authorization' ||
        lower.includes('api_key') ||
        lower.includes('apikey')
      ) {
        clean[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = sanitizePayload(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }

  return data;
}

/**
 * Records an incoming request and its outgoing response into the audit log.
 */
export async function recordRequestLog(
  projectId: string,
  environmentInput: EnvironmentType,
  log: {
    method: HttpMethod;
    endpoint: string;
    status: number;
    durationMs: number;
    requestHeaders?: Record<string, string>;
    requestBody?: any;
    responseHeaders?: Record<string, string>;
    responseBody?: any;
    sourceIp?: string;
  }
): Promise<RequestLogRecord> {
  const environment = normalizeEnvironment(environmentInput);
  const timestamp = new Date().toISOString();
  const id = `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

  const cleanLog: RequestLogRecord = {
    id,
    projectId,
    environment,
    timestamp,
    method: log.method,
    endpoint: log.endpoint,
    status: log.status,
    durationMs: log.durationMs,
    requestHeaders: sanitizePayload(log.requestHeaders || {}),
    requestBody: sanitizePayload(log.requestBody),
    responseHeaders: log.responseHeaders || {},
    responseBody: log.responseBody,
    sourceIp: log.sourceIp || '127.0.0.1'
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PROJ#${projectId}#ENV#${environment}`,
        SK: `LOG#${timestamp}#${id}`,
        ...cleanLog
      }
    }));
  } catch (err) {
    console.error('Failed to persist request log:', err);
  }

  return cleanLog;
}

/**
 * Retrieves historical request logs for an environment.
 */
export async function getRequestLogs(
  projectId: string,
  environmentInput: EnvironmentType,
  search?: string,
  limit = 50
): Promise<RequestLogRecord[]> {
  const environment = normalizeEnvironment(environmentInput);

  try {
    const res = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `PROJ#${projectId}#ENV#${environment}`,
        ':skPrefix': 'LOG#'
      },
      ScanIndexForward: false, // Descending order (newest first)
      Limit: limit
    }));

    let logs = (res.Items || []) as RequestLogRecord[];

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l => 
        l.endpoint.toLowerCase().includes(q) ||
        l.method.toLowerCase().includes(q) ||
        l.status.toString().includes(q)
      );
    }

    return logs;
  } catch {
    return [];
  }
}

/**
 * Captures a complete database snapshot of all stateful mock records in the environment.
 */
export async function captureDatabaseSnapshot(
  projectId: string,
  environmentInput: EnvironmentType,
  description: string,
  trigger: 'auto' | 'manual' | 'pre-restore' = 'manual'
): Promise<DatabaseSnapshotRecord> {
  const environment = normalizeEnvironment(environmentInput);
  const timestamp = new Date().toISOString();
  const id = `snap_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

  // Query all data records in this environment
  const queryRes = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PROJ#${projectId}#ENV#${environment}`,
      ':skPrefix': 'DATA#'
    }
  }));

  const state: Record<string, any[]> = {};
  let recordCount = 0;

  for (const item of (queryRes.Items || [])) {
    const resource = item.resource || 'records';
    if (!state[resource]) {
      state[resource] = [];
    }
    state[resource].push(item.data || item);
    recordCount++;
  }

  const snapshot: DatabaseSnapshotRecord = {
    id,
    projectId,
    environment,
    timestamp,
    description: description || `Snapshot at ${new Date().toLocaleTimeString()}`,
    trigger,
    recordCount,
    data: state,
    createdAt: timestamp
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `PROJ#${projectId}#ENV#${environment}`,
      SK: `SNAPSHOT#${timestamp}#${id}`,
      ...snapshot
    }
  }));

  return snapshot;
}

/**
 * Fetches all saved database snapshots for an environment.
 */
export async function getDatabaseSnapshots(
  projectId: string,
  environmentInput: EnvironmentType
): Promise<DatabaseSnapshotRecord[]> {
  const environment = normalizeEnvironment(environmentInput);

  try {
    const res = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `PROJ#${projectId}#ENV#${environment}`,
        ':skPrefix': 'SNAPSHOT#'
      },
      ScanIndexForward: false, // Newest first
      Limit: 30
    }));

    return (res.Items || []) as DatabaseSnapshotRecord[];
  } catch {
    return [];
  }
}

/**
 * Restores an earlier database snapshot into the active environment.
 * Automatically creates a safety pre-restore checkpoint first.
 */
export async function restoreDatabaseSnapshot(
  projectId: string,
  environmentInput: EnvironmentType,
  snapshotId: string
): Promise<{
  success: boolean;
  restoredRecordCount: number;
  safetyCheckpointId: string;
}> {
  const environment = normalizeEnvironment(environmentInput);

  // 1. Find the target snapshot
  const snapshots = await getDatabaseSnapshots(projectId, environment);
  const targetSnapshot = snapshots.find(s => s.id === snapshotId);

  if (!targetSnapshot) {
    throw new Error(`Snapshot "${snapshotId}" not found in environment "${environment}".`);
  }

  // 2. Safety checkpoint of current state before restoration
  const safetyCheckpoint = await captureDatabaseSnapshot(
    projectId,
    environment,
    `Safety checkpoint before restoring "${targetSnapshot.description || snapshotId}"`,
    'pre-restore'
  );

  // 3. Clear existing DATA records in this environment
  const existingRes = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PROJ#${projectId}#ENV#${environment}`,
      ':skPrefix': 'DATA#'
    }
  }));

  for (const item of (existingRes.Items || [])) {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: item.PK, SK: item.SK }
    }));
  }

  // 4. Restore records from snapshot
  let restoredRecordCount = 0;
  for (const [resource, records] of Object.entries(targetSnapshot.data || {})) {
    for (const record of records) {
      const recordId = record.id || record._id || `rec_${uuidv4().slice(0, 8)}`;
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `PROJ#${projectId}#ENV#${environment}`,
          SK: `DATA#${resource}#${recordId}`,
          resource,
          data: record,
          restoredFromSnapshot: snapshotId,
          updatedAt: new Date().toISOString()
        }
      }));
      restoredRecordCount++;
    }
  }

  return {
    success: true,
    restoredRecordCount,
    safetyCheckpointId: safetyCheckpoint.id
  };
}

/**
 * Computes deep state differences between two database states.
 */
export function compareDatabaseStates(
  stateA: Record<string, any[]>,
  stateB: Record<string, any[]>
): {
  added: Array<{ resource: string; item: any }>;
  removed: Array<{ resource: string; item: any }>;
  modified: Array<{ resource: string; id: string; before: any; after: any; changes: string[] }>;
} {
  const added: Array<{ resource: string; item: any }> = [];
  const removed: Array<{ resource: string; item: any }> = [];
  const modified: Array<{ resource: string; id: string; before: any; after: any; changes: string[] }> = [];

  const allResources = Array.from(new Set([...Object.keys(stateA || {}), ...Object.keys(stateB || {})]));

  for (const res of allResources) {
    const listA = stateA?.[res] || [];
    const listB = stateB?.[res] || [];

    const mapA = new Map<string, any>(listA.map(item => [item.id || item._id, item]));
    const mapB = new Map<string, any>(listB.map(item => [item.id || item._id, item]));

    // Check for removed or modified
    for (const [id, itemA] of mapA.entries()) {
      if (!mapB.has(id)) {
        removed.push({ resource: res, item: itemA });
      } else {
        const itemB = mapB.get(id);
        const changes: string[] = [];
        const allKeys = Array.from(new Set([...Object.keys(itemA), ...Object.keys(itemB)]));
        for (const k of allKeys) {
          if (k === 'updatedAt' || k === 'createdAt') continue;
          if (JSON.stringify(itemA[k]) !== JSON.stringify(itemB[k])) {
            changes.push(k);
          }
        }
        if (changes.length > 0) {
          modified.push({ resource: res, id, before: itemA, after: itemB, changes });
        }
      }
    }

    // Check for added
    for (const [id, itemB] of mapB.entries()) {
      if (!mapA.has(id)) {
        added.push({ resource: res, item: itemB });
      }
    }
  }

  return { added, removed, modified };
}
