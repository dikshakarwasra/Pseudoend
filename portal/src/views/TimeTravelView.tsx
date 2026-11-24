import React, { useState, useEffect } from 'react';
import { 
  History, 
  Camera, 
  RotateCcw, 
  Play, 
  Check, 
  AlertTriangle, 
  ArrowLeftRight, 
  Zap
} from 'lucide-react';
import { Project, EnvironmentType, DatabaseSnapshotRecord, RequestLogRecord } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';

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

  // Active Tab
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
          description: snapshotDesc || `Checkpoint at ${new Date().toLocaleTimeString()}`
        })
      });
      if (res.ok) {
        setSnapshotDesc('');
        setActionSuccess('Snapshot checkpoint captured successfully.');
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#161617] p-5 rounded-3xl border border-white/10 shadow-apple-sm">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#bf5af2]" />
            <h2 className="text-base font-semibold text-white tracking-tight">Time-Travel Debugging & Request Replay</h2>
            <span className="text-[10px] font-mono uppercase bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/30 px-2.5 py-0.5 rounded-full font-medium">
              State Checkpoints
            </span>
          </div>
          <p className="text-xs text-[#a1a1a6] mt-1">
            Travel back to earlier mock database states, inspect point-in-time snapshots, diff modifications, and replay requests.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={snapshotDesc}
            onChange={(e) => setSnapshotDesc(e.target.value)}
            placeholder="Checkpoint note..."
            className="bg-[#1c1c1e] border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3] w-48 sm:w-56 font-mono"
          />
          <Button
            variant="primary"
            size="sm"
            loading={capturing}
            icon={<Camera className="w-3.5 h-3.5" />}
            onClick={handleCaptureSnapshot}
          >
            {capturing ? 'Saving...' : 'Save Checkpoint'}
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158] p-3.5 rounded-2xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-1 bg-[#161617] p-1 rounded-full border border-white/10 w-fit text-xs">
        {[
          { id: 'timeline', label: 'Activity Timeline' },
          { id: 'snapshots', label: `Database Snapshots (${snapshots.length})` },
          { id: 'diff', label: 'State Comparison (Diff)' },
          { id: 'replay', label: `Request Replay (${logs.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              subTab === t.id ? 'bg-[#0071e3] text-white font-semibold' : 'text-[#a1a1a6] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ACTIVITY TIMELINE */}
      {subTab === 'timeline' && (
        <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 shadow-apple-sm">
          <h3 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider mb-6 font-mono">
            Chronological Audit Trail ({activeEnvironment.toUpperCase()})
          </h3>

          {snapshots.length === 0 && logs.length === 0 ? (
            <p className="text-xs text-[#86868b] text-center py-10 font-mono">
              No snapshot or request activity recorded yet in this environment.
            </p>
          ) : (
            <div className="relative border-l border-white/10 ml-4 space-y-6">
              {snapshots.map((snap) => (
                <div key={snap.id} className="relative pl-6">
                  <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                    snap.trigger === 'pre-restore' ? 'bg-[#ff9f0a]/20 border-[#ff9f0a] text-[#ff9f0a]' :
                    snap.trigger === 'auto' ? 'bg-[#64d2ff]/20 border-[#64d2ff] text-[#64d2ff]' :
                    'bg-[#bf5af2]/20 border-[#bf5af2] text-[#bf5af2]'
                  }`}>
                    <Camera className="w-2.5 h-2.5" />
                  </div>

                  <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-white">{snap.description}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#a1a1a6] uppercase">
                          {snap.trigger}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#86868b]">
                        {new Date(snap.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-[#a1a1a6] font-mono text-[11px]">
                        {snap.recordCount} records across {Object.keys(snap.data || {}).length} resources
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => { setSelectedSnapshot(snap); setSubTab('snapshots'); }}
                        >
                          Inspect State
                        </Button>
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => setRestoreConfirmSnap(snap)}
                          className="bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30 hover:bg-[#bf5af2]/25"
                        >
                          Restore State
                        </Button>
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
          <div className="bg-[#161617] border border-white/10 rounded-3xl p-4 shadow-apple-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/10 px-2">
              <span className="text-xs font-semibold text-white">Saved Snapshots</span>
              <span className="text-xs text-[#86868b] font-mono">{snapshots.length} total</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {snapshots.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSnapshot(s)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-colors text-xs ${
                    selectedSnapshot?.id === s.id
                      ? 'bg-[#0071e3]/15 border-[#0071e3]/50 text-white shadow-apple-sm'
                      : 'bg-[#1c1c1e] border-white/5 hover:border-white/15 text-[#a1a1a6]'
                  }`}
                >
                  <div className="flex justify-between font-semibold text-white mb-1">
                    <span className="truncate">{s.description}</span>
                    <span className="font-mono text-[10px] text-[#2997ff] uppercase">{s.trigger}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#86868b] font-mono">
                    <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
                    <span>{s.recordCount} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#161617] border border-white/10 rounded-3xl p-5 shadow-apple-sm flex flex-col">
            {selectedSnapshot ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{selectedSnapshot.description}</h3>
                    <div className="text-[11px] text-[#86868b] font-mono mt-0.5">
                      ID: {selectedSnapshot.id} &bull; Recorded: {selectedSnapshot.timestamp}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="xs"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => setRestoreConfirmSnap(selectedSnapshot)}
                  >
                    Restore This State
                  </Button>
                </div>

                <div className="flex-1 bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 overflow-auto font-mono text-xs text-[#2997ff] max-h-[440px] leading-relaxed">
                  <pre>{JSON.stringify(selectedSnapshot.data, null, 2)}</pre>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#86868b] text-center py-20 font-mono">Select a snapshot to inspect its state.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STATE COMPARISON (DIFF) */}
      {subTab === 'diff' && (
        <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 shadow-apple-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#1c1c1e] p-4 rounded-2xl border border-white/10">
            <div className="flex-1 w-full">
              <label className="block text-[11px] text-[#a1a1a6] mb-1 font-mono">Baseline Snapshot (A)</label>
              <select
                value={diffSnapshots.snapA || ''}
                onChange={(e) => setDiffSnapshots({ ...diffSnapshots, snapA: e.target.value })}
                className="w-full bg-[#121213] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
              >
                <option value="">Select Snapshot A...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.description} ({new Date(s.timestamp).toLocaleTimeString()})</option>)}
              </select>
            </div>

            <ArrowLeftRight className="w-5 h-5 text-[#86868b] shrink-0" />

            <div className="flex-1 w-full">
              <label className="block text-[11px] text-[#a1a1a6] mb-1 font-mono">Comparison Snapshot (B)</label>
              <select
                value={diffSnapshots.snapB || ''}
                onChange={(e) => setDiffSnapshots({ ...diffSnapshots, snapB: e.target.value })}
                className="w-full bg-[#121213] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
              >
                <option value="">Select Snapshot B...</option>
                {snapshots.map(s => <option key={s.id} value={s.id}>{s.description} ({new Date(s.timestamp).toLocaleTimeString()})</option>)}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              loading={diffLoading}
              disabled={!diffSnapshots.snapA || !diffSnapshots.snapB}
              onClick={handleRunDiff}
              className="mt-4 sm:mt-4"
            >
              {diffLoading ? 'Comparing...' : 'Compute Diff'}
            </Button>
          </div>

          {diffResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#30d158]/15 border border-[#30d158]/30 p-3.5 rounded-2xl text-[#30d158]">
                  <div className="text-xl font-bold font-mono">+{diffResult.added?.length || 0}</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold font-mono">Added Records</div>
                </div>
                <div className="bg-red-500/15 border border-red-500/30 p-3.5 rounded-2xl text-[#ff453a]">
                  <div className="text-xl font-bold font-mono">-{diffResult.removed?.length || 0}</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold font-mono">Deleted Records</div>
                </div>
                <div className="bg-[#ff9f0a]/15 border border-[#ff9f0a]/30 p-3.5 rounded-2xl text-[#ff9f0a]">
                  <div className="text-xl font-bold font-mono">{diffResult.modified?.length || 0}</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold font-mono">Modified Records</div>
                </div>
              </div>

              {diffResult.added?.length > 0 && (
                <div className="bg-[#1c1c1e] border border-[#30d158]/30 rounded-2xl p-4">
                  <h4 className="text-xs font-semibold text-[#30d158] uppercase mb-2 font-mono">Added Records (in Snapshot B)</h4>
                  <pre className="text-xs font-mono text-[#30d158] max-h-48 overflow-y-auto">
                    {JSON.stringify(diffResult.added, null, 2)}
                  </pre>
                </div>
              )}

              {diffResult.removed?.length > 0 && (
                <div className="bg-[#1c1c1e] border border-red-500/30 rounded-2xl p-4">
                  <h4 className="text-xs font-semibold text-[#ff453a] uppercase mb-2 font-mono">Deleted Records (from Snapshot A)</h4>
                  <pre className="text-xs font-mono text-[#ff453a] max-h-48 overflow-y-auto">
                    {JSON.stringify(diffResult.removed, null, 2)}
                  </pre>
                </div>
              )}

              {diffResult.modified?.length > 0 && (
                <div className="bg-[#1c1c1e] border border-[#ff9f0a]/30 rounded-2xl p-4">
                  <h4 className="text-xs font-semibold text-[#ff9f0a] uppercase mb-2 font-mono">Modified Records</h4>
                  <div className="space-y-2">
                    {diffResult.modified.map((m: any) => (
                      <div key={m.id} className="bg-[#121213] p-3 rounded-xl border border-white/5 text-xs">
                        <div className="flex justify-between font-mono font-semibold text-[#ff9f0a] mb-1">
                          <span>{m.resource} #{m.id}</span>
                          <span className="text-[#86868b] text-[10px]">Changed: {m.changes?.join(', ')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-mono mt-2">
                          <div className="text-[#ff453a] bg-red-500/10 p-2 rounded-lg">
                            <span className="block text-[10px] text-red-400 uppercase mb-1 font-bold">Before</span>
                            <pre>{JSON.stringify(m.before, null, 2)}</pre>
                          </div>
                          <div className="text-[#30d158] bg-[#30d158]/10 p-2 rounded-lg">
                            <span className="block text-[10px] text-[#30d158] uppercase mb-1 font-bold">After</span>
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
        <div className="bg-[#161617] border border-white/10 rounded-3xl p-5 shadow-apple-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div>
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">Historical Request Log & Replay</h3>
              <p className="text-xs text-[#a1a1a6] mt-0.5">Select any request to replay as exact verbatim response or live re-execution.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#121213] text-[#86868b] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-3 font-medium">Timestamp</th>
                  <th className="py-3 px-3 font-medium">Method & Path</th>
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-3 font-medium text-right">Duration</th>
                  <th className="py-3 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 text-[#86868b] text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="mr-2">
                        <Badge method={log.method} size="sm" />
                      </span>
                      <span className="text-[#f5f5f7]">{log.endpoint}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge statusCode={log.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right text-[#a1a1a6]">
                      {log.durationMs}ms
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => { setSelectedLog(log); setReplayResult(null); }}
                      >
                        Replay...
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Replay Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-[#2997ff]" />
            <span>Replay Request: {selectedLog?.method} {selectedLog?.endpoint}</span>
          </div>
        }
        description="Choose between exact recorded response replay or live server re-execution."
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            <div className="bg-[#121213] p-3.5 rounded-2xl border border-white/10 text-[#a1a1a6]">
              <div>Original Timestamp: <span className="text-white">{selectedLog.timestamp}</span></div>
              <div>Original Status: <span className="text-[#30d158]">{selectedLog.status}</span> ({selectedLog.durationMs}ms)</div>
              {selectedLog.requestBody && (
                <div className="mt-2">
                  <span className="text-[#86868b] block">Payload:</span>
                  <pre className="text-[#d2d2d7] bg-[#1c1c1e] p-2.5 rounded-xl mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleReplay('exact')}
                disabled={replayLoading}
                className="bg-[#1c1c1e] hover:bg-[#262629] p-4 rounded-2xl border border-white/10 text-left transition-colors"
              >
                <div className="font-semibold text-[#2997ff] text-sm mb-1 flex items-center space-x-1.5">
                  <History className="w-4 h-4" />
                  <span>1. Exact Response Replay</span>
                </div>
                <p className="text-[11px] text-[#a1a1a6] font-sans">
                  Returns the previously recorded response verbatim without re-evaluating the server.
                </p>
              </button>

              <button
                onClick={() => handleReplay('re-execute')}
                disabled={replayLoading}
                className="bg-[#1c1c1e] hover:bg-[#262629] p-4 rounded-2xl border border-white/10 text-left transition-colors"
              >
                <div className="font-semibold text-[#30d158] text-sm mb-1 flex items-center space-x-1.5">
                  <Zap className="w-4 h-4" />
                  <span>2. Request Re-execution</span>
                </div>
                <p className="text-[11px] text-[#a1a1a6] font-sans">
                  Executes the exact same HTTP request live against the active database state.
                </p>
              </button>
            </div>

            {replayResult && (
              <div className="bg-[#121213] p-4 rounded-2xl border border-white/10 mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white uppercase font-sans">Replay Result ({replayResult.replayMode})</span>
                  <span className="text-[#2997ff] font-mono">Status: {replayResult.statusCode} ({replayResult.durationMs}ms)</span>
                </div>
                <pre className="text-xs text-[#2997ff] max-h-48 overflow-y-auto bg-[#1c1c1e] p-3 rounded-xl">
                  {JSON.stringify(replayResult.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={Boolean(restoreConfirmSnap)}
        onClose={() => setRestoreConfirmSnap(null)}
        title={
          <div className="flex items-center space-x-2 text-[#ff9f0a]">
            <AlertTriangle className="w-5 h-5" />
            <span>Restore Snapshot State</span>
          </div>
        }
        description="Are you sure you want to restore the database to this previous state? A safety checkpoint of your current state will be created automatically."
        maxWidth="md"
      >
        {restoreConfirmSnap && (
          <div className="space-y-4">
            <div className="bg-[#121213] p-3.5 rounded-2xl border border-white/10 text-xs font-mono text-[#2997ff]">
              <strong className="text-white text-sm block mb-1">{restoreConfirmSnap.description}</strong>
              <div className="text-[11px] text-[#86868b]">ID: {restoreConfirmSnap.id}</div>
              <div className="text-[11px] text-[#86868b]">Recorded: {restoreConfirmSnap.timestamp}</div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRestoreConfirmSnap(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={restoring}
                onClick={() => handleRestore(restoreConfirmSnap.id)}
              >
                {restoring ? 'Restoring...' : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
