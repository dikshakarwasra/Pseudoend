import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { APIGatewayResponse, UserRecord } from '../types/index.js';
import { withCors } from './cors.js';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  errorResponse?: APIGatewayResponse;
}

/**
 * Enforces atomic token-bucket rate limiting using native DynamoDB updates.
 * Guarantees zero race conditions without provisioned Redis instances.
 */
export async function checkRateLimit(
  apiKey: string,
  user: UserRecord
): Promise<RateLimitResult> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // e.g. "2026-11-16"
  const bucketKey = `BUCKET#${apiKey}#${dateStr}`;
  const limit = user.dailyCreditLimit || 1000;

  // TTL: Expire the counter record 48 hours later to prevent database bloat
  const ttlEpoch = Math.floor(Date.now() / 1000) + 172800; // 48 hours

  try {
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: bucketKey,
          SK: 'COUNTER'
        },
        UpdateExpression: 'ADD requestCount :inc SET #ttl = if_not_exists(#ttl, :expiry)',
        ExpressionAttributeNames: {
          '#ttl': 'TTL'
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':expiry': ttlEpoch
        },
        ReturnValues: 'UPDATED_NEW'
      })
    );

    const currentCount = Number(updateResult.Attributes?.requestCount || 1);
    const remaining = Math.max(0, limit - currentCount);

    if (currentCount > limit) {
      return {
        allowed: false,
        currentCount,
        limit,
        remaining: 0,
        errorResponse: withCors({
          statusCode: 429,
          headers: {
            'Content-Type': 'application/json',
            'x-ratelimit-limit': limit.toString(),
            'x-ratelimit-remaining': '0',
            'Retry-After': '86400'
          },
          body: JSON.stringify({
            error: 'Too Many Requests',
            message: `Daily credit quota of ${limit.toLocaleString()} requests exceeded. Upgrade requests can be submitted for free via the sudoend dashboard.`,
            tier: user.tier,
            dailyLimit: limit,
            currentCount
          })
        })
      };
    }

    return {
      allowed: true,
      currentCount,
      limit,
      remaining
    };
  } catch (err: any) {
    console.error('Rate limiting error:', err);
    // In fail-open or fail-closed decisions: allow in emergency, but log
    return {
      allowed: true,
      currentCount: 0,
      limit,
      remaining: limit
    };
  }
}

