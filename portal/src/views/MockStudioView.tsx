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
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-4 rounded-2xl border border-black/[0.05] shadow-apple-card">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search endpoints..."
              className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 font-mono shadow-sm"
            />
          </div>

          {/* Method Filter Pills */}
          <div className="flex space-x-1 bg-[#f5f5f7] p-1 rounded-full border border-black/[0.04] text-xs">
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
                  filterMethod === m
                    ? 'bg-white text-[#1d1d1f] font-bold shadow-apple-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] bg-[#f5f5f7] rounded-full border border-[#d2d2d7] hover:border-[#86868b] transition-colors"
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
      <div className="bg-white border border-black/[0.05] rounded-[28px] overflow-hidden shadow-apple-card">
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f2fc] text-[#0071e3] flex items-center justify-center mx-auto mb-3">
              <Code2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f] mb-1">No Mock Endpoints Found</h4>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto mb-5 leading-relaxed">
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
                <tr className="border-b border-[#d2d2d7]/50 bg-[#fbfbfd] text-[#86868b] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-4 px-5 font-semibold">Method & Path</th>
                  <th className="py-4 px-5 font-semibold">Status</th>
                  <th className="py-4 px-5 font-semibold">Latency</th>
                  <th className="py-4 px-5 font-semibold">Chaos</th>
                  <th className="py-4 px-5 font-semibold">Mode</th>
                  <th className="py-4 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2d2d7]/40">
                {filteredRoutes.map((route, idx) => (
                  <tr key={idx} className="hover:bg-[#f5f5f7]/60 transition-colors">
                    {/* Method & Path */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <Badge method={route.method} size="sm" />
                        <span className="font-mono text-[#1d1d1f] text-xs font-semibold">
                          {route.path}
                        </span>
                        <button
                          onClick={() => handleCopyPath(route.path)}
                          className="text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full transition-colors"
                          title="Copy path"
                        >
                          {copiedPath === route.path ? (
                            <Check className="w-3.5 h-3.5 text-[#34c759]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status code */}
                    <td className="py-4 px-5">
                      <Badge statusCode={route.statusCode} size="sm" />
                    </td>

                    {/* Latency */}
                    <td className="py-4 px-5 font-mono text-[#515154]">
                      <div className="flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#86868b]" />
                        <span className="font-medium">{route.latencyMs || 0} ms</span>
                      </div>
                    </td>

                    {/* Chaos failure rate */}
                    <td className="py-4 px-5 font-mono">
                      {route.failureRatePercent > 0 ? (
                        <span className="text-[#b45309] font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{route.failureRatePercent}%</span>
                        </span>
                      ) : (
                        <span className="text-[#86868b]">0%</span>
                      )}
                    </td>

                    {/* Mode (Echo vs Template) */}
                    <td className="py-4 px-5">
                      {route.isEcho ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 text-[10px] font-mono font-semibold">
                          Echo Mode
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-black/5 text-[#515154] border border-black/10 text-[10px] font-mono">
                          JSON Template
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={<Code2 className="w-3 h-3 text-[#0071e3]" />}
                          onClick={() => onConnectCode(route)}
                          title="Generate Frontend Integration Code"
                        >
                          Connect
                        </Button>

                        <button
                          onClick={() => onEditRoute(route)}
                          className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-[#515154] hover:text-[#1d1d1f] flex items-center justify-center transition-colors"
                          title="Edit Route"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            const routeSK = route.SK || `ROUTE#${route.method}#${route.path}`;
                            if (confirm(`Delete mock endpoint [${route.method}] ${route.path}?`)) {
                              onDeleteRoute(routeSK);
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#dc2626] flex items-center justify-center transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
};
