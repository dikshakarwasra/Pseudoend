import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  FileText, 
  History, 
  AlertTriangle, 
  Zap, 
  Filter,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { Project, EnvironmentType, TestReportRecord, TestResultItem } from '../types.js';

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

  // Metrics
  const total = activeReport?.totalTests || 0;
  const passed = activeReport?.passed || 0;
  const failed = activeReport?.failed || 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;

  // Filtered results
  const filteredResults = (activeReport?.results || []).filter(r => {
    if (filterStatus === 'PASSED') return r.passed;
    if (filterStatus === 'FAILED') return !r.passed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Automatic API Health & Testing Report</h2>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Feature 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end automated validation verifying status codes, response schemas, and latency benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={includeChaos}
              onChange={(e) => setIncludeChaos(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Chaos Conditions</span>
            </span>
          </label>

          <button
            onClick={handleRunTests}
            disabled={running}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-lg shadow-emerald-500/10"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Executing Tests...' : `Run Test Suite (${activeEnvironment.toUpperCase()})`}</span>
          </button>
        </div>
      </div>

      {loading && !activeReport ? (
        <div className="text-center py-20 text-xs text-slate-400 flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Loading historical test reports...</span>
        </div>
      ) : !activeReport ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No Test Runs Executed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Click "Run Test Suite" to automatically test every configured mock endpoint in the active environment.
          </p>
          <button
            onClick={handleRunTests}
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Execute Health Tests</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Donut Chart Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col items-center justify-center text-center">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Health Pass Rate</div>

              {/* SVG Donut Chart */}
              <div className="relative w-32 h-32 my-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#1E293B"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={passRate === 100 ? '#10B981' : passRate >= 80 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="12"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * passRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-white">{passRate}%</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Passed</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono mt-2">
                <span className="text-emerald-400 font-semibold">{passed} Passed</span>
                <span className="text-slate-600">|</span>
                <span className="text-red-400 font-semibold">{failed} Failed</span>
              </div>
            </div>

            {/* Performance Analytics */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400">Total Endpoints Tested</div>
                  <div className="text-3xl font-bold text-white font-mono mt-2">{total}</div>
                </div>
                <div className="text-[11px] text-slate-500 mt-4 flex items-center space-x-1">
                  <span>Environment:</span>
                  <span className="font-mono text-emerald-400 font-bold uppercase">{activeReport.environment}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400">Average Response Time</div>
                  <div className="text-3xl font-bold text-cyan-400 font-mono mt-2">{activeReport.avgDurationMs}ms</div>
                </div>
                <div className="text-[11px] text-slate-500 mt-4 flex items-center justify-between font-mono">
                  <span>Min: {activeReport.minDurationMs}ms</span>
                  <span>Max: {activeReport.maxDurationMs}ms</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400">Report Metadata</div>
                  <div className="text-xs font-mono text-slate-200 mt-2 truncate">ID: {activeReport.id}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{new Date(activeReport.timestamp).toLocaleString()}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={downloadHtmlReport}
                    className="flex-1 flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>HTML</span>
                  </button>
                  <button
                    onClick={downloadJsonReport}
                    className="flex-1 flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report History Tabs */}
          {reports.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0 flex items-center space-x-1">
                <History className="w-3.5 h-3.5" />
                <span>History:</span>
              </span>
              {reports.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r)}
                  className={`px-3 py-1.5 rounded-lg shrink-0 font-mono transition-colors border ${
                    activeReport.id === r.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  #{reports.length - i} ({r.environment}) - {new Date(r.timestamp).toLocaleTimeString()}
                </button>
              ))}
            </div>
          )}

          {/* Endpoint Test Results Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="font-semibold text-xs text-white uppercase tracking-wider">
                Endpoint Execution Diagnostics
              </div>
              <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {(['ALL', 'PASSED', 'FAILED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-2.5 py-0.5 rounded transition-colors ${
                      filterStatus === f ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4">Method & Path</th>
                  <th className="py-3 px-4 text-center">Expected</th>
                  <th className="py-3 px-4 text-center">Actual Status</th>
                  <th className="py-3 px-4 text-right">Latency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Failure Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredResults.map((result) => {
                  return (
                    <tr key={result.routeId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                          result.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                          result.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                          result.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {result.method}
                        </span>
                        <span className="text-slate-200">{result.path}</span>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {result.expectedStatus}
                      </td>

                      <td className={`py-3 px-4 text-center font-bold font-mono ${
                        result.passed ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {result.actualStatus}
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          result.durationMs < 100 ? 'bg-emerald-500/10 text-emerald-400' :
                          result.durationMs < 300 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {result.durationMs}ms
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {result.passed ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PASSED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-red-400 text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                        {result.error ? (
                          <span className="text-red-300 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-mono text-[11px]">
                            {result.error}
                          </span>
                        ) : (
                          <span className="text-slate-600">Passed schema & status verification</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
