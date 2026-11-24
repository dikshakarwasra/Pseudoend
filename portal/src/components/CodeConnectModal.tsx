import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { MockRoute } from '../types.js';
import { Modal } from './ui/Modal.js';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#2997ff]" />
          <span>Connect to Client Code</span>
        </div>
      }
      description={
        <span>
          Pre-configured snippet for <strong className="text-white font-mono">[{route.method}] {route.path}</strong> with your project authentication headers.
        </span>
      }
      maxWidth="3xl"
    >
      {/* Framework Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3 mb-4 text-xs font-medium">
        {[
          { id: 'react', label: 'React (Fetch)' },
          { id: 'react-query', label: 'TanStack Query' },
          { id: 'vue', label: 'Vue 3' },
          { id: 'svelte', label: 'Svelte' },
          { id: 'flutter', label: 'Flutter (Dart)' },
          { id: 'swift', label: 'iOS (Swift)' },
          { id: 'curl', label: 'cURL / CLI' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              tab === t.id
                ? 'bg-[#0071e3] text-white font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Code snippet block */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center space-x-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#f5f5f7] px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 transition-colors z-10"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
        </button>
        <pre className="bg-[#000000] border border-white/10 rounded-2xl p-5 pt-12 text-xs font-mono text-[#f5f5f7] overflow-x-auto max-h-[380px] leading-relaxed">
          {snippets[tab]}
        </pre>
      </div>
    </Modal>
  );
};
