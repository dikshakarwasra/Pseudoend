import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { APIGatewayEventV2, APIGatewayResponse, UserRecord, ProjectRecord } from '../types/index.js';
import { withCors } from './cors.js';

export interface AuthContext {
  user: UserRecord;
  project: ProjectRecord;
  apiKey: string;
}

/**
 * Extracts and validates the API Key from headers or query parameters.
 * Rejects unauthorized or banned requests immediately before executing routes.
 */
export async function authenticateApiKey(
  event: APIGatewayEventV2
): Promise<{ auth?: AuthContext; errorResponse?: APIGatewayResponse }> {
  // 1. Extract API key from headers (case-insensitive) or query string
  const headers = event.headers || {};
  let apiKey =
    headers['x-pseudoend-key'] ||
    headers['X-Pseudoend-Key'] ||
    headers['x-sudoend-key'] ||
    headers['X-Sudoend-Key'] ||
    headers['x-api-key'] ||
    headers['X-Api-Key'];

  if (!apiKey && headers['authorization']) {
    const authHeader = headers['authorization'];
    if (authHeader.startsWith('Bearer sk_')) {
      apiKey = authHeader.replace('Bearer ', '').trim();
    }
  }

  if (!apiKey && event.queryStringParameters) {
    apiKey = event.queryStringParameters['key'] || event.queryStringParameters['apiKey'];
  }

  if (!apiKey) {
    return {
      errorResponse: withCors({
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing API key. Provide your key via header "x-pseudoend-key: sk_test_..." or query param "?key=sk_test_..."'
        })
      })
    };
  }

  try {
    // 2. Fetch API Key record from DynamoDB
    const keyResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `KEY#${apiKey}`,
          SK: 'METADATA'
        }
      })
    );

    if (!keyResult.Item || keyResult.Item.status !== 'active') {
      return {
        errorResponse: withCors({
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid or revoked API key.'
          })
        })
      };
    }

    const { userId, projectId } = keyResult.Item;

    // 3. Fetch User and Project records
    const [userRes, projRes] = await Promise.all([
      docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: 'METADATA'
          }
        })
      ),
      docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `PROJ#${projectId}`,
            SK: 'METADATA'
          }
        })
      )
    ]);

    const user = userRes.Item as UserRecord | undefined;
    const project = projRes.Item as ProjectRecord | undefined;

    if (!user || !project) {
      return {
        errorResponse: withCors({
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Associated user account or project was not found.'
          })
        })
      };
    }

    // 4. Verify user is not banned
    if (user.isBanned) {
      return {
        errorResponse: withCors({
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Forbidden',
            message: 'This account has been suspended by the administrator.'
          })
        })
      };
    }

    return {
      auth: {
        user,
        project,
        apiKey
      }
    };
  } catch (err: any) {
    console.error('Authentication error:', err);
    return {
      errorResponse: withCors({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Unable to authenticate API key at this time.'
        })
      })
    };
  }
}

