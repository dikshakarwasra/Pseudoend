import React, { useState, useEffect } from 'react';
import { User, Project, MockRoute, EnvironmentType } from './types.js';
import { Header, PortalTab } from './components/Header.js';
import { RouteModal } from './components/RouteModal.js';
import { CodeConnectModal } from './components/CodeConnectModal.js';
import { QuotaRequestModal } from './components/QuotaRequestModal.js';
import { ToastProvider, useToast } from './components/ui/Toast.js';
import { AuthView } from './views/AuthView.js';
import { DashboardView } from './views/DashboardView.js';
import { MockStudioView } from './views/MockStudioView.js';
import { DataRelationshipsView } from './views/DataRelationshipsView.js';
import { EnvironmentsView } from './views/EnvironmentsView.js';
import { ApiTestingView } from './views/ApiTestingView.js';
import { TimeTravelView } from './views/TimeTravelView.js';
import { ApiImportView } from './views/ApiImportView.js';
import { LiveInspectorView } from './views/LiveInspectorView.js';
import { AdminConsoleView } from './views/AdminConsoleView.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://8dbk9yr376.execute-api.us-east-1.amazonaws.com';

const TAB_TITLES: Record<PortalTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Project metrics and platform overview' },
  studio: { title: 'Mock Studio', subtitle: 'Manage mock endpoints, latency, and response bodies' },
  relationships: { title: 'Data Relationships', subtitle: 'Visual schema graph and relational integrity' },
  environments: { title: 'Environments', subtitle: 'Isolated sandbox, dev, staging, and live database states' },
  testing: { title: 'Health & Testing', subtitle: 'Automated end-to-end diagnostics and benchmark reports' },
  timetravel: { title: 'Time-Travel & Replay', subtitle: 'Database state checkpoints, diffs, and request replay' },
  import: { title: 'Import API', subtitle: 'OpenAPI 3.0 blueprint importer and schema generation' },
  inspector: { title: 'Live Inspector', subtitle: 'Interactive live request runner and response inspector' },
  admin: { title: 'Admin Console', subtitle: 'Cloud usage governance and quota upgrade review' }
};

function AppContent() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('pseudoend_token') || localStorage.getItem('sudoend_token'));
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('pseudoend_user') || localStorage.getItem('sudoend_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [routes, setRoutes] = useState<MockRoute[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentType>('sandbox');
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');

  // Modals state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<MockRoute | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectRoute, setConnectRoute] = useState<MockRoute | null>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  const { success, error } = useToast();

  // Fetch projects upon login
  const fetchProjectsAndUser = async (authToken: string) => {
    try {
      const [userRes, projRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        localStorage.setItem('pseudoend_user', JSON.stringify(userData.user));
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
        if (projData.projects && projData.projects.length > 0) {
          const firstProj = projData.projects[0];
          setActiveProject(firstProj);
          fetchRoutes(firstProj.id, authToken);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchRoutes = async (projectId: string, authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes/${projectId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjectsAndUser(token);
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: User, initialProject?: Project) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pseudoend_token', newToken);
    localStorage.setItem('pseudoend_user', JSON.stringify(newUser));
    localStorage.removeItem('sudoend_token');
    localStorage.removeItem('sudoend_user');
    success('Welcome to Pseudoend');
    if (initialProject) {
      setProjects([initialProject]);
      setActiveProject(initialProject);
      fetchRoutes(initialProject.id, newToken);
    } else {
      fetchProjectsAndUser(newToken);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setProjects([]);
    setRoutes([]);
    localStorage.removeItem('pseudoend_token');
    localStorage.removeItem('pseudoend_user');
    localStorage.removeItem('sudoend_token');
    localStorage.removeItem('sudoend_user');
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    if (confirm('Are you sure you want to PERMANENTLY delete your Pseudoend account and all mock routes? This cannot be undone.')) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        handleLogout();
      } catch (err) {
        error('Failed to delete account.');
      }
    }
  };

  const handleSaveRoute = async (routeData: Partial<MockRoute>) => {
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/routes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(routeData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to save route');
    }

    success('Mock endpoint saved successfully.');

    if (activeProject) {
      fetchRoutes(activeProject.id, token);
    }
  };

  const handleDeleteRoute = async (routeSK: string) => {
    if (!token || !activeProject) return;
    try {
      const encodedSK = encodeURIComponent(routeSK);
      await fetch(`${API_BASE_URL}/api/routes/${activeProject.id}/${encodedSK}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      success('Mock endpoint deleted.');
      fetchRoutes(activeProject.id, token);
    } catch (err) {
      error('Failed to delete route.');
      console.error('Failed to delete route:', err);
    }
  };

  const handleSubmitQuotaRequest = async (requestedTier: string, reason: string) => {
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/quota/request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requestedTier, reason })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to submit request');
    }

    success('Quota upgrade request submitted.');
  };

  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} apiBaseUrl={API_BASE_URL} />;
  }

  const currentMeta = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col md:flex-row font-sans selection:bg-[#0071e3] selection:text-white">
      {/* Vertical Sidebar Navigation */}
      <Header
        user={user}
        activeProject={activeProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeEnvironment={activeEnvironment}
        setActiveEnvironment={setActiveEnvironment}
        onRequestQuota={() => setIsQuotaModalOpen(true)}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#000000]">
        {/* Subtle Workspace Header Bar */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-14 border-b border-white/10 bg-[#121213]/60 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-semibold text-[#f5f5f7] tracking-tight">{currentMeta.title}</h1>
            <p className="text-[11px] text-[#86868b]">{currentMeta.subtitle}</p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#86868b] font-mono">
              Project: <strong className="text-[#d2d2d7]">{activeProject?.name || 'Default Project'}</strong>
            </span>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              activeProject={activeProject}
              routes={routes}
              activeEnvironment={activeEnvironment}
              apiBaseUrl={API_BASE_URL}
              token={token}
              onNavigate={(t) => setActiveTab(t)}
              onOpenNewRoute={() => { setEditingRoute(null); setIsRouteModalOpen(true); }}
            />
          )}

          {activeTab === 'studio' && (
            <MockStudioView
              routes={routes}
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
              onOpenNewRoute={() => { setEditingRoute(null); setIsRouteModalOpen(true); }}
              onEditRoute={(r) => { setEditingRoute(r); setIsRouteModalOpen(true); }}
              onDeleteRoute={handleDeleteRoute}
              onConnectCode={(r) => { setConnectRoute(r); setIsConnectModalOpen(true); }}
              onRefresh={() => activeProject && fetchRoutes(activeProject.id, token)}
            />
          )}

          {activeTab === 'relationships' && (
            <DataRelationshipsView
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
              token={token}
              activeEnvironment={activeEnvironment}
            />
          )}

          {activeTab === 'environments' && (
            <EnvironmentsView
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
              token={token}
              activeEnvironment={activeEnvironment}
              setActiveEnvironment={setActiveEnvironment}
            />
          )}

          {activeTab === 'testing' && (
            <ApiTestingView
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
              token={token}
              activeEnvironment={activeEnvironment}
            />
          )}

          {activeTab === 'timetravel' && (
            <TimeTravelView
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
              token={token}
              activeEnvironment={activeEnvironment}
            />
          )}

          {activeTab === 'import' && (
            <ApiImportView
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
              token={token}
              activeEnvironment={activeEnvironment}
              onImportComplete={() => {
                if (activeProject) fetchRoutes(activeProject.id, token);
                setActiveTab('studio');
              }}
            />
          )}

          {activeTab === 'inspector' && (
            <LiveInspectorView
              activeProject={activeProject}
              apiBaseUrl={API_BASE_URL}
            />
          )}

          {activeTab === 'admin' && user.role === 'admin' && (
            <AdminConsoleView
              apiBaseUrl={API_BASE_URL}
              token={token}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <RouteModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        onSave={handleSaveRoute}
        initialRoute={editingRoute}
        projectId={activeProject?.id || 'default'}
      />

      <CodeConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        route={connectRoute}
        projectId={activeProject?.id || 'default'}
        apiKey={activeProject?.apiKey || activeProject?.rawApiKeyPrefix || ''}
        apiBaseUrl={API_BASE_URL}
      />

      <QuotaRequestModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        onSubmit={handleSubmitQuotaRequest}
        currentTier={user.tier}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
