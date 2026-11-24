import React, { useState, useEffect } from 'react';
import { User, Project, MockRoute, EnvironmentType } from './types.js';
import { Header, PortalTab } from './components/Header.js';
import { RouteModal } from './components/RouteModal.js';
import { CodeConnectModal } from './components/CodeConnectModal.js';
import { QuotaRequestModal } from './components/QuotaRequestModal.js';
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

export function App() {
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
        alert('Failed to delete account.');
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
      fetchRoutes(activeProject.id, token);
    } catch (err) {
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
  };

  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
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

export default App;

