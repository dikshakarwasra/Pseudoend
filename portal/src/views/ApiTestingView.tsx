import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Download, 
  FileText, 
  History, 
  Zap, 
  RefreshCw
} from 'lucide-react';
import { Project, EnvironmentType, TestReportRecord, TestResultItem } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';

interface ApiTestingViewProps {
  activeProject: Project | null;
  apiBaseUrl: string;
  token: string;
  activeEnvironment: EnvironmentType;
}

export const ApiTestingView: React.FC<ApiTestingViewProps> = ({
  activeProject,
  apiBaseUrl,
  token,
  activeEnvironment
}) => {
  const [reports, setReports] = useState<TestReportRecord[]>([]);
  const [activeReport, setActiveReport] = useState<TestReportRecord | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [includeChaos, setIncludeChaos] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  const fetchReports = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/testing/${activeProject.id}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list: TestReportRecord[] = data.reports || [];
        setReports(list);
        if (list.length > 0 && !activeReport) {
          setActiveReport(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load test reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeProject]);

  const handleRunTests = async () => {
    if (!activeProject) return;
    setRunning(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/testing/${activeProject.id}/run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environment: activeEnvironment,
          includeChaos
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newReport = data.report as TestReportRecord;
        setReports(prev => [newReport, ...prev]);
        setActiveReport(newReport);
      }
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setRunning(false);
    }
  };

  const downloadJsonReport = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pseudoend-test-report-${activeReport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHtmlReport = () => {
    if (!activeReport || !activeProject) return;
    window.open(`${apiBaseUrl}/api/testing/${activeProject.id}/reports/${activeReport.id}/html`, '_blank');
  };

  const total = activeReport?.totalTests || 0;
  const passed = activeReport?.passed || 0;
  const failed = activeReport?.failed || 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;

  const filteredResults = (activeReport?.results || []).filter(r => {
    if (filterStatus === 'PASSED') return r.passed;
    if (filterStatus === 'FAILED') return !r.passed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#161617] p-5 rounded-3xl border border-white/10 shadow-apple-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#2997ff]" />
            <h2 className="text-base font-semibold text-white tracking-tight">API Health & Testing Suite</h2>
            <span className="text-[10px] font-mono uppercase bg-[#0071e3]/15 text-[#2997ff] border border-[#0071e3]/30 px-2.5 py-0.5 rounded-full font-medium">
              E2E Diagnostics
            </span>
          </div>
          <p className="text-xs text-[#a1a1a6] mt-1">
            Validate HTTP status codes, JSON schema conformances, and response latency benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center space-x-2 text-xs text-[#d2d2d7] bg-[#1c1c1e] border border-white/10 px-3.5 py-2 rounded-full cursor-pointer hover:border-white/20 transition-colors">
            <input
              type="checkbox"
              checked={includeChaos}
              onChange={(e) => setIncludeChaos(e.target.checked)}
              className="rounded bg-[#000000] border-white/20 text-[#0071e3] focus:ring-0"
            />
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Chaos Conditions</span>
            </span>
          </label>

          <Button
            variant="primary"
            size="md"
            loading={running}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={handleRunTests}
          >
            {running ? 'Executing Tests...' : `Run Test Suite (${activeEnvironment.toUpperCase()})`}
          </Button>
        </div>
      </div>

      {loading && !activeReport ? (
        <div className="text-center py-20 text-xs text-[#86868b] flex items-center justify-center space-x-2 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-[#2997ff]" />
          <span>Loading historical test reports...</span>
        </div>
      ) : !activeReport ? (
        <div className="bg-[#161617] border border-white/10 rounded-3xl p-12 text-center shadow-apple-sm">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#a1a1a6]">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No Test Runs Executed Yet</h3>
          <p className="text-xs text-[#a1a1a6] max-w-sm mx-auto mb-4 leading-relaxed">
            Execute the test suite to automatically probe and validate every mock endpoint in the active environment.
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={handleRunTests}
          >
            Execute Health Tests
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Donut Chart Card */}
            <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-apple-sm">
              <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 font-mono">Pass Rate</div>

              {/* SVG Donut Chart */}
              <div className="relative w-32 h-32 my-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2c2c2e"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={passRate === 100 ? '#30d158' : passRate >= 80 ? '#ff9f0a' : '#ff453a'}
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * passRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-white">{passRate}%</span>
                  <span className="text-[10px] text-[#86868b] uppercase font-mono">Passed</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono mt-2">
                <span className="text-[#30d158] font-semibold">{passed} Passed</span>
                <span className="text-white/20">|</span>
                <span className="text-[#ff453a] font-semibold">{failed} Failed</span>
              </div>
            </div>

            {/* Performance Analytics (3 cols) */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-apple-sm">
                <div>
                  <div className="text-xs text-[#a1a1a6]">Total Endpoints Tested</div>
                  <div className="text-3xl font-bold text-white font-mono mt-2">{total}</div>
                </div>
                <div className="text-[11px] text-[#86868b] mt-4 flex items-center space-x-1">
                  <span>Environment:</span>
                  <span className="font-mono text-[#2997ff] font-bold uppercase">{activeReport.environment}</span>
                </div>
              </div>

              <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-apple-sm">
                <div>
                  <div className="text-xs text-[#a1a1a6]">Average Response Time</div>
                  <div className="text-3xl font-bold text-[#64d2ff] font-mono mt-2">{activeReport.avgDurationMs}ms</div>
                </div>
                <div className="text-[11px] text-[#86868b] mt-4 flex items-center justify-between font-mono">
                  <span>Min: {activeReport.minDurationMs}ms</span>
                  <span>Max: {activeReport.maxDurationMs}ms</span>
                </div>
              </div>

              <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-apple-sm">
                <div>
                  <div className="text-xs text-[#a1a1a6]">Export Report</div>
                  <div className="text-xs font-mono text-[#d2d2d7] mt-2 truncate">ID: {activeReport.id}</div>
                  <div className="text-[11px] text-[#86868b] mt-0.5">{new Date(activeReport.timestamp).toLocaleString()}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="secondary"
                    size="xs"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={downloadHtmlReport}
                    className="flex-1"
                  >
                    HTML
                  </Button>
                  <Button
                    variant="secondary"
                    size="xs"
                    icon={<FileText className="w-3.5 h-3.5" />}
                    onClick={downloadJsonReport}
                    className="flex-1"
                  >
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Report History Tabs */}
          {reports.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[#86868b] shrink-0 flex items-center space-x-1">
                <History className="w-3.5 h-3.5" />
                <span>History:</span>
              </span>
              {reports.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r)}
                  className={`px-3 py-1.5 rounded-full shrink-0 font-mono transition-colors border ${
                    activeReport.id === r.id
                      ? 'bg-[#0071e3] text-white border-[#0071e3] font-semibold'
                      : 'bg-[#1c1c1e] text-[#a1a1a6] border-white/10 hover:text-white'
                  }`}
                >
                  #{reports.length - i} ({r.environment}) - {new Date(r.timestamp).toLocaleTimeString()}
                </button>
              ))}
            </div>
          )}

          {/* Endpoint Test Results Table */}
          <div className="bg-[#161617] border border-white/10 rounded-3xl overflow-hidden shadow-apple-sm">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="font-semibold text-xs text-[#f5f5f7] uppercase tracking-wider font-mono">
                Endpoint Diagnostics
              </div>
              <div className="flex space-x-1 bg-[#1c1c1e] p-1 rounded-full border border-white/10 text-xs">
                {(['ALL', 'PASSED', 'FAILED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-0.5 rounded-full text-[11px] font-mono transition-colors ${
                      filterStatus === f ? 'bg-[#0071e3] text-white font-medium' : 'text-[#86868b] hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#121213] text-[#86868b] uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-medium">Method & Path</th>
                    <th className="py-3 px-4 font-medium text-center">Expected</th>
                    <th className="py-3 px-4 font-medium text-center">Actual Status</th>
                    <th className="py-3 px-4 font-medium text-right">Latency</th>
                    <th className="py-3 px-4 font-medium">Result</th>
                    <th className="py-3 px-4 font-medium">Failure Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredResults.map((result) => {
                    return (
                      <tr key={result.routeId} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-4 font-semibold">
                          <span className="mr-2">
                            <Badge method={result.method} size="sm" />
                          </span>
                          <span className="text-[#f5f5f7]">{result.path}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center text-[#a1a1a6] font-mono">
                          {result.expectedStatus}
                        </td>

                        <td className={`py-3.5 px-4 text-center font-bold font-mono ${
                          result.passed ? 'text-[#30d158]' : 'text-[#ff453a]'
                        }`}>
                          {result.actualStatus}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                            result.durationMs < 100 ? 'bg-[#30d158]/15 text-[#30d158]' :
                            result.durationMs < 300 ? 'bg-[#ff9f0a]/15 text-[#ff9f0a]' :
                            'bg-[#ff453a]/15 text-[#ff453a]'
                          }`}>
                            {result.durationMs}ms
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {result.passed ? (
                            <span className="inline-flex items-center space-x-1.5 text-[#30d158] text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PASSED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 text-[#ff453a] text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#a1a1a6] font-sans text-xs">
                          {result.error ? (
                            <span className="text-[#ff453a] bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 font-mono text-[11px]">
                              {result.error}
                            </span>
                          ) : (
                            <span className="text-[#6e6e73]">Passed schema & status verification</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
