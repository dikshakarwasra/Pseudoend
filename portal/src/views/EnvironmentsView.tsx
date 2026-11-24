import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Sliders, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertTriangle, 
  Zap, 
  Database, 
  Activity, 
  Clock, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Project, EnvironmentType, EnvironmentConfig } from '../types.js';

interface EnvironmentsViewProps {
  activeProject: Project | null;
  apiBaseUrl: string;
  token: string;
  activeEnvironment: EnvironmentType;
  setActiveEnvironment: (env: EnvironmentType) => void;
}

const ENV_META: Record<EnvironmentType, { label: string; desc: string; color: string; border: string; bg: string }> = {
  sandbox: {
    label: 'Sandbox',
    desc: 'Rapid prototyping and schema experimentation with instantaneous response times.',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10'
  },
  development: {
    label: 'Development',
    desc: 'Local frontend feature development with realistic network simulation.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10'
  },
  staging: {
    label: 'Staging',
    desc: 'Pre-release QA environment with chaos fault injection and high latency.',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10'
  },
  live: {
    label: 'Live (Simulated)',
    desc: 'Production-grade simulated mock environment with zero data bleed.',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10'
  }
};

export const EnvironmentsView: React.FC<EnvironmentsViewProps> = ({
  activeProject,
  apiBaseUrl,
  token,
  activeEnvironment,
  setActiveEnvironment
}) => {
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEnv, setSavingEnv] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Clone Modal
  const [cloneModal, setCloneModal] = useState<{ source: EnvironmentType; target: EnvironmentType } | null>(null);
  const [cloning, setCloning] = useState(false);

  // Reset Modal
  const [resetModalEnv, setResetModalEnv] = useState<EnvironmentType | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchEnvironments = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/environments/${activeProject.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data.environments || []);
      }
    } catch (err) {
      console.error('Failed to load environments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, [activeProject]);

  const handleUpdateConfig = async (envName: EnvironmentType, latencyMs: number, failureRatePercent: number) => {
    if (!activeProject) return;
    setSavingEnv(envName);
    try {
      const res = await fetch(`${apiBaseUrl}/api/environments/${activeProject.id}/config`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: envName,
          latencyMs,
          failureRatePercent,
          isEnabled: true
        })
      });

      if (res.ok) {
        setEnvironments(prev => prev.map(e => e.name === envName ? { ...e, latencyMs, failureRatePercent } : e));
        setActionSuccess(`Updated ${envName.toUpperCase()} configuration.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update environment config:', err);
    } finally {
      setSavingEnv(null);
    }
  };

  const handleReset = async (env: EnvironmentType) => {
    if (!activeProject) return;
    setResetting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/environments/${activeProject.id}/reset`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ environment: env })
      });
      if (res.ok) {
        setResetModalEnv(null);
        fetchEnvironments();
        setActionSuccess(`Reset ${env.toUpperCase()} environment database.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to reset environment:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleClone = async () => {
    if (!activeProject || !cloneModal) return;
    setCloning(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/environments/${activeProject.id}/clone`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceEnv: cloneModal.source,
          targetEnv: cloneModal.target
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCloneModal(null);
        fetchEnvironments();
        setActionSuccess(data.message || `Cloned ${cloneModal.source} to ${cloneModal.target}.`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to clone environment:', err);
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">API Environment Switching</h2>
            <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
              Feature 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Four completely isolated database states and fault-injection profiles with strict zero-bleed isolation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Active Environment:</span>
            <span className={`font-mono font-bold uppercase ${ENV_META[activeEnvironment].color}`}>
              {activeEnvironment}
            </span>
          </div>

          <button
            onClick={fetchEnvironments}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-800"
            title="Refresh environments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Environment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['sandbox', 'development', 'staging', 'live'] as EnvironmentType[]).map((envName) => {
          const meta = ENV_META[envName];
          const config = environments.find(e => e.name === envName) || {
            name: envName,
            latencyMs: 50,
            failureRatePercent: 0,
            isEnabled: true,
            recordCount: 0,
            updatedAt: ''
          };
          const isActive = activeEnvironment === envName;

          return (
            <div
              key={envName}
              className={`bg-slate-900/60 rounded-xl border p-5 backdrop-blur-sm transition-all ${
                isActive 
                  ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-xl shadow-emerald-500/5' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg} ${meta.border} border`}>
                    <Server className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-white">{meta.label}</h3>
                      {isActive && (
                        <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{meta.desc}</p>
                  </div>
                </div>

                {!isActive && (
                  <button
                    onClick={() => setActiveEnvironment(envName)}
                    className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Activate
                  </button>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mb-4 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Mock Records</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {config.recordCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Sim. Latency</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {config.latencyMs}ms
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Chaos Failure</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${config.failureRatePercent > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.failureRatePercent}%
                  </div>
                </div>
              </div>

              {/* Sliders & Controls */}
              <div className="space-y-3 mb-5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Network Latency Simulation</span>
                    </span>
                    <span className="font-mono text-white font-semibold">{config.latencyMs}ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1500"
                    step="25"
                    value={config.latencyMs}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleUpdateConfig(envName, val, config.failureRatePercent);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulated 500 Fault Injection</span>
                    </span>
                    <span className={`font-mono font-semibold ${config.failureRatePercent > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {config.failureRatePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={config.failureRatePercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleUpdateConfig(envName, config.latencyMs, val);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => setCloneModal({ source: envName === 'sandbox' ? 'development' : 'sandbox', target: envName })}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Clone Data From...</span>
                </button>

                <button
                  onClick={() => setResetModalEnv(envName)}
                  className="flex items-center space-x-1 text-xs text-red-400/80 hover:text-red-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset State</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalEnv && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Reset {resetModalEnv.toUpperCase()} State</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              This will permanently delete all mock database records in the <strong>{resetModalEnv.toUpperCase()}</strong> environment. Other environments will remain completely untouched.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setResetModalEnv(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReset(resetModalEnv)}
                disabled={resetting}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold px-4 py-2 rounded-lg text-xs"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {cloneModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Clone Environment Data</h3>
            <p className="text-xs text-slate-400 mb-4">
              Copy all mock database records from a source environment into <strong>{cloneModal.target.toUpperCase()}</strong>.
            </p>

            <div className="space-y-3 mb-6 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Source Environment</label>
                <select
                  value={cloneModal.source}
                  onChange={(e) => setCloneModal({ ...cloneModal, source: e.target.value as EnvironmentType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {(['sandbox', 'development', 'staging', 'live'] as EnvironmentType[])
                    .filter(e => e !== cloneModal.target)
                    .map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Environment</label>
                <input
                  type="text"
                  disabled
                  value={cloneModal.target.toUpperCase()}
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg p-2 text-slate-400 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCloneModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={cloning}
                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg text-xs"
              >
                {cloning ? 'Cloning...' : 'Clone Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
