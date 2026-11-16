import React, { useState, useEffect } from 'react';
import { X, Sliders, AlertTriangle, Code, Check } from 'lucide-react';
import { MockRoute } from '../types.js';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (route: Partial<MockRoute>) => Promise<void>;
  initialRoute?: MockRoute | null;
  projectId: string;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRoute,
  projectId
}) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY'>('GET');
  const [path, setPath] = useState('/api/v1/');
  const [statusCode, setStatusCode] = useState(200);
  const [latencyMs, setLatencyMs] = useState(150);
  const [failureRatePercent, setFailureRatePercent] = useState(0);
  const [isEcho, setIsEcho] = useState(false);
  const [responseBodyString, setResponseBodyString] = useState('{\n  "status": "success",\n  "data": {\n    "id": "{{uuid}}",\n    "name": "{{faker.name.fullName}}"\n  }\n}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialRoute) {
      setMethod(initialRoute.method as any);
      setPath(initialRoute.path);
      setStatusCode(initialRoute.statusCode);
      setLatencyMs(initialRoute.latencyMs || 0);
      setFailureRatePercent(initialRoute.failureRatePercent || 0);
      setIsEcho(Boolean(initialRoute.isEcho));
      setResponseBodyString(
        typeof initialRoute.responseBody === 'string'
          ? initialRoute.responseBody
          : JSON.stringify(initialRoute.responseBody, null, 2)
      );
    } else {
      setMethod('GET');
      setPath('/api/v1/resource');
      setStatusCode(200);
      setLatencyMs(150);
      setFailureRatePercent(0);
      setIsEcho(false);
      setResponseBodyString('{\n  "status": "success",\n  "data": {\n    "id": "{{uuid}}",\n    "name": "{{faker.name.fullName}}"\n  }\n}');
    }
    setJsonError(null);
  }, [initialRoute, isOpen]);

  if (!isOpen) return null;

  const insertTag = (tag: string) => {
    setResponseBodyString((prev) => prev + `\n// Inserted tag: ${tag}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    let parsedBody = {};
    if (!isEcho) {
      try {
        parsedBody = JSON.parse(responseBodyString);
      } catch (err: any) {
        setJsonError('Invalid JSON format: ' + err.message);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        projectId,
        method,
        path: path.trim(),
        statusCode,
        latencyMs,
        failureRatePercent,
        isEcho,
        responseBody: parsedBody,
        headers: { 'Content-Type': 'application/json' }
      });
      onClose();
    } catch (err: any) {
      setJsonError(err.message || 'Failed to save route.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">
          {initialRoute ? 'Edit Mock Endpoint' : 'Configure New Mock Endpoint'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Set up custom routes, response schemas, network latency, and failure conditions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method and Path */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Route Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/v1/users/:id"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Status Code</label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value={200}>200 OK</option>
                <option value={201}>201 Created</option>
                <option value={204}>204 No Content</option>
                <option value={400}>400 Bad Request</option>
                <option value={401}>401 Unauthorized</option>
                <option value={403}>403 Forbidden</option>
                <option value={404}>404 Not Found</option>
                <option value={500}>500 Server Error</option>
              </select>
            </div>
          </div>

          {/* Sliders: Latency & Chaos */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-medium flex items-center">
                  <Sliders className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Network Latency
                </span>
                <span className="font-mono text-emerald-400">{latencyMs} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={latencyMs}
                onChange={(e) => setLatencyMs(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Test UI loading spinners & skeletons</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-medium flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Chaos Failure Rate
                </span>
                <span className="font-mono text-amber-400">{failureRatePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={failureRatePercent}
                onChange={(e) => setFailureRatePercent(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Randomly trigger HTTP 500 errors</p>
            </div>
          </div>

          {/* Echo Mode Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isEcho"
              checked={isEcho}
              onChange={(e) => setIsEcho(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="isEcho" className="text-xs text-slate-300">
              <strong>Echo Mode:</strong> Ignore response body and reflect incoming headers, query params, and body back to frontend.
            </label>
          </div>

          {/* Response Body Editor */}
          {!isEcho && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center">
                  <Code className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Response Body (JSON Template)
                </label>
                <div className="flex space-x-1.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => insertTag('{{uuid}}')}
                    className="text-slate-400 hover:text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                  >
                    +uuid
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('{{faker.name.fullName}}')}
                    className="text-slate-400 hover:text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                  >
                    +name
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('{{faker.internet.email}}')}
                    className="text-slate-400 hover:text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                  >
                    +email
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                value={responseBodyString}
                onChange={(e) => setResponseBodyString(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                spellCheck={false}
              />
            </div>
          )}

          {jsonError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
              {jsonError}
            </p>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-medium text-black bg-emerald-400 hover:bg-emerald-300 font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Mock Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

