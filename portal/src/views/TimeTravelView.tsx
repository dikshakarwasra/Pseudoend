import React, { useState, useEffect } from 'react';
import { 
  History, 
  Camera, 
  RotateCcw, 
  Play, 
  Search, 
  Clock, 
  Check, 
  AlertTriangle, 
  Layers, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  RefreshCw,
  FileCode,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Project, EnvironmentType, DatabaseSnapshotRecord, RequestLogRecord } from '../types.js';

interface TimeTravelViewProps {
  activeProject: Project | null;
  apiBaseUrl: string;
  token: string;
  activeEnvironment: EnvironmentType;
}

export const TimeTravelView: React.FC<TimeTravelViewProps> = ({
  activeProject,
  apiBaseUrl,
  token,
  activeEnvironment
}) => {
  const [snapshots, setSnapshots] = useState<DatabaseSnapshotRecord[]>([]);
  const [logs, setLogs] = useState<RequestLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Inspector & Diff
  const [selectedSnapshot, setSelectedSnapshot] = useState<DatabaseSnapshotRecord | null>(null);
  const [diffSnapshots, setDiffSnapshots] = useState<{ snapA?: string; snapB?: string }>({});
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // Active Tab: Snapshots vs Request Replay
  const [subTab, setSubTab] = useState<'timeline' | 'snapshots' | 'diff' | 'replay'>('timeline');

  // Request Replay Modal
  const [selectedLog, setSelectedLog] = useState<RequestLogRecord | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);

  // Restore Confirmation Modal
  const [restoreConfirmSnap, setRestoreConfirmSnap] = useState<DatabaseSnapshotRecord | null>(null);

  const fetchData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [snapRes, logRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/timetravel/${activeProject.id}/snapshots?env=${activeEnvironment}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/logs/${activeProject.id}?env=${activeEnvironment}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        const list: DatabaseSnapshotRecord[] = snapData.snapshots || [];
        setSnapshots(list);
        if (list.length > 0 && !selectedSnapshot) {
          setSelectedSnapshot(list[0]);
        }
      }

      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData.logs || []);
      }
    } catch (err) {
      console.error('Failed to load time-travel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeProject, activeEnvironment]);

  const handleCaptureSnapshot = async () => {
    if (!activeProject) return;
    setCapturing(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/timetravel/${activeProject.id}/snapshots`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environment: activeEnvironment,
          description: snapshotDesc || `Manual Checkpoint at ${new Date().toLocaleTimeString()}`
        })
      });
      if (res.ok) {
        setSnapshotDesc('');
        setActionSuccess('Snapshot captured successfully.');
        setTimeout(() => setActionSuccess(null), 3000);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
    } finally {
      setCapturing(false);
    }
  };

  const handleRestore = async (snapId: string) => {
    if (!activeProject) return;
    setRestoring(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/timetravel/${activeProject.id}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environment: activeEnvironment,
          snapshotId: snapId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRestoreConfirmSnap(null);
        setActionSuccess(`State restored (${data.restoredRecordCount} records). Safety backup created.`);
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    } finally {
      setRestoring(false);
    }
  };

  const handleRunDiff = async () => {
    if (!activeProject || !diffSnapshots.snapA || !diffSnapshots.snapB) return;
    setDiffLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/timetravel/${activeProject.id}/diff?env=${activeEnvironment}&snapA=${diffSnapshots.snapA}&snapB=${diffSnapshots.snapB}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDiffResult(data.diff);
      }
    } catch (err) {
      console.error('Failed to calculate diff:', err);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleReplay = async (mode: 'exact' | 're-execute') => {
    if (!activeProject || !selectedLog) return;
    setReplayLoading(true);
    setReplayResult(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/logs/${activeProject.id}/replay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environment: activeEnvironment,
          logId: selectedLog.id,
          mode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReplayResult(data);
      }
    } catch (err) {
      console.error('Failed to replay request:', err);
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Time-Travel Debugging & Request Replay</h2>
            <span className="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
              Feature 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Travel back to earlier mock database states, inspect point-in-time snapshots, diff modifications, and replay requests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={snapshotDesc}
            onChange={(e) => setSnapshotDesc(e.target.value)}
            placeholder="Checkpoint description..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-52"
          />
          <button
            onClick={handleCaptureSnapshot}
            disabled={capturing}
            className="flex items-center space-x-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold px-3 py-2 rounded-lg text-xs transition-colors shadow-lg shadow-purple-500/10"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{capturing ? 'Saving...' : 'Save Snapshot'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit text-xs">
        <button
          onClick={() => setSubTab('timeline')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            subTab === 'timeline' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setSubTab('snapshots')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            subTab === 'snapshots' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Database Snapshots ({snapshots.length})
        </button>
        <button
          onClick={() => setSubTab('diff')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            subTab === 'diff' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          State Comparison (Diff)
        </button>
        <button
          onClick={() => setSubTab('replay')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            subTab === 'replay' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Request Replay ({logs.length})
        </button>
      </div>

      {/* TAB 1: ACTIVITY TIMELINE */}
      {subTab === 'timeline' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Chronological Time-Travel Audit Trail ({activeEnvironment.toUpperCase()})
          </h3>

          {snapshots.length === 0 && logs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-10">No snapshot or request activity recorded yet in this environment.</p>
          ) : (
            <div className="relative border-l border-slate-800 ml-4 space-y-6">
              {snapshots.map((snap) => (
                <div key={snap.id} className="relative pl-6">
                  <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                    snap.trigger === 'pre-restore' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                    snap.trigger === 'auto' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                    'bg-purple-500/20 border-purple-500 text-purple-400'
                  }`}>
                    <Camera className="w-2.5 h-2.5" />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-white">{snap.description}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {snap.trigger}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(snap.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-slate-400 font-mono">
                        {snap.recordCount} records across {Object.keys(snap.data || {}).length} resources
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setSelectedSnapshot(snap); setSubTab('snapshots'); }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                        >
                          Inspect State
                        </button>
                        <button
                          onClick={() => setRestoreConfirmSnap(snap)}
                          className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded border border-purple-500/30 font-medium"
                        >
                          Restore State
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATABASE SNAPSHOTS VIEWER */}
      {subTab === 'snapshots' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Snapshots Sidebar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-white">Saved Snapshots</span>
              <span className="text-xs text-slate-500 font-mono">{snapshots.length} total</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {snapshots.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSnapshot(s)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors text-xs ${
                    selectedSnapshot?.id === s.id
                      ? 'bg-purple-500/10 border-purple-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between font-semibold text-white mb-1">
                    <span className="truncate">{s.description}</span>
                    <span className="font-mono text-[10px] text-purple-400 uppercase">{s.trigger}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
                    <span>{s.recordCount} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Snapshot State Previewer */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col">
            {selectedSnapshot ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">{selectedSnapshot.description}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ID: {selectedSnapshot.id} &bull; Recorded: {selectedSnapshot.timestamp}
                    </div>
                  </div>

                  <button
                    onClick={() => setRestoreConfirmSnap(selectedSnapshot)}
                    className="flex items-center space-x-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This State</span>
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-auto font-mono text-xs text-slate-300 max-h-[440px]">
                  <pre>{JSON.stringify(selectedSnapshot.data, null, 2)}</pre>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center py-20">Select a snapshot to inspect its state.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STATE COMPARISON (DIFF) */}
      {subTab === 'diff' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex-1 w-full">
              <label className="block text-[11px] text-slate-400 mb-1">Baseline Snapshot (A)</label>
              <select
                value={diffSnapshots.snapA || ''}
                onChange={(e) => setDiffSnapshots({ ...diffSnapshots, snapA: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="">Select Snapshot A...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.description} ({new Date(s.timestamp).toLocaleTimeString()})</option>)}
              </select>
            </div>

            <ArrowLeftRight className="w-5 h-5 text-slate-500 shrink-0" />

            <div className="flex-1 w-full">
              <label className="block text-[11px] text-slate-400 mb-1">Comparison Snapshot (B)</label>
              <select
                value={diffSnapshots.snapB || ''}
                onChange={(e) => setDiffSnapshots({ ...diffSnapshots, snapB: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="">Select Snapshot B...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.description} ({new Date(s.timestamp).toLocaleTimeString()})</option>)}
              </select>
            </div>

            <button
              onClick={handleRunDiff}
              disabled={!diffSnapshots.snapA || !diffSnapshots.snapB || diffLoading}
              className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs mt-4 sm:mt-0"
            >
              {diffLoading ? 'Comparing...' : 'Compute Diff'}
            </button>
          </div>

          {diffResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-emerald-400">
                  <div className="text-xl font-bold font-mono">+{diffResult.added?.length || 0}</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold">Added Records</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-400">
                  <div className="text-xl font-bold font-mono">-{diffResult.removed?.length || 0}</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold">Deleted Records</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-400">
                  <div className="text-xl font-bold font-mono">{diffResult.modified?.length || 0}</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold">Modified Records</div>
                </div>
              </div>

              {/* Added Records Details */}
              {diffResult.added?.length > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase mb-2">Added Records (in Snapshot B)</h4>
                  <pre className="text-xs font-mono text-emerald-300 max-h-48 overflow-y-auto">
                    {JSON.stringify(diffResult.added, null, 2)}
                  </pre>
                </div>
              )}

              {/* Removed Records Details */}
              {diffResult.removed?.length > 0 && (
                <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Deleted Records (from Snapshot A)</h4>
                  <pre className="text-xs font-mono text-red-300 max-h-48 overflow-y-auto">
                    {JSON.stringify(diffResult.removed, null, 2)}
                  </pre>
                </div>
              )}

              {/* Modified Records Details */}
              {diffResult.modified?.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase mb-2">Modified Records</h4>
                  <div className="space-y-2">
                    {diffResult.modified.map((m: any) => (
                      <div key={m.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                        <div className="flex justify-between font-mono font-bold text-amber-300 mb-1">
                          <span>{m.resource} #{m.id}</span>
                          <span className="text-slate-400 text-[10px]">Changed: {m.changes?.join(', ')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-mono mt-2">
                          <div className="text-red-400 bg-red-500/10 p-2 rounded">
                            <span className="block text-[10px] text-red-500 uppercase mb-1 font-bold">Before</span>
                            <pre>{JSON.stringify(m.before, null, 2)}</pre>
                          </div>
                          <div className="text-emerald-400 bg-emerald-500/10 p-2 rounded">
                            <span className="block text-[10px] text-emerald-500 uppercase mb-1 font-bold">After</span>
                            <pre>{JSON.stringify(m.after, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REQUEST REPLAY */}
      {subTab === 'replay' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Historical Request Log & Replay</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select any request to replay as exact verbatim response or live re-execution.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Method & Path</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Duration</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold ${
                        log.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                        log.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-slate-200">{log.endpoint}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-bold ${log.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {log.durationMs}ms
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => { setSelectedLog(log); setReplayResult(null); }}
                        className="bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Replay...
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Replay Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Replay Request &mdash; {selectedLog.method} {selectedLog.endpoint}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400">
                <div>Original Timestamp: <span className="text-white">{selectedLog.timestamp}</span></div>
                <div>Original Status: <span className="text-emerald-400">{selectedLog.status}</span> ({selectedLog.durationMs}ms)</div>
                {selectedLog.requestBody && (
                  <div className="mt-2">
                    <span className="text-slate-500 block">Payload:</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(selectedLog.requestBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Two Distinct Replay Options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleReplay('exact')}
                  disabled={replayLoading}
                  className="bg-slate-950 hover:bg-slate-800 p-4 rounded-xl border border-purple-500/30 text-left transition-colors"
                >
                  <div className="font-bold text-purple-300 text-sm mb-1 flex items-center space-x-1.5">
                    <History className="w-4 h-4" />
                    <span>1. Exact Response Replay</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Returns the previously recorded response verbatim without re-evaluating the server.
                  </p>
                </button>

                <button
                  onClick={() => handleReplay('re-execute')}
                  disabled={replayLoading}
                  className="bg-slate-950 hover:bg-slate-800 p-4 rounded-xl border border-emerald-500/30 text-left transition-colors"
                >
                  <div className="font-bold text-emerald-300 text-sm mb-1 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4" />
                    <span>2. Request Re-execution</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Executes the exact same HTTP request live against the active database state.
                  </p>
                </button>
              </div>

              {/* Replay Result Inspector */}
              {replayResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white uppercase font-sans">Replay Result ({replayResult.replayMode})</span>
                    <span className="text-emerald-400 font-mono">Status: {replayResult.statusCode} ({replayResult.durationMs}ms)</span>
                  </div>
                  <pre className="text-xs text-slate-300 max-h-48 overflow-y-auto bg-slate-900 p-3 rounded">
                    {JSON.stringify(replayResult.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirmSnap && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Restore Snapshot Confirmation</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to restore the database to:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-purple-300 mb-4">
              <strong>{restoreConfirmSnap.description}</strong>
              <div className="text-[10px] text-slate-500 mt-1">Recorded: {restoreConfirmSnap.timestamp}</div>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              A safety checkpoint of your current state will be created automatically before restoring.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRestoreConfirmSnap(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(restoreConfirmSnap.id)}
                disabled={restoring}
                className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs"
              >
                {restoring ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
