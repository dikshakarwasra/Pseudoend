import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Sparkles, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Database, 
  Layers, 
  Key, 
  ArrowRight, 
  Save, 
  Check, 
  RefreshCw, 
  X,
  PlayCircle
} from 'lucide-react';
import { Project, EntityNode, RelationshipEdge, EnvironmentType } from '../types.js';

interface DataRelationshipsViewProps {
  activeProject: Project | null;
  apiBaseUrl: string;
  token: string;
  activeEnvironment: EnvironmentType;
}

export const DataRelationshipsView: React.FC<DataRelationshipsViewProps> = ({
  activeProject,
  apiBaseUrl,
  token,
  activeEnvironment
}) => {
  const [nodes, setNodes] = useState<EntityNode[]>([]);
  const [edges, setEdges] = useState<RelationshipEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  // Zoom & Pan Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Selected Node Drawer
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);

  // Manual Add Relationship Modal
  const [isAddRelOpen, setIsAddRelOpen] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [targetField, setTargetField] = useState('');
  const [relType, setRelType] = useState<'1:1' | '1:N' | 'N:M'>('1:N');

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRelationships = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.relationships?.nodes || []);
        setEdges(data.relationships?.edges || []);
      }
    } catch (err) {
      console.error('Failed to load relationships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [activeProject]);

  const handleAnalyze = async () => {
    if (!activeProject) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
    } catch (err) {
      console.error('Failed to analyze schema:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!activeProject) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodes, edges })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save relationships:', err);
    }
  };

  const handleSeed = async (count = 5) => {
    if (!activeProject) return;
    setSeeding(true);
    setSeedSuccess(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/relationships/${activeProject.id}/seed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environment: activeEnvironment,
          countPerEntity: count
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSeedSuccess(data.message);
        setTimeout(() => setSeedSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to seed relational data:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddRelationship = () => {
    if (!sourceNodeId || !targetNodeId || !targetField) return;
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);

    const newEdge: RelationshipEdge = {
      id: `rel_${sourceNodeId}_${targetNodeId}_${targetField}_${Date.now()}`,
      source: sourceNodeId,
      target: targetNodeId,
      sourceField: 'id',
      targetField,
      type: relType,
      label: `${relType} (${sourceNode?.name || sourceNodeId} -> ${targetNode?.name || targetNodeId})`
    };

    setEdges(prev => [...prev, newEdge]);
    setIsAddRelOpen(false);
    setSourceNodeId('');
    setTargetNodeId('');
    setTargetField('');
  };

  // Canvas Mouse Handlers for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
    if (draggingNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.max(20, (e.clientX - pan.x) / zoom - dragOffset.x),
            y: Math.max(20, (e.clientY - pan.y) / zoom - dragOffset.y)
          };
        }
        return n;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Smart Data Relationship Engine</h2>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Feature 1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual graph detecting 1:1, 1:N, and N:M entity connections, foreign keys, and referential data integrity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-slate-400">
            <button 
              onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} 
              className="p-1.5 hover:text-white rounded hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(2.0, z + 0.15))} 
              className="p-1.5 hover:text-white rounded hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
              className="p-1.5 hover:text-white rounded hover:bg-slate-800"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Schema...' : 'Auto-Detect Relationships'}</span>
          </button>

          <button
            onClick={() => setIsAddRelOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Relationship</span>
          </button>

          <button
            onClick={() => handleSeed(5)}
            disabled={seeding}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-2 rounded-lg text-xs transition-colors shadow-lg shadow-emerald-500/10"
            title="Generate interconnected mock data into active environment"
          >
            <PlayCircle className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding Data...' : `Seed Relational Data (${activeEnvironment.toUpperCase()})`}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-slate-400" />}
            <span>{savedSuccess ? 'Saved!' : 'Save Graph'}</span>
          </button>
        </div>
      </div>

      {seedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{seedSuccess}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-300">Environment: {activeEnvironment}</span>
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[620px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-30">
            <div className="flex items-center space-x-3 text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Analyzing entity models and relationship connections...</span>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">No Entity Schemas Detected</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Add mock routes to your project or import an OpenAPI schema, then click Auto-Detect.
            </p>
            <button
              onClick={handleAnalyze}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Detect from Mock Routes</span>
            </button>
          </div>
        ) : null}

        {/* Scaled & Translated World */}
        <div 
          className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          {/* SVG Connection Lines (Edges) */}
          <svg className="absolute inset-0 w-[3000px] h-[3000px] pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
              </marker>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.4" />
              </filter>
            </defs>

            {edges.map((edge) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const x1 = (sourceNode.x || 100) + 240;
              const y1 = (sourceNode.y || 100) + 70;
              const x2 = (targetNode.x || 400);
              const y2 = (targetNode.y || 100) + 70;

              const dx = x2 - x1;
              const dy = y2 - y1;
              const cx1 = x1 + dx * 0.5;
              const cy1 = y1;
              const cx2 = x1 + dx * 0.5;
              const cy2 = y2;

              const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={edge.id} className="transition-all duration-200">
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead)"
                    filter="url(#glow)"
                  />
                  {/* Badge on connection line */}
                  <rect
                    x={midX - 35}
                    y={midY - 12}
                    width="70"
                    height="24"
                    rx="6"
                    fill="#0F172A"
                    stroke="#10B981"
                    strokeWidth="1.2"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    fill="#34D399"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {edge.type}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Entity Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingNodeId(node.id);
                  setDragOffset({
                    x: (e.clientX - pan.x) / zoom - (node.x || 0),
                    y: (e.clientY - pan.y) / zoom - (node.y || 0)
                  });
                }}
                className={`interactive-node absolute w-64 bg-slate-900 rounded-xl border transition-shadow shadow-xl select-none cursor-move ${
                  isSelected 
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  left: `${node.x || 100}px`,
                  top: `${node.y || 100}px`
                }}
              >
                {/* Node Header */}
                <div 
                  className="px-3.5 py-2.5 rounded-t-xl flex items-center justify-between border-b border-slate-800/80"
                  style={{ backgroundColor: `${node.color || '#10B981'}15` }}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: node.color || '#10B981' }} 
                    />
                    <span className="font-semibold text-xs text-white capitalize">{node.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                    {node.recordCount} recs
                  </span>
                </div>

                {/* Field List */}
                <div className="p-3 space-y-1.5">
                  {node.fields.slice(0, 6).map((field) => {
                    const isLinked = edges.some(e => 
                      (e.target === node.id && e.targetField === field.name) ||
                      (e.source === node.id && field.isPrimary)
                    );

                    return (
                      <div 
                        key={field.name}
                        className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded hover:bg-slate-800/50"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {field.isPrimary ? (
                            <Key className="w-3 h-3 text-amber-400 shrink-0" />
                          ) : isLinked ? (
                            <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-3 h-3 inline-block" />
                          )}
                          <span className={`font-mono truncate ${field.isPrimary ? 'text-amber-300 font-semibold' : isLinked ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {field.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                          {field.type}
                        </span>
                      </div>
                    );
                  })}
                  {node.fields.length > 6 && (
                    <div className="text-[10px] text-slate-500 font-mono text-center pt-1">
                      +{node.fields.length - 6} more fields
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 border border-slate-800 rounded-xl backdrop-blur-md shadow-2xl p-4 flex flex-col z-30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color || '#10B981' }} />
                <h3 className="font-bold text-sm text-white capitalize">{selectedNode.name} Schema</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400 mb-3">
              Resource: <code className="text-emerald-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">/{selectedNode.resource}</code>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Schema Fields</h4>
                <div className="space-y-1.5">
                  {selectedNode.fields.map(f => (
                    <div key={f.name} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center space-x-1.5">
                        {f.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                        <span className="font-mono text-slate-200">{f.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Connected Relationships</h4>
                <div className="space-y-1.5">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => (
                    <div key={e.id} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-semibold text-emerald-400">{e.type}</span>
                        <span className="text-[10px] text-slate-500">{e.sourceField} &rarr; {e.targetField}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">{e.label}</div>
                    </div>
                  ))}
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
                    <p className="text-xs text-slate-500 italic">No direct relationships linked yet.</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSourceNodeId(selectedNode.id);
                setIsAddRelOpen(true);
              }}
              className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              Link to Another Entity
            </button>
          </div>
        )}
      </div>

      {/* Manual Add Relationship Modal */}
      {isAddRelOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Entity Relationship</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Source Entity (Parent)</label>
                <select
                  value={sourceNodeId}
                  onChange={(e) => setSourceNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="">Select source entity...</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Entity (Dependent)</label>
                <select
                  value={targetNodeId}
                  onChange={(e) => {
                    setTargetNodeId(e.target.value);
                    const targetNode = nodes.find(n => n.id === e.target.value);
                    if (targetNode && targetNode.fields.length > 0) {
                      setTargetField(targetNode.fields[1]?.name || targetNode.fields[0].name);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="">Select target entity...</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              {targetNodeId && (
                <div>
                  <label className="block text-slate-400 mb-1">Target Foreign-Key Field</label>
                  <input
                    type="text"
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value)}
                    placeholder="e.g. userId, author_id, customerId"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Relationship Cardinality</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1:1', '1:N', 'N:M'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRelType(t)}
                      className={`p-2 rounded-lg font-mono font-bold text-center border transition-colors ${
                        relType === t 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsAddRelOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRelationship}
                disabled={!sourceNodeId || !targetNodeId || !targetField}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Create Edge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
