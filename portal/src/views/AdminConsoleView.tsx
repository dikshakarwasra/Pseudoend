import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, DollarSign, Check, X, Ban, UserCheck, RefreshCw } from 'lucide-react';
import { AdminStats, QuotaRequest } from '../types.js';

interface AdminConsoleViewProps {
  apiBaseUrl: string;
  token: string;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ apiBaseUrl, token }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1,
    totalRequestsToday: 0,
    estimatedMonthlyCostUsd: 0.00,
    freeTierStatus: '100% Free'
  });
  const [requests, setRequests] = useState<QuotaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reqsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/admin/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        setRequests(reqsData.requests || []);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage(`Request ${id} approved successfully.`);
        fetchData();
      }
    } catch (err: any) {
      setActionMessage('Failed to approve request: ' + err.message);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/requests/${id}/deny`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage(`Request ${id} denied.`);
        fetchData();
      }
    } catch (err: any) {
      setActionMessage('Failed to deny request: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Administrative Governance Console</h2>
            <p className="text-xs text-slate-400">Monitor cloud usage, prevent credit exhaustion, and manage user quotas</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
          title="Refresh metrics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.totalUsers}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Active Accounts</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Daily Requests</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.totalRequestsToday.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Aggregated across all users</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Estimated AWS Cost</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${stats.estimatedMonthlyCostUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">{stats.freeTierStatus}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pending Upgrades</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {requests.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting approval</div>
        </div>
      </div>

      {/* Pending Limit Requests Queue */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
            Pending Quota Increase Requests
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {requests.filter(r => r.status === 'PENDING').length} pending
          </span>
        </div>

        {requests.filter(r => r.status === 'PENDING').length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No pending quota upgrade requests in queue.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {requests.filter(r => r.status === 'PENDING').map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-white">{req.userEmail}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Current: {req.currentTier}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Requested: {req.requestedTier.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic">"{req.reason}"</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Submitted: {new Date(req.submittedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Upgrade</span>
                  </button>
                  <button
                    onClick={() => handleDeny(req.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Deny</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

