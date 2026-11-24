import React, { useState } from 'react';
import { 
  FileUp, 
  Sparkles, 
  Code, 
  Check, 
  AlertCircle, 
  ShoppingBag, 
  Share2, 
  CheckSquare, 
  ArrowRight
} from 'lucide-react';
import { Project, EnvironmentType } from '../types.js';
import { Button } from '../components/ui/Button.js';

interface ApiImportViewProps {
  activeProject: Project | null;
  apiBaseUrl: string;
  token: string;
  activeEnvironment: EnvironmentType;
  onImportComplete: () => void;
}

const TEMPLATES = [
  {
    id: 'ecommerce',
    title: 'E-Commerce Store API',
    desc: 'Products, Categories, Orders, Customers with 1:N relational foreign keys.',
    icon: ShoppingBag,
    color: 'text-[#ff9f0a] bg-[#ff9f0a]/10 border-[#ff9f0a]/20',
    spec: {
      openapi: '3.0.0',
      info: { title: 'E-Commerce Store API', version: '1.0.0' },
      components: {
        schemas: {
          Customer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              tier: { type: 'string' }
            }
          },
          Category: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' }
            }
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              categoryId: { type: 'string' },
              title: { type: 'string' },
              price: { type: 'number' },
              inStock: { type: 'boolean' }
            }
          },
          Order: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              customerId: { type: 'string' },
              totalAmount: { type: 'number' },
              status: { type: 'string' }
            }
          }
        }
      }
    }
  },
  {
    id: 'social',
    title: 'Social Network API',
    desc: 'Users, Posts, Comments with author foreign-key bindings.',
    icon: Share2,
    color: 'text-[#2997ff] bg-[#0071e3]/10 border-[#0071e3]/20',
    spec: {
      openapi: '3.0.0',
      info: { title: 'Social Network API', version: '1.0.0' },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              bio: { type: 'string' }
            }
          },
          Post: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              likesCount: { type: 'integer' }
            }
          },
          Comment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              postId: { type: 'string' },
              userId: { type: 'string' },
              content: { type: 'string' }
            }
          }
        }
      }
    }
  },
  {
    id: 'tasks',
    title: 'Project & Task Tracker',
    desc: 'Projects, Tasks, Members with multi-entity task assignment.',
    icon: CheckSquare,
    color: 'text-[#bf5af2] bg-[#bf5af2]/10 border-[#bf5af2]/20',
    spec: {
      openapi: '3.0.0',
      info: { title: 'Task Manager API', version: '1.0.0' },
      components: {
        schemas: {
          Project: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              deadline: { type: 'string' }
            }
          },
          Task: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              projectId: { type: 'string' },
              title: { type: 'string' },
              isCompleted: { type: 'boolean' },
              priority: { type: 'string' }
            }
          }
        }
      }
    }
  }
];

export const ApiImportView: React.FC<ApiImportViewProps> = ({
  activeProject,
  apiBaseUrl,
  token,
  activeEnvironment,
  onImportComplete
}) => {
  const [schemaText, setSchemaText] = useState(JSON.stringify(TEMPLATES[0].spec, null, 2));
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleImport = async () => {
    if (!activeProject) return;
    setImporting(true);
    setStatusMessage(null);

    try {
      let parsedDoc: any;
      try {
        parsedDoc = JSON.parse(schemaText);
      } catch {
        throw new Error('Please ensure your blueprint is valid JSON.');
      }

      // 1. Analyze relationships and generate nodes
      const relRes = await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ openApiDoc: parsedDoc })
      });

      if (!relRes.ok) throw new Error('Failed to analyze OpenAPI schema');
      const relData = await relRes.json();

      // Save analyzed relationships
      await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodes: relData.nodes, edges: relData.edges })
      });

      // 2. Automatically generate CRUD mock routes for each entity node
      let generatedRoutesCount = 0;
      for (const node of (relData.nodes || [])) {
        const res = node.resource;
        const routesToCreate = [
          {
            projectId: activeProject.id,
            method: 'GET',
            path: `/api/${res}`,
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            responseBody: { [res]: [] },
            latencyMs: 30,
            failureRatePercent: 0,
            isEcho: false,
            isStateful: true,
            ttl: 604800
          },
          {
            projectId: activeProject.id,
            method: 'GET',
            path: `/api/${res}/:id`,
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            responseBody: { id: '{{params.id}}', name: `Sample ${node.name}` },
            latencyMs: 30,
            failureRatePercent: 0,
            isEcho: false,
            isStateful: true,
            ttl: 604800
          },
          {
            projectId: activeProject.id,
            method: 'POST',
            path: `/api/${res}`,
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            responseBody: { message: `${node.name} created` },
            latencyMs: 40,
            failureRatePercent: 0,
            isEcho: false,
            isStateful: true,
            ttl: 604800
          },
          {
            projectId: activeProject.id,
            method: 'DELETE',
            path: `/api/${res}/:id`,
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            responseBody: { message: `${node.name} deleted` },
            latencyMs: 30,
            failureRatePercent: 0,
            isEcho: false,
            isStateful: true,
            ttl: 604800
          }
        ];

        for (const r of routesToCreate) {
          await fetch(`${apiBaseUrl}/api/routes`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(r)
          });
          generatedRoutesCount++;
        }
      }

      // 3. Seed initial relational mock data
      await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}/seed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ environment: activeEnvironment, countPerEntity: 5 })
      });

      setStatusMessage({
        text: `Success! Generated ${relData.nodes?.length || 0} entities, ${generatedRoutesCount} mock routes, and seeded relational database.`
      });

      setTimeout(() => {
        onImportComplete();
      }, 1500);

    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Import failed.', error: true });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#161617] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#2997ff]">
            <FileUp className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight">API Blueprint & OpenAPI Importer</h2>
        </div>
        <p className="text-xs text-[#86868b] mt-1.5 ml-10">
          Upload an OpenAPI 3.0 / Swagger schema to automatically generate stateful mock endpoints, relational graphs, and realistic data.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2.5 border ${
          statusMessage.error 
            ? 'bg-[#ff453a]/10 border-[#ff453a]/30 text-[#ff453a]' 
            : 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#2997ff]'
        }`}>
          {statusMessage.error ? <AlertCircle className="w-4 h-4 shrink-0 text-[#ff453a]" /> : <Check className="w-4 h-4 shrink-0 text-[#2997ff]" />}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Starter Blueprint Templates */}
      <div>
        <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-3 font-mono">
          Or Select a Pre-Built Blueprint Template
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSchemaText(JSON.stringify(tmpl.spec, null, 2))}
                className="bg-[#161617] hover:bg-[#1c1c1e] p-5 rounded-2xl border border-white/10 hover:border-white/20 cursor-pointer transition-all flex flex-col justify-between shadow-lg group"
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3.5 ${tmpl.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-white mb-1 group-hover:text-[#2997ff] transition-colors">
                    {tmpl.title}
                  </h4>
                  <p className="text-xs text-[#86868b] leading-relaxed">{tmpl.desc}</p>
                </div>
                <span className="text-xs text-[#2997ff] font-medium mt-4 flex items-center space-x-1">
                  <span>Load Schema</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blueprint Editor */}
      <div className="bg-[#161617] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-[#2997ff]" />
            <span className="text-xs font-semibold text-white">OpenAPI / Swagger JSON Blueprint</span>
          </div>
          <span className="text-[11px] text-[#86868b] font-mono">OpenAPI 3.0 / 3.1 Spec</span>
        </div>

        <textarea
          rows={16}
          value={schemaText}
          onChange={(e) => setSchemaText(e.target.value)}
          className="w-full bg-[#000000] border border-white/10 rounded-xl p-4 text-xs font-mono text-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent leading-relaxed"
          placeholder="Paste OpenAPI 3.0 JSON specification here..."
          spellCheck={false}
        />

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            loading={importing}
            icon={<Sparkles className="w-4 h-4" />}
            onClick={handleImport}
          >
            {importing ? 'Generating APIs & Graphs...' : 'Generate Mock Platform'}
          </Button>
        </div>
      </div>
    </div>
  );
};
