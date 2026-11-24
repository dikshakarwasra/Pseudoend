import { GetCommand, PutCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { EnvironmentType, EnvironmentConfig } from '../types/index.js';

export const ENVIRONMENTS: EnvironmentType[] = ['sandbox', 'development', 'staging', 'live'];

export const DEFAULT_ENV_CONFIGS: Record<EnvironmentType, Omit<EnvironmentConfig, 'updatedAt'>> = {
  sandbox: {
    name: 'sandbox',
    latencyMs: 50,
    failureRatePercent: 0,
    isEnabled: true
  },
  development: {
    name: 'development',
    latencyMs: 120,
    failureRatePercent: 0,
    isEnabled: true
  },
  staging: {
    name: 'staging',
    latencyMs: 350,
    failureRatePercent: 5,
    isEnabled: true
  },
  live: {
    name: 'live',
    latencyMs: 80,
    failureRatePercent: 0,
    isEnabled: true
  }
};

/**
 * Normalizes input environment string to a valid EnvironmentType.
 */
export function normalizeEnvironment(envInput?: string | null): EnvironmentType {
  if (!envInput) return 'sandbox';
  const clean = envInput.toLowerCase().trim();
  if (ENVIRONMENTS.includes(clean as EnvironmentType)) {
    return clean as EnvironmentType;
  }
  return 'sandbox';
}

/**
 * Fetches all environment configurations and their current record counts for a project.
 */
export async function getProjectEnvironments(projectId: string): Promise<EnvironmentConfig[]> {
  const configs: EnvironmentConfig[] = [];

  for (const env of ENVIRONMENTS) {
    try {
      const res = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PROJ#${projectId}`,
          SK: `ENV#${env}`
        }
      }));

      // Count records in this environment
      const countRes = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `PROJ#${projectId}#ENV#${env}`,
          ':skPrefix': 'DATA#'
        },
        Select: 'COUNT'
      }));

      const recordCount = countRes.Count || 0;

      if (res.Item) {
        configs.push({
          ...(res.Item as EnvironmentConfig),
          recordCount
        });
      } else {
        configs.push({
          ...DEFAULT_ENV_CONFIGS[env],
          recordCount,
          updatedAt: new Date().toISOString()
        });
      }
    } catch {
      configs.push({
        ...DEFAULT_ENV_CONFIGS[env],
        recordCount: 0,
        updatedAt: new Date().toISOString()
      });
    }
  }

  return configs;
}

/**
 * Saves environment configuration (latency, chaos failure rate).
 */
export async function saveEnvironmentConfig(
  projectId: string,
  config: Partial<EnvironmentConfig> & { name: EnvironmentType }
): Promise<EnvironmentConfig> {
  const normalized = normalizeEnvironment(config.name);
  const fullConfig: EnvironmentConfig = {
    ...DEFAULT_ENV_CONFIGS[normalized],
    ...config,
    name: normalized,
    updatedAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `PROJ#${projectId}`,
      SK: `ENV#${normalized}`,
      ...fullConfig
    }
  }));

  return fullConfig;
}

/**
 * Retrieves all mock data records for a specific environment and resource.
 */
export async function getEnvironmentRecords(
  projectId: string,
  environment: EnvironmentType,
  resource?: string
): Promise<any[]> {
  const env = normalizeEnvironment(environment);
  const skPrefix = resource ? `DATA#${resource.toLowerCase()}#` : 'DATA#';

  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PROJ#${projectId}#ENV#${env}`,
      ':skPrefix': skPrefix
    }
  }));

  return (res.Items || []).map(item => item.data || item);
}

/**
 * Resets an environment by clearing all stateful mock records in that environment.
 */
export async function resetEnvironment(
  projectId: string,
  environment: EnvironmentType
): Promise<{ deletedCount: number }> {
  const env = normalizeEnvironment(environment);
  const queryRes = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PROJ#${projectId}#ENV#${env}`,
      ':skPrefix': 'DATA#'
    }
  }));

  const items = queryRes.Items || [];
  let deletedCount = 0;

  for (const item of items) {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));
    deletedCount++;
  }

  return { deletedCount };
}

/**
 * Clones all stateful data from source environment to target environment.
 */
export async function cloneEnvironmentData(
  projectId: string,
  sourceEnvInput: EnvironmentType,
  targetEnvInput: EnvironmentType
): Promise<{ clonedCount: number }> {
  const sourceEnv = normalizeEnvironment(sourceEnvInput);
  const targetEnv = normalizeEnvironment(targetEnvInput);

  if (sourceEnv === targetEnv) {
    throw new Error('Source and target environment must be different.');
  }

  // First reset target
  await resetEnvironment(projectId, targetEnv);

  // Read source records
  const sourceRes = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PROJ#${projectId}#ENV#${sourceEnv}`,
      ':skPrefix': 'DATA#'
    }
  }));

  const sourceItems = sourceRes.Items || [];
  let clonedCount = 0;

  for (const item of sourceItems) {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...item,
        PK: `PROJ#${projectId}#ENV#${targetEnv}`,
        clonedFrom: sourceEnv,
        updatedAt: new Date().toISOString()
      }
    }));
    clonedCount++;
  }

  return { clonedCount };
}
