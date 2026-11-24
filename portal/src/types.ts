export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  tier: 'free' | 'developer' | 'pro';
  dailyCreditLimit: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  apiKeyHash?: string;
  rawApiKeyPrefix?: string;
  apiKey?: string;
  createdAt: string;
}

export interface MockRoute {
  projectId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
  path: string;
  statusCode: number;
  headers: Record<string, string>;
  responseBody: any;
  latencyMs: number;
  failureRatePercent: number;
  isEcho: boolean;
  isStateful: boolean;
  ttl: number;
  createdAt?: string;
  SK?: string;
}

export interface QuotaRequest {
  id: string;
  userId: string;
  userEmail: string;
  currentTier: string;
  requestedTier: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  submittedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalRequestsToday: number;
  estimatedMonthlyCostUsd: number;
  freeTierStatus: string;
}

export type EnvironmentType = 'sandbox' | 'development' | 'staging' | 'live';

export interface EnvironmentConfig {
  name: EnvironmentType;
  latencyMs: number;
  failureRatePercent: number;
  isEnabled: boolean;
  recordCount?: number;
  updatedAt: string;
}

export interface EntityField {
  name: string;
  type: string;
  required?: boolean;
  isPrimary?: boolean;
}

export interface EntityNode {
  id: string;
  name: string;
  resource: string;
  fields: EntityField[];
  recordCount: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  sourceField: string;
  targetField: string;
  type: '1:1' | '1:N' | 'N:M';
  label: string;
}

export interface SchemaRelationshipsRecord {
  projectId: string;
  nodes: EntityNode[];
  edges: RelationshipEdge[];
  updatedAt: string;
}

export interface DatabaseSnapshotRecord {
  id: string;
  projectId: string;
  environment: EnvironmentType;
  timestamp: string;
  description: string;
  trigger: 'auto' | 'manual' | 'pre-restore';
  recordCount: number;
  data: Record<string, any[]>;
  createdAt: string;
}

export interface RequestLogRecord {
  id: string;
  projectId: string;
  environment: EnvironmentType;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  sourceIp?: string;
}

export interface TestResultItem {
  routeId: string;
  method: string;
  path: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface TestReportRecord {
  id: string;
  projectId: string;
  environment: EnvironmentType;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  results: TestResultItem[];
}


