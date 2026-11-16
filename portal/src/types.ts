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

