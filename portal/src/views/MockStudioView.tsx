import React, { useState } from 'react';
import { Plus, Search, Code2, Edit2, Trash2, Sliders, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { MockRoute, Project } from '../types.js';

interface MockStudioViewProps {
  routes: MockRoute[];
  activeProject: Project | null;
  apiBaseUrl: string;
  onOpenNewRoute: () => void;
  onEditRoute: (route: MockRoute) => void;
  onDeleteRoute: (routeSK: string) => Promise<void>;
  onConnectCode: (route: MockRoute) => void;
  onRefresh: () => void;
}

export const MockStudioView: React.FC<MockStudioViewProps> = ({
  routes,
  activeProject,
  apiBaseUrl,
  onOpenNewRoute,
  onEditRoute,
  onDeleteRoute,
  onConnectCode,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch = r.path.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || r.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PUT': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PATCH': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DELETE': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter routes by path..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMethod === m
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-800"
            title="Refresh routes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onOpenNewRoute}
          className="flex items-center space-x-2 bg-emerald-400 hover:bg-emerald-300 text-black px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Mock Route</span>
        </button>
      </div>

      {/* Routes Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Code2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">No Mock Endpoints Configured</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Get started by adding your first mock route to test your frontend.
            </p>
            <button
              onClick={onOpenNewRoute}
              className="inline-flex items-center space-x-2 bg-emerald-400 hover:bg-emerald-300 text-black px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Mock Route</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4">Method & Path</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Chaos</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoutes.map((route, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getMethodBadgeClass(route.method)}`}>
                        {route.method}
                      </span>
                      <span className="font-mono text-slate-200 text-xs font-medium">
                        {route.path}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                      {route.statusCode}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      <span>{route.latencyMs || 0} ms</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400">
                    {route.failureRatePercent > 0 ? (
                      <span className="text-amber-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{route.failureRatePercent}%</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">0%</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {route.isEcho ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono">
                        Echo Mode
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        Template
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onConnectCode(route)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs flex items-center space-x-1 border border-slate-700 transition-colors"
                        title="Generate Frontend Integration Code"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>

                      <button
                        onClick={() => onEditRoute(route)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Edit Route"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const routeSK = route.SK || `ROUTE#${route.method}#${route.path}`;
                          if (confirm(`Delete route [${route.method}] ${route.path}?`)) {
                            onDeleteRoute(routeSK);
                          }
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                        title="Delete Route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

