import { describe, it, expect } from 'vitest';
import { analyzeSchemaFromRoutes, generateRelationalMockData, extractResourceName } from '../src/engine/relationshipEngine.js';
import { MockRouteRecord } from '../src/types/index.js';

describe('Smart Data Relationship Engine', () => {
  it('extracts clean resource names from various route paths', () => {
    expect(extractResourceName('/api/v1/users')).toBe('users');
    expect(extractResourceName('/api/users/:id')).toBe('users');
    expect(extractResourceName('/posts/{postId}/comments')).toBe('posts');
    expect(extractResourceName('/products')).toBe('products');
  });

  it('detects 1:N relationship between users and posts from route schemas', () => {
    const mockRoutes: MockRouteRecord[] = [
      {
        projectId: 'proj_1',
        method: 'GET',
        path: '/api/users',
        statusCode: 200,
        headers: {},
        responseBody: [
          { id: 'usr_1', name: 'Alice', email: 'alice@test.com' },
          { id: 'usr_2', name: 'Bob', email: 'bob@test.com' }
        ],
        latencyMs: 0,
        failureRatePercent: 0,
        isEcho: false,
        isStateful: false,
        ttl: 1234567,
        createdAt: new Date().toISOString()
      },
      {
        projectId: 'proj_1',
        method: 'GET',
        path: '/api/posts',
        statusCode: 200,
        headers: {},
        responseBody: [
          { id: 'post_1', userId: 'usr_1', title: 'First Post', content: 'Hello' },
          { id: 'post_2', userId: 'usr_2', title: 'Second Post', content: 'World' }
        ],
        latencyMs: 0,
        failureRatePercent: 0,
        isEcho: false,
        isStateful: false,
        ttl: 1234567,
        createdAt: new Date().toISOString()
      }
    ];

    const { nodes, edges } = analyzeSchemaFromRoutes(mockRoutes);

    expect(nodes.length).toBe(2);
    expect(nodes.map(n => n.id).sort()).toEqual(['posts', 'users']);

    // Check detected edge
    expect(edges.length).toBe(1);
    expect(edges[0].source).toBe('users');
    expect(edges[0].target).toBe('posts');
    expect(edges[0].targetField).toBe('userId');
    expect(edges[0].type).toBe('1:N');
  });

  it('generates interconnected mock data with referential integrity', () => {
    const nodes = [
      {
        id: 'users',
        name: 'Users',
        resource: 'users',
        fields: [
          { name: 'id', type: 'string', isPrimary: true, required: true },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'email' }
        ],
        recordCount: 5
      },
      {
        id: 'posts',
        name: 'Posts',
        resource: 'posts',
        fields: [
          { name: 'id', type: 'string', isPrimary: true, required: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'title', type: 'string' }
        ],
        recordCount: 5
      }
    ];

    const edges = [
      {
        id: 'rel_users_posts_userId',
        source: 'users',
        target: 'posts',
        sourceField: 'id',
        targetField: 'userId',
        type: '1:N' as const,
        label: '1 : N (Users -> Posts)'
      }
    ];

    const data = generateRelationalMockData(nodes, edges, 5);

    expect(data.users.length).toBe(5);
    expect(data.posts.length).toBe(5);

    const userIds = data.users.map(u => u.id);
    expect(userIds).toEqual(['use_1', 'use_2', 'use_3', 'use_4', 'use_5']);

    // Every post's userId must belong to the generated userIds!
    for (const post of data.posts) {
      expect(userIds).toContain(post.userId);
    }
  });
});
