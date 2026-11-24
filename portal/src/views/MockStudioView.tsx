import React, { useState } from 'react';
import { Plus, Search, Code2, Edit2, Trash2, Sliders, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { MockRoute, Project } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';

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
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch = r.path.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || r.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161617] p-3.5 rounded-2xl border border-white/10 shadow-apple-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search endpoints..."
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-full pl-8 pr-3 py-1.5 text-xs text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/60 font-mono"
            />
          </div>

          {/* Method Filter Pills */}
          <div className="flex space-x-1 bg-[#1c1c1e] p-1 rounded-full border border-white/10 text-xs">
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-0.5 rounded-full text-[11px] font-mono transition-colors ${
                  filterMethod === m
                    ? 'bg-[#0071e3] text-white font-semibold'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="p-2 text-[#86868b] hover:text-white bg-[#1c1c1e] rounded-full border border-white/10 hover:border-white/20 transition-colors"
            title="Refresh routes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={onOpenNewRoute}
        >
          New Mock Route
        </Button>
      </div>

      {/* Routes Table */}
      <div className="bg-[#161617] border border-white/10 rounded-3xl overflow-hidden shadow-apple-sm">
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#a1a1a6]">
              <Code2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#f5f5f7] mb-1">No Mock Endpoints Found</h4>
            <p className="text-xs text-[#86868b] max-w-sm mx-auto mb-4">
              {search || filterMethod !== 'ALL'
                ? 'No routes matched your filter query. Try resetting filters.'
                : 'Get started by creating your first mock route to test your frontend.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenNewRoute}
            >
              Create Mock Route
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#121213] text-[#86868b] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 font-medium">Method & Path</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Latency</th>
                  <th className="py-3.5 px-4 font-medium">Chaos</th>
                  <th className="py-3.5 px-4 font-medium">Mode</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRoutes.map((route, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                    {/* Method & Path */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <Badge method={route.method} size="sm" />
                        <span className="font-mono text-[#f5f5f7] text-xs font-medium">
                          {route.path}
                        </span>
                        <button
                          onClick={() => handleCopyPath(route.path)}
                          className="text-[#86868b] hover:text-white p-1 rounded-full transition-colors"
                          title="Copy path"
                        >
                          {copiedPath === route.path ? (
                            <Check className="w-3 h-3 text-[#30d158]" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status code */}
                    <td className="py-3.5 px-4">
                      <Badge statusCode={route.statusCode} size="sm" />
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-4 font-mono text-[#a1a1a6]">
                      <div className="flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#86868b]" />
                        <span>{route.latencyMs || 0} ms</span>
                      </div>
                    </td>

                    {/* Chaos failure rate */}
                    <td className="py-3.5 px-4 font-mono">
                      {route.failureRatePercent > 0 ? (
                        <span className="text-[#ff9f0a] flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{route.failureRatePercent}%</span>
                        </span>
                      ) : (
                        <span className="text-[#6e6e73]">0%</span>
                      )}
                    </td>

                    {/* Mode (Echo vs Template) */}
                    <td className="py-3.5 px-4">
                      {route.isEcho ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#64d2ff]/15 text-[#64d2ff] border border-[#64d2ff]/30 text-[10px] font-mono font-medium">
                          Echo Mode
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#a1a1a6] border border-white/10 text-[10px] font-mono">
                          JSON Template
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={<Code2 className="w-3 h-3 text-[#2997ff]" />}
                          onClick={() => onConnectCode(route)}
                          title="Generate Frontend Integration Code"
                        >
                          Connect
                        </Button>

                        <button
                          onClick={() => onEditRoute(route)}
                          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#a1a1a6] hover:text-white border border-white/10 transition-colors"
                          title="Edit Route"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => {
                            const routeSK = route.SK || `ROUTE#${route.method}#${route.path}`;
                            if (confirm(`Delete mock endpoint [${route.method}] ${route.path}?`)) {
                              onDeleteRoute(routeSK);
                            }
                          }}
                          className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-[#a1a1a6] hover:text-[#ff453a] border border-white/10 transition-colors"
                          title="Delete Route"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
