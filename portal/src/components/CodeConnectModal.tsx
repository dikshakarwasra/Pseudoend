import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';
import { MockRoute } from '../types.js';

interface CodeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: MockRoute | null;
  projectId: string;
  apiKey: string;
  apiBaseUrl: string;
}

export const CodeConnectModal: React.FC<CodeConnectModalProps> = ({
  isOpen,
  onClose,
  route,
  projectId,
  apiKey,
  apiBaseUrl
}) => {
  const [tab, setTab] = useState<'react' | 'react-query' | 'vue' | 'svelte' | 'flutter' | 'swift' | 'curl'>('react');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !route) return null;

  const fullUrl = `${apiBaseUrl}/mock/${projectId}${route.path}`;
  const effectiveKey = apiKey || 'sk_test_demo12345';

  const snippets = {
    react: `// React / Next.js (Native Fetch)
import { useEffect, useState } from 'react';

export function useMockData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('${fullUrl}', {
      method: '${route.method}',
      headers: {
        'x-pseudoend-key': '${effectiveKey}',
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(\`HTTP error! status: \${res.status}\`);
        return res.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}`,

    'react-query': `// React with TanStack Query
import { useQuery } from '@tanstack/react-query';

export function useQueryMock() {
  return useQuery({
    queryKey: ['mock', '${route.path}'],
    queryFn: async () => {
      const res = await fetch('${fullUrl}', {
        method: '${route.method}',
        headers: {
          'x-pseudoend-key': '${effectiveKey}',
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Network error');
      return res.json();
    }
  });
}`,

    vue: `// Vue 3 Composition API (with Axios)
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  setup() {
    const data = ref(null);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const response = await axios({
          method: '${route.method.toLowerCase()}',
          url: '${fullUrl}',
          headers: {
            'x-pseudoend-key': '${effectiveKey}'
          }
        });
        data.value = response.data;
      } catch (err) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    });

    return { data, loading, error };
  }
};`,

    svelte: `<script>
  // Svelte / SvelteKit Component
  import { onMount } from 'svelte';
  let data = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const res = await fetch('${fullUrl}', {
        method: '${route.method}',
        headers: {
          'x-pseudoend-key': '${effectiveKey}',
          'Content-Type': 'application/json'
        }
      });
      data = await res.json();
    } catch (err) {
      error = err;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading mock...</p>
{:else if error}
  <p>Error loading mock</p>
{:else}
  <pre>{JSON.stringify(data, null, 2)}</pre>
{/if}`,

    flutter: `// Flutter (Dart with package:http)
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<dynamic> fetchMockData() async {
  final url = Uri.parse('${fullUrl}');
  final response = await http.${route.method === 'POST' ? 'post' : 'get'}(
    url,
    headers: {
      'x-pseudoend-key': '${effectiveKey}',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode >= 200 && response.statusCode < 300) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to load: \${response.statusCode}');
  }
}`,

    swift: `// iOS Swift (URLSession with async/await)
import Foundation

func fetchMock() async throws -> [String: Any] {
    guard let url = URL(string: "${fullUrl}") else {
        throw URLError(.badURL)
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "${route.method}"
    request.setValue("${effectiveKey}", forHTTPHeaderField: "x-pseudoend-key")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse, 
          (200...299).contains(httpResponse.statusCode) else {
        throw URLError(.badServerResponse)
    }
    
    return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
}`,

    curl: `# Run directly in your terminal:
curl -X ${route.method} "${fullUrl}" \\
     -H "x-pseudoend-key: ${effectiveKey}" \\
     -H "Content-Type: application/json"`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-1">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Connect to Frontend Code</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Copy pre-configured client code for <strong>[{route.method}] {route.path}</strong> into your frontend project.
        </p>

        {/* Framework Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3 mb-4 text-xs font-medium">
          {[
            { id: 'react', label: 'React (Fetch)' },
            { id: 'react-query', label: 'TanStack Query' },
            { id: 'vue', label: 'Vue 3' },
            { id: 'svelte', label: 'Svelte' },
            { id: 'flutter', label: 'Flutter (Dart)' },
            { id: 'swift', label: 'iOS (Swift)' },
            { id: 'curl', label: 'cURL / Terminal' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 pt-11 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px]">
            {snippets[tab]}
          </pre>
        </div>
      </div>
    </div>
  );
};

