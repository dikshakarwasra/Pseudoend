import { describe, it, expect, vi } from 'vitest';
import { executeTestSuite, generateHtmlReport } from '../src/engine/testRunner.js';
import { MockRouteRecord, TestReportRecord } from '../src/types/index.js';

// Mock docClient to prevent calling real DynamoDB during unit tests
vi.mock('../src/lib/dynamodb.js', () => ({
  docClient: {
    send: vi.fn().mockResolvedValue({})
  },
  TABLE_NAME: 'pseudoend-test'
}));

describe('Automated Health & Testing Engine', () => {
  const routes: MockRouteRecord[] = [
    {
      projectId: 'proj_test',
      method: 'GET',
      path: '/api/v1/users',
      statusCode: 200,
      headers: {},
      responseBody: [{ id: 'usr_1', name: 'Alice' }],
      latencyMs: 10,
      failureRatePercent: 0,
      isEcho: false,
      isStateful: false,
      ttl: 999999,
      createdAt: new Date().toISOString()
    },
    {
      projectId: 'proj_test',
      method: 'POST',
      path: '/api/v1/users',
      statusCode: 201,
      headers: {},
      responseBody: { id: 'usr_2', name: 'Bob' },
      latencyMs: 20,
      failureRatePercent: 0,
      isEcho: false,
      isStateful: false,
      ttl: 999999,
      createdAt: new Date().toISOString()
    }
  ];

  it('executes test suite and measures latency and status correctly', async () => {
    const report = await executeTestSuite('proj_test', 'sandbox', routes);

    expect(report.totalTests).toBe(2);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.avgDurationMs).toBeGreaterThan(0);
    expect(report.environment).toBe('sandbox');
    expect(report.results.length).toBe(2);
    expect(report.results[0].expectedStatus).toBe(200);
    expect(report.results[0].actualStatus).toBe(200);
    expect(report.results[1].expectedStatus).toBe(201);
  });

  it('generates well-formatted standalone HTML report', () => {
    const dummyReport: TestReportRecord = {
      id: 'rep_123',
      projectId: 'proj_test',
      environment: 'staging',
      timestamp: '2026-11-24T12:00:00Z',
      totalTests: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      avgDurationMs: 45,
      minDurationMs: 45,
      maxDurationMs: 45,
      results: [
        {
          routeId: 'GET_/users',
          method: 'GET',
          path: '/users',
          expectedStatus: 200,
          actualStatus: 200,
          passed: true,
          durationMs: 45
        }
      ]
    };

    const html = generateHtmlReport(dummyReport);
    expect(html).toContain('Pseudoend API Health & Testing Report');
    expect(html).toContain('rep_123');
    expect(html).toContain('STAGING');
    expect(html).toContain('100%');
  });
});
