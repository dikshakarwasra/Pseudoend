import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, DollarSign, Check, X, RefreshCw } from 'lucide-react';
import { AdminStats, QuotaRequest } from '../types.js';
import { Button } from '../components/ui/Button.js';

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
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 flex items-center justify-center text-[#ff9f0a]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Administrative Governance Console</h2>
            <p className="text-xs text-[#86868b]">Monitor cloud usage, prevent credit exhaustion, and manage user quotas</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-[#86868b] hover:text-[#1d1d1f] bg-[#f5f5f7] rounded-full border border-[#d2d2d7] hover:border-[#b0b0b7] transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-[#0071e3]/10 border border-[#0071e3]/30 rounded-xl text-xs text-[#2997ff] flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-[#86868b] hover:text-[#1d1d1f]">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868b] text-xs mb-1">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-[#86868b]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.totalUsers}</div>
          <div className="text-[11px] text-[#2997ff] mt-1 font-mono">Active Accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868b] text-xs mb-1">
            <span>Daily Requests</span>
            <Activity className="w-4 h-4 text-[#2997ff]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.totalRequestsToday.toLocaleString()}</div>
          <div className="text-[11px] text-[#86868b] mt-1">Aggregated today</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868b] text-xs mb-1">
            <span>Estimated AWS Cost</span>
            <DollarSign className="w-4 h-4 text-[#64d2ff]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${stats.estimatedMonthlyCostUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#30d158] mt-1 font-mono font-medium">{stats.freeTierStatus}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868b] text-xs mb-1">
            <span>Pending Upgrades</span>
            <Shield className="w-4 h-4 text-[#ff9f0a]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#ff9f0a]">
            {requests.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-[#86868b] mt-1">Awaiting approval</div>
        </div>
      </div>

      {/* Pending Limit Requests Queue */}
      <div className="bg-white border border-black/[0.05] rounded-2xl overflow-hidden shadow-apple-sm">
        <div className="p-4 border-b border-[#d2d2d7]/50 bg-[#fbfbfd] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Pending Quota Increase Requests
          </h3>
          <span className="text-xs text-[#86868b] font-mono">
            {requests.filter(r => r.status === 'PENDING').length} pending
          </span>
        </div>

        {requests.filter(r => r.status === 'PENDING').length === 0 ? (
          <div className="text-center py-12 text-xs text-[#86868b] font-mono">
            No pending quota upgrade requests in queue.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {requests.filter(r => r.status === 'PENDING').map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.02] transition-colors">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-white">{req.userEmail}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#515154] border border-[#d2d2d7]">
                      Current: {req.currentTier}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#2997ff] border border-[#0071e3]/20 font-bold">
                      Requested: {req.requestedTier.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#d2d2d7] italic">"{req.reason}"</p>
                  <span className="text-[10px] text-[#86868b] font-mono mt-1 block">
                    Submitted: {new Date(req.submittedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="primary"
                    size="xs"
                    icon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => handleApprove(req.id)}
                  >
                    Approve Upgrade
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    icon={<X className="w-3.5 h-3.5" />}
                    onClick={() => handleDeny(req.id)}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
