import React, { useState } from 'react';
import { 
  Terminal, 
  Key, 
  Copy, 
  Check, 
  Zap, 
  Shield, 
  LogOut, 
  Trash2, 
  Layers, 
  Network, 
  Server, 
  Activity, 
  History, 
  FileUp,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { User, Project, EnvironmentType } from '../types.js';

export type PortalTab = 
  | 'dashboard' 
  | 'studio' 
  | 'relationships' 
  | 'environments' 
  | 'testing' 
  | 'timetravel' 
  | 'import' 
  | 'inspector' 
  | 'admin';

interface HeaderProps {
  user: User;
  activeProject: Project | null;
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  activeEnvironment: EnvironmentType;
  setActiveEnvironment: (env: EnvironmentType) => void;
  onRequestQuota: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const ENV_COLORS: Record<EnvironmentType, { label: string; text: string; bg: string; dot: string }> = {
  sandbox: { label: 'Sandbox', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
  development: { label: 'Development', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  staging: { label: 'Staging', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-400' },
  live: { label: 'Live (Simulated)', text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', dot: 'bg-purple-400' }
};

export const Header: React.FC<HeaderProps> = ({
  user,
  activeProject,
  activeTab,
  setActiveTab,
  activeEnvironment,
  setActiveEnvironment,
  onRequestQuota,
  onLogout,
  onDeleteAccount
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState(false);

  const copyApiKey = () => {
    const key = activeProject?.apiKey || activeProject?.rawApiKeyPrefix || '';
    if (key) {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const navItems: { id: PortalTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Mock Studio', icon: Layers },
    { id: 'relationships', label: 'Data Relationships', icon: Network },
    { id: 'environments', label: 'Environments', icon: Server },
    { id: 'testing', label: 'Health & Testing', icon: Activity },
    { id: 'timetravel', label: 'Time-Travel & Replay', icon: History },
    { id: 'import', label: 'Import API', icon: FileUp },
    { id: 'inspector', label: 'Live Inspector', icon: Terminal }
  ];

  const currentEnvMeta = ENV_COLORS[activeEnvironment];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Top row: Brand + Environment Switcher */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Pseudoend
              </span>
              <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                2.0
              </span>
            </div>
          </div>

          {/* FEATURE 2 UI: Elegant Environment Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsEnvDropdownOpen(!isEnvDropdownOpen)}
              className={`flex items-center space-x-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all ${currentEnvMeta.bg} ${currentEnvMeta.text}`}
              title="Click to switch active mock environment"
            >
              <span className={`w-2 h-2 rounded-full ${currentEnvMeta.dot} animate-pulse`} />
              <span>{currentEnvMeta.label}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {isEnvDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1">
                  Select Environment
                </div>
                {(['sandbox', 'development', 'staging', 'live'] as EnvironmentType[]).map((env) => {
                  const meta = ENV_COLORS[env];
                  return (
                    <button
                      key={env}
                      onClick={() => {
                        setActiveEnvironment(env);
                        setIsEnvDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 text-xs font-mono px-2.5 py-2 rounded-lg text-left transition-colors ${
                        activeEnvironment === env 
                          ? 'bg-slate-800 text-white font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span className="capitalize">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-3 shrink-0">
          {activeProject && (
            <button
              onClick={copyApiKey}
              className="flex items-center space-x-1.5 text-xs font-mono bg-slate-950 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-md text-slate-300 transition-colors"
              title="Click to copy API Key"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeProject.apiKey ? `${activeProject.apiKey.slice(0, 10)}...` : activeProject.rawApiKeyPrefix || 'API Key'}</span>
              {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          )}

          <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-2.5">
            <span className="text-xs text-slate-400 max-w-[120px] truncate" title={user.email}>
              {user.email.split('@')[0]}
            </span>
            <button
              onClick={onDeleteAccount}
              className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
              title="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


