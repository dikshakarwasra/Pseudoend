import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Menu,
  X
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

const ENV_META: Record<EnvironmentType, { label: string; text: string; bg: string; dot: string; border: string }> = {
  sandbox: { 
    label: 'Sandbox', 
    text: 'text-[#ff9f0a]', 
    bg: 'bg-[#ff9f0a]/10 hover:bg-[#ff9f0a]/15', 
    dot: 'bg-[#ff9f0a]',
    border: 'border-[#ff9f0a]/30'
  },
  development: { 
    label: 'Development', 
    text: 'text-[#2997ff]', 
    bg: 'bg-[#0071e3]/10 hover:bg-[#0071e3]/15', 
    dot: 'bg-[#2997ff]',
    border: 'border-[#0071e3]/30'
  },
  staging: { 
    label: 'Staging', 
    text: 'text-[#bf5af2]', 
    bg: 'bg-[#bf5af2]/10 hover:bg-[#bf5af2]/15', 
    dot: 'bg-[#bf5af2]',
    border: 'border-[#bf5af2]/30'
  },
  live: { 
    label: 'Live (Simulated)', 
    text: 'text-[#64d2ff]', 
    bg: 'bg-[#64d2ff]/10 hover:bg-[#64d2ff]/15', 
    dot: 'bg-[#64d2ff]',
    border: 'border-[#64d2ff]/30'
  }
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const envDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (envDropdownRef.current && !envDropdownRef.current.contains(e.target as Node)) {
        setIsEnvDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const currentEnv = ENV_META[activeEnvironment] || ENV_META.sandbox;

  // Render vertical menu content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header — NO 2.0 */}
        <div className="p-5 border-b border-white/10">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className="flex items-center space-x-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:bg-white/15 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white font-mono">
              PSEUDOEND
            </span>
          </button>

          {/* Environment Switcher Dropdown */}
          <div className="relative mt-4" ref={envDropdownRef}>
            <div className="text-[10px] font-mono uppercase text-[#86868b] tracking-wider mb-1 font-semibold">
              Active Environment
            </div>
            <button
              type="button"
              onClick={() => setIsEnvDropdownOpen(!isEnvDropdownOpen)}
              className={`w-full flex items-center justify-between text-xs font-mono font-medium px-3 py-2 rounded-xl border transition-all ${currentEnv.bg} ${currentEnv.text} ${currentEnv.border}`}
              title="Switch target mock environment"
            >
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${currentEnv.dot}`} />
                <span className="capitalize">{currentEnv.label}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isEnvDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-apple-md p-1.5 z-50 animate-scale-in">
                {(['sandbox', 'development', 'staging', 'live'] as EnvironmentType[]).map((env) => {
                  const cfg = ENV_META[env];
                  const isSelected = activeEnvironment === env;
                  return (
                    <button
                      key={env}
                      onClick={() => {
                        setActiveEnvironment(env);
                        setIsEnvDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 text-xs font-mono px-2.5 py-2 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? 'bg-[#0071e3] text-white font-semibold' 
                          : 'text-[#a1a1a6] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="flex-1 capitalize">{cfg.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Navigation Menu */}
        <div className="px-3 py-4">
          <div className="text-[10px] font-mono uppercase text-[#86868b] tracking-wider px-3 mb-2 font-semibold">
            Platform Tools
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0071e3] text-white shadow-apple-sm font-semibold'
                      : 'text-[#a1a1a6] hover:text-[#f5f5f7] hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#86868b]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {user.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#ff9f0a] text-black font-semibold shadow-apple-sm'
                    : 'text-[#ff9f0a]/90 hover:text-[#ff9f0a] hover:bg-[#ff9f0a]/10'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer: Project Key, Tier, and Account Controls */}
      <div className="p-3.5 border-t border-white/10 space-y-2.5 bg-[#0f0f10]">
        {/* Project API Key copy pill */}
        {activeProject && (
          <button
            onClick={copyApiKey}
            className="w-full flex items-center justify-between text-xs font-mono bg-[#1c1c1e] border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl text-[#d2d2d7] transition-colors"
            title="Click to copy Project API Key"
          >
            <div className="flex items-center space-x-2 truncate">
              <Key className="w-3.5 h-3.5 text-[#2997ff] shrink-0" />
              <span className="truncate">
                {activeProject.apiKey 
                  ? `${activeProject.apiKey.slice(0, 10)}...` 
                  : activeProject.rawApiKeyPrefix || 'API Key'}
              </span>
            </div>
            {copiedKey ? (
              <Check className="w-3.5 h-3.5 text-[#30d158] shrink-0 ml-1.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#86868b] shrink-0 ml-1.5" />
            )}
          </button>
        )}

        {/* Quota Request Trigger */}
        <button
          onClick={onRequestQuota}
          className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 hover:border-white/20 text-[#a1a1a6] hover:text-[#ff9f0a] transition-colors"
          title="Request daily credit limit increase"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-[#ff9f0a]" />
            <span className="capitalize">{user.tier} Tier</span>
          </div>
          <span className="text-[10px] text-[#ff9f0a] font-mono font-semibold">Upgrade</span>
        </button>

        {/* User Account Tile */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-[#f5f5f7] truncate" title={user.email}>
                {user.email.split('@')[0]}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={onDeleteAccount}
              className="text-[#86868b] hover:text-[#ff453a] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="text-[#86868b] hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 shrink-0 border-r border-white/10 bg-[#121213] z-30 flex-col">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Top Bar with Hamburger */}
      <div className="md:hidden sticky top-0 z-40 bg-[#121213]/90 backdrop-blur-xl border-b border-white/10 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2 text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white font-mono">
            PSEUDOEND
          </span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Active env indicator */}
          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${currentEnv.bg} ${currentEnv.text} ${currentEnv.border}`}>
            {currentEnv.label}
          </span>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#a1a1a6] hover:text-white rounded-xl bg-white/5 border border-white/10"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-xl flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <div className="w-72 max-w-[85vw] h-full bg-[#121213] border-r border-white/10 shadow-apple-md animate-scale-in">
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
};
