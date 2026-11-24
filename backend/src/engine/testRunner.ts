import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../lib/dynamodb.js';
import { 
  EnvironmentType, 
  MockRouteRecord, 
  TestReportRecord, 
  TestResultItem 
} from '../types/index.js';
import { normalizeEnvironment } from './environmentManager.js';

export interface TestRunOptions {
  includeChaos?: boolean;
  timeoutMs?: number;
}

/**
 * Executes the automated API test suite across all configured mock routes.
 */
export async function executeTestSuite(
  projectId: string,
  environmentInput: EnvironmentType,
  routes: MockRouteRecord[],
  options: TestRunOptions = {}
): Promise<TestReportRecord> {
  const environment = normalizeEnvironment(environmentInput);
  const results: TestResultItem[] = [];
  const durations: number[] = [];

  for (const route of routes) {
    const routeId = `${route.method}_${route.path}`;
    const start = performance.now();

    try {
      // In-engine execution verification
      const expectedStatus = route.statusCode || 200;
      let actualStatus = expectedStatus;
      let passed = true;
      let error: string | undefined = undefined;

      // Check simulated chaos
      if (options.includeChaos && route.failureRatePercent > 0) {
        const rand = Math.random() * 100;
        if (rand < route.failureRatePercent) {
          actualStatus = 500;
          passed = false;
          error = `Chaos fault injection triggered simulated 500 Internal Server Error (${route.failureRatePercent}% threshold).`;
        }
      }

      // Check latency expectation
      const simulatedDuration = route.latencyMs || 25;
      const durationMs = Math.round(performance.now() - start + simulatedDuration);
      durations.push(durationMs);

      // Validate response structure
      if (passed) {
        if (route.responseBody === undefined || route.responseBody === null) {
          passed = false;
          error = 'Response body is empty or undefined.';
        }
      }

      results.push({
        routeId,
        method: route.method,
        path: route.path,
        expectedStatus,
        actualStatus,
        passed,
        durationMs,
        error
      });
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      durations.push(durationMs);
      results.push({
        routeId,
        method: route.method,
        path: route.path,
        expectedStatus: route.statusCode || 200,
        actualStatus: 500,
        passed: false,
        durationMs,
        error: err.message || 'Execution error during endpoint test.'
      });
    }
  }

  const totalTests = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = totalTests - passed;
  const skipped = 0;

  const validDurations = durations.length > 0 ? durations : [0];
  const minDurationMs = Math.min(...validDurations);
  const maxDurationMs = Math.max(...validDurations);
  const avgDurationMs = Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length);

  const reportId = `rep_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const report: TestReportRecord = {
    id: reportId,
    projectId,
    environment,
    timestamp: new Date().toISOString(),
    totalTests,
    passed,
    failed,
    skipped,
    avgDurationMs,
    minDurationMs,
    maxDurationMs,
    results
  };

  // Persist report in DynamoDB
  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PROJ#${projectId}`,
        SK: `TEST_REPORT#${report.timestamp}#${reportId}`,
        ...report
      }
    }));
  } catch (err) {
    console.error('Failed to save test report to DynamoDB:', err);
  }

  return report;
}

/**
 * Fetches recent historical test reports for a project.
 */
export async function getProjectTestReports(projectId: string): Promise<TestReportRecord[]> {
  try {
    const res = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `PROJ#${projectId}`,
        ':skPrefix': 'TEST_REPORT#'
      },
      ScanIndexForward: false, // Descending order (newest first)
      Limit: 20
    }));

    return (res.Items || []) as TestReportRecord[];
  } catch {
    return [];
  }
}

/**
 * Generates downloadable standalone HTML report.
 */
export function generateHtmlReport(report: TestReportRecord): string {
  const passRate = report.totalTests > 0 ? Math.round((report.passed / report.totalTests) * 100) : 100;
  const rows = report.results.map(r => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 10px 14px; font-weight: bold; font-family: monospace;">${r.method}</td>
      <td style="padding: 10px 14px; font-family: monospace;">${r.path}</td>
      <td style="padding: 10px 14px; text-align: center;">${r.expectedStatus}</td>
      <td style="padding: 10px 14px; text-align: center; color: ${r.passed ? '#10B981' : '#EF4444'}; font-weight: bold;">${r.actualStatus}</td>
      <td style="padding: 10px 14px; text-align: right;">${r.durationMs}ms</td>
      <td style="padding: 10px 14px;">
        <span style="background: ${r.passed ? '#064E3B' : '#7F1D1D'}; color: ${r.passed ? '#6EE7B7' : '#FCA5A5'}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
          ${r.passed ? 'PASSED' : 'FAILED'}
        </span>
      </td>
      <td style="padding: 10px 14px; color: #94A3B8; font-size: 12px;">${r.error || '—'}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pseudoend API Health & Testing Report - ${report.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0F172A; color: #F8FAFC; margin: 0; padding: 30px; }
    .card { background: #1E293B; border-radius: 12px; padding: 24px; border: 1px solid #334155; margin-bottom: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-box { background: #0F172A; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center; }
    .metric-val { font-size: 24px; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #0F172A; padding: 10px 14px; text-transform: uppercase; font-size: 11px; color: #94A3B8; border-bottom: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1 style="margin: 0; font-size: 22px;">Pseudoend API Health & Testing Report</h1>
        <div style="color: #94A3B8; font-size: 13px; margin-top: 4px;">Report ID: ${report.id} &bull; Environment: <strong>${report.environment.toUpperCase()}</strong> &bull; Generated: ${report.timestamp}</div>
      </div>
      <div style="font-size: 32px; font-weight: 800; color: ${passRate === 100 ? '#10B981' : passRate >= 80 ? '#F59E0B' : '#EF4444'};">
        ${passRate}%
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-box">
        <div style="color: #94A3B8; font-size: 12px;">Total Tests</div>
        <div class="metric-val">${report.totalTests}</div>
      </div>
      <div class="metric-box">
        <div style="color: #10B981; font-size: 12px;">Passed</div>
        <div class="metric-val" style="color: #10B981;">${report.passed}</div>
      </div>
      <div class="metric-box">
        <div style="color: #EF4444; font-size: 12px;">Failed</div>
        <div class="metric-val" style="color: #EF4444;">${report.failed}</div>
      </div>
      <div class="metric-box">
        <div style="color: #38BDF8; font-size: 12px;">Avg Response Time</div>
        <div class="metric-val" style="color: #38BDF8;">${report.avgDurationMs}ms</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Endpoint Path</th>
          <th style="text-align: center;">Expected</th>
          <th style="text-align: center;">Actual</th>
          <th style="text-align: right;">Latency</th>
          <th>Status</th>
          <th>Diagnostics / Failure Reason</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
