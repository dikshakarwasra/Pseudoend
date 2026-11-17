import React, { useState } from 'react';
import { Terminal, Key, Copy, Check, Zap, Shield, LogOut, Trash2 } from 'lucide-react';
import { User, Project } from '../types.js';

interface HeaderProps {
  user: User;
  activeProject: Project | null;
  activeTab: 'studio' | 'inspector' | 'admin';
  setActiveTab: (tab: 'studio' | 'inspector' | 'admin') => void;
  onRequestQuota: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeProject,
  activeTab,
  setActiveTab,
  onRequestQuota,
  onLogout,
  onDeleteAccount
}) => {
  const [copiedKey, setCopiedKey] = useState(false);

  const copyApiKey = () => {
    const key = activeProject?.apiKey || activeProject?.rawApiKeyPrefix || '';
    if (key) {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Pseudoend
              </span>
              <span className="ml-2 text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0 serverless
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'studio'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Mock Studio
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'inspector'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Live Inspector
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-4">
          {/* API Key Copy Pill */}
          {activeProject && (
            <button
              onClick={copyApiKey}
              className="flex items-center space-x-2 text-xs font-mono bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-md text-slate-300 transition-colors"
              title="Click to copy API Key"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeProject.apiKey ? `${activeProject.apiKey.slice(0, 14)}...` : activeProject.rawApiKeyPrefix || 'Copy API Key'}</span>
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          )}

          {/* Credit Meter Pill */}
          <div className="flex items-center space-x-2 bg-slate-800/70 border border-slate-700/60 px-3 py-1.5 rounded-md text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 font-mono">
              Tier: <strong className="text-white capitalize">{user.tier}</strong> ({user.dailyCreditLimit.toLocaleString()} req/day)
            </span>
            <button
              onClick={onRequestQuota}
              className="ml-2 text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Increase
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <span className="text-xs text-slate-400 max-w-[140px] truncate" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={onDeleteAccount}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded transition-colors"
              title="Delete Account (GDPR)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

