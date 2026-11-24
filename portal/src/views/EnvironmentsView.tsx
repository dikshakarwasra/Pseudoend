import React, { useState, useEffect } from 'react';
import { 
  Server, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertTriangle, 
  Zap, 
  Clock, 
  RefreshCw
} from 'lucide-react';
import { Project, EnvironmentType, EnvironmentConfig } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';

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
    color: 'text-[#b45309]',
    border: 'border-[#faecd5]',
    bg: 'bg-[#fef3d6]'
  },
  development: {
    label: 'Development',
    desc: 'Local frontend feature development with realistic network simulation.',
    color: 'text-[#0071e3]',
    border: 'border-[#d8e7f5]',
    bg: 'bg-[#e8f2fc]'
  },
  staging: {
    label: 'Staging',
    desc: 'Pre-release QA environment with chaos fault injection and high latency.',
    color: 'text-[#6b21a8]',
    border: 'border-[#e6e0f8]',
    bg: 'bg-[#f1ecfd]'
  },
  live: {
    label: 'Live (Simulated)',
    desc: 'Production-grade simulated mock environment with zero data bleed.',
    color: 'text-[#166534]',
    border: 'border-[#d7ece0]',
    bg: 'bg-[#e8f5ec]'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-black/[0.04] shadow-apple-card">
        <div>
          <div className="flex items-center space-x-2.5">
            <Server className="w-5 h-5 text-[#0071e3]" />
            <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">API Environment Switching</h2>
            <span className="text-[10px] font-mono uppercase bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 px-2.5 py-0.5 rounded-full font-bold">
              4 Isolated States
            </span>
          </div>
          <p className="text-xs text-[#6e6e73] mt-1.5 leading-relaxed">
            Four completely isolated database states and fault-injection profiles with strict zero data cross-bleed.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#f5f5f7] border border-[#d2d2d7] px-4 py-1.5 rounded-full text-xs">
            <span className="text-[#6e6e73]">Active:</span>
            <span className={`font-mono font-bold uppercase ${ENV_META[activeEnvironment].color}`}>
              {activeEnvironment}
            </span>
          </div>

          <button
            onClick={fetchEnvironments}
            className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] bg-[#f5f5f7] rounded-full border border-[#d2d2d7] hover:border-[#86868b] transition-colors"
            title="Refresh environments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-[#34c759]/10 border border-[#34c759]/25 text-[#15803d] p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
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
              className={`bg-white rounded-[28px] border p-6 sm:p-7 transition-all shadow-apple-card ${
                isActive 
                  ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-apple-md' 
                  : 'border-black/[0.05] hover:border-black/[0.12]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.border} border shadow-sm`}>
                    <Server className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-[#1d1d1f]">{meta.label}</h3>
                      {isActive && (
                        <span className="text-[10px] font-mono uppercase bg-[#0071e3] text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6e6e73] mt-0.5 max-w-xs leading-relaxed">{meta.desc}</p>
                  </div>
                </div>

                {!isActive && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setActiveEnvironment(envName)}
                  >
                    Activate
                  </Button>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 bg-[#fbfbfd] p-3.5 rounded-2xl border border-[#d2d2d7]/50 mb-5 text-center">
                <div>
                  <div className="text-[10px] text-[#86868b] uppercase font-mono font-medium">Mock Records</div>
                  <div className="text-base font-extrabold text-[#1d1d1f] font-mono mt-0.5">
                    {config.recordCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#86868b] uppercase font-mono font-medium">Sim. Latency</div>
                  <div className="text-base font-extrabold text-[#1d1d1f] font-mono mt-0.5">
                    {config.latencyMs}ms
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#86868b] uppercase font-mono font-medium">Chaos Failure</div>
                  <div className={`text-base font-extrabold font-mono mt-0.5 ${config.failureRatePercent > 0 ? 'text-[#b45309]' : 'text-[#15803d]'}`}>
                    {config.failureRatePercent}%
                  </div>
                </div>
              </div>

              {/* Sliders & Controls */}
              <div className="space-y-4 mb-6 text-xs">
                <div>
                  <div className="flex justify-between text-[#515154] mb-1.5">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>Network Latency Simulation</span>
                    </span>
                    <span className="font-mono text-[#1d1d1f] font-bold">{config.latencyMs}ms</span>
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
                    className="w-full h-1.5 bg-[#e8e8ed] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#515154] mb-1.5">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                      <span>Simulated 500 Chaos Faults</span>
                    </span>
                    <span className={`font-mono font-bold ${config.failureRatePercent > 0 ? 'text-[#b45309]' : 'text-[#86868b]'}`}>
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
                    className="w-full h-1.5 bg-[#e8e8ed] rounded-lg appearance-none cursor-pointer accent-[#ff9500]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#d2d2d7]/50">
                <button
                  onClick={() => setCloneModal({ source: envName === 'sandbox' ? 'development' : 'sandbox', target: envName })}
                  className="flex items-center space-x-1.5 text-xs text-[#515154] hover:text-[#1d1d1f] font-medium transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Clone Data From...</span>
                </button>

                <button
                  onClick={() => setResetModalEnv(envName)}
                  className="flex items-center space-x-1.5 text-xs text-[#dc2626] hover:text-[#991b1b] font-medium transition-colors"
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
      <Modal
        isOpen={Boolean(resetModalEnv)}
        onClose={() => setResetModalEnv(null)}
        title={
          <div className="flex items-center gap-2 text-[#dc2626]">
            <AlertTriangle className="w-5 h-5" />
            <span>Reset {resetModalEnv?.toUpperCase()} State</span>
          </div>
        }
        description={`This will permanently delete all mock database records in the ${resetModalEnv?.toUpperCase()} environment. Other environments remain untouched.`}
        maxWidth="sm"
      >
        <div className="flex justify-end space-x-2 mt-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setResetModalEnv(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={resetting}
            onClick={() => resetModalEnv && handleReset(resetModalEnv)}
          >
            {resetting ? 'Resetting...' : 'Confirm Reset'}
          </Button>
        </div>
      </Modal>

      {/* Clone Modal */}
      <Modal
        isOpen={Boolean(cloneModal)}
        onClose={() => setCloneModal(null)}
        title="Clone Environment Data"
        description={`Copy all mock database records from a source environment into ${cloneModal?.target.toUpperCase()}.`}
        maxWidth="sm"
      >
        {cloneModal && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#1d1d1f] mb-1.5 font-semibold">Source Environment</label>
              <select
                value={cloneModal.source}
                onChange={(e) => setCloneModal({ ...cloneModal, source: e.target.value as EnvironmentType })}
                className="w-full bg-white border border-[#d2d2d7] rounded-xl p-2.5 text-[#1d1d1f] font-mono focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15"
              >
                {(['sandbox', 'development', 'staging', 'live'] as EnvironmentType[])
                  .filter(e => e !== cloneModal.target)
                  .map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[#1d1d1f] mb-1.5 font-semibold">Target Environment</label>
              <input
                type="text"
                disabled
                value={cloneModal.target.toUpperCase()}
                className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl p-2.5 text-[#6e6e73] font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCloneModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={cloning}
                onClick={handleClone}
              >
                {cloning ? 'Cloning...' : 'Clone Database'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
