/**
 * sudoend — Core Type Definitions & Data Models
 * Single source of truth for backend services, DynamoDB models, and API contracts.
 */

export type UserRole = 'user' | 'admin';
export type UserTier = 'free' | 'developer' | 'pro';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type QuotaRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

/**
 * User Account Entity (DynamoDB: PK: USER#<userId>, SK: METADATA)
 */
export interface UserRecord {
  id: string;                      // Unique user ID (e.g. usr_123abc)
  email: string;                   // Normalized lowercase email
  passwordHash: string;            // bcrypt hashed password
  role: UserRole;                  // 'user' or 'admin'
  tier: UserTier;                  // Current active tier
  dailyCreditLimit: number;        // e.g. 1000 for free, 10000 for developer, 50000 for pro
  isBanned: boolean;               // True if suspended by admin
  createdAt: string;               // ISO 8601 string
  updatedAt?: string;              // ISO 8601 string
}

/**
 * Project Entity (DynamoDB: PK: PROJ#<projectId>, SK: METADATA)
 */
export interface ProjectRecord {
  id: string;                      // Unique project ID (e.g. proj_456def)
  userId: string;                  // Owner's User ID
  name: string;                    // Human-readable project name
  apiKeyHash: string;              // Hashed secret key for secure DB storage
  rawApiKeyPrefix: string;         // e.g. 'sk_test_a1b2...' for display in UI
  createdAt: string;               // ISO 8601 string
  ttl?: number;                    // Optional epoch timestamp for ephemeral cleanup
}

/**
 * Mock Route Entity (DynamoDB: PK: PROJ#<projectId>, SK: ROUTE#<METHOD>#<PATH>)
 */
export interface MockRouteRecord {
  projectId: string;               // Parent project ID
  method: HttpMethod;              // HTTP verb
  path: string;                    // e.g. '/api/v1/users/:id' or '/products'
  statusCode: number;              // Returned HTTP status code (200, 201, 400, etc.)
  headers: Record<string, string>; // Custom headers (Content-Type, x-custom, etc.)
  responseBody: any;               // Static JSON or templated object with dynamic tags
  latencyMs: number;               // Simulated network latency (0 - 5000ms)
  failureRatePercent: number;      // Chaos percentage (0 - 100%) for simulated 500 errors
  isEcho: boolean;                 // If true, reflects incoming request payload and query params
  isStateful: boolean;             // If true, simulates temporary in-memory CRUD state in DDB
  ttl: number;                     // Unix epoch seconds (Default: now + 7 days for auto-purge)
  createdAt: string;               // ISO 8601 string
  updatedAt?: string;              // ISO 8601 string
}

/**
 * Quota Upgrade Request Entity (DynamoDB: PK: QUOTA_REQ#<reqId>, SK: PENDING|RESOLVED)
 */
export interface QuotaRequestRecord {
  id: string;                      // Unique request ID
  userId: string;                  // Requesting user ID
  userEmail: string;               // Contact email
  currentTier: UserTier;           // Tier at time of request
  requestedTier: UserTier;         // Desired tier ('developer' or 'pro')
  reason: string;                  // Project description and justification
  status: QuotaRequestStatus;      // 'PENDING' | 'APPROVED' | 'DENIED'
  submittedAt: string;             // ISO 8601 string
  reviewedAt?: string;             // ISO 8601 string
  reviewedBy?: string;             // Admin user ID
  reviewerNotes?: string;          // Optional feedback from admin
}

/**
 * Rate Limiting Atomic Token Bucket Entity (DynamoDB: PK: BUCKET#<apiKey>#<YYYY-MM-DD>, SK: COUNTER)
 */
export interface RateLimitBucketRecord {
  PK: string;                      // Partition Key
  SK: string;                      // Sort Key
  requestCount: number;            // Current number of requests handled in this window
  TTL: number;                     // Unix epoch seconds when this record auto-deletes
}

/**
 * Standard AWS API Gateway HTTP API v2 Event & Response Contracts
 */
export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

export interface APIGatewayEventV2 {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
  requestContext: {
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    accountId: string;
    apiId: string;
    stage: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
  pathParameters?: Record<string, string | undefined>;
}

/**
 * Auth Context extracted from JWT
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  exp: number;
  iat: number;
}

