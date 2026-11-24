import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle, Code } from 'lucide-react';
import { MockRoute } from '../types.js';
import { Modal } from './ui/Modal.js';
import { Button } from './ui/Button.js';

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

  const insertTag = (tag: string) => {
    try {
      const parsed = JSON.parse(responseBodyString);
      parsed.data = parsed.data || {};
      const keyName = tag.includes('name') ? 'fullName' : tag.includes('email') ? 'emailAddress' : 'generatedId';
      parsed.data[keyName] = tag;
      setResponseBodyString(JSON.stringify(parsed, null, 2));
    } catch {
      setResponseBodyString((prev) => prev.replace(/}\s*$/, `  "sampleField": "${tag}"\n}`));
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(responseBodyString);
      setResponseBodyString(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError('Cannot format invalid JSON: ' + err.message);
    }
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRoute ? 'Edit Mock Endpoint' : 'Configure New Mock Endpoint'}
      description="Configure route method, path, HTTP status, network latency simulation, chaos injection, and JSON response schema."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Method, Path, Status Code */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-3">
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">HTTP Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-mono font-semibold"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="ANY">ANY</option>
            </select>
          </div>

          <div className="col-span-6">
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">Route Path</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/v1/users/:id"
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-mono"
              required
            />
          </div>

          <div className="col-span-3">
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">Status Code</label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value))}
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-mono font-semibold"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1c1c1e] p-4 rounded-2xl border border-white/10">
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-[#86868b] font-medium flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-[#2997ff]" />
                Network Latency
              </span>
              <span className="font-mono text-[#2997ff] font-semibold">{latencyMs} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={latencyMs}
              onChange={(e) => setLatencyMs(Number(e.target.value))}
              className="w-full accent-[#0071e3] h-1.5 bg-[#000000] rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-[#86868b] mt-1">Simulate loading states and spinners in your UI</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-[#86868b] font-medium flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#ff9f0a]" />
                Chaos Failure Rate
              </span>
              <span className={`font-mono font-semibold ${failureRatePercent > 0 ? 'text-[#ff9f0a]' : 'text-[#86868b]'}`}>
                {failureRatePercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={failureRatePercent}
              onChange={(e) => setFailureRatePercent(Number(e.target.value))}
              className="w-full accent-[#ff9f0a] h-1.5 bg-[#000000] rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-[#86868b] mt-1">Randomly inject simulated HTTP 500 errors</p>
          </div>
        </div>

        {/* Echo Mode Toggle */}
        <div className="flex items-center space-x-3 bg-[#1c1c1e] p-3 rounded-xl border border-white/10">
          <input
            type="checkbox"
            id="isEcho"
            checked={isEcho}
            onChange={(e) => setIsEcho(e.target.checked)}
            className="rounded bg-[#000000] border-white/20 text-[#0071e3] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
          />
          <label htmlFor="isEcho" className="text-xs text-[#86868b] cursor-pointer select-none">
            <strong className="text-white font-medium">Echo Mode:</strong> Bypass static response and reflect incoming headers, query parameters, and payload directly back to the client.
          </label>
        </div>

        {/* Response Body Editor */}
        {!isEcho && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#86868b] flex items-center">
                <Code className="w-3.5 h-3.5 mr-1 text-[#86868b]" />
                Response Body (JSON Template)
              </label>
              <div className="flex items-center space-x-1.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => insertTag('{{uuid}}')}
                  className="text-[#86868b] hover:text-white bg-[#1c1c1e] px-2.5 py-0.5 rounded-full border border-white/10 transition-colors"
                >
                  +uuid
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('{{faker.name.fullName}}')}
                  className="text-[#86868b] hover:text-white bg-[#1c1c1e] px-2.5 py-0.5 rounded-full border border-white/10 transition-colors"
                >
                  +name
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('{{faker.internet.email}}')}
                  className="text-[#86868b] hover:text-white bg-[#1c1c1e] px-2.5 py-0.5 rounded-full border border-white/10 transition-colors"
                >
                  +email
                </button>
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="text-[#86868b] hover:text-white bg-[#1c1c1e] px-2.5 py-0.5 rounded-full border border-white/10 transition-colors"
                  title="Format JSON"
                >
                  Format
                </button>
              </div>
            </div>
            <textarea
              rows={7}
              value={responseBodyString}
              onChange={(e) => setResponseBodyString(e.target.value)}
              className="w-full bg-[#000000] border border-white/10 rounded-xl p-3.5 text-xs font-mono text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {jsonError && (
          <div className="text-xs text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/20 p-3 rounded-xl flex items-start gap-2">
            <span className="font-bold text-[#ff453a]">&bull;</span>
            <span>{jsonError}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saving}
          >
            {saving ? 'Saving...' : initialRoute ? 'Update Endpoint' : 'Save Endpoint'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
