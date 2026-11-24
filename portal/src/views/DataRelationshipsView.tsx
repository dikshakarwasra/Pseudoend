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
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';

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
    <div className="space-y-5">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-black/[0.05] shadow-apple-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-[#bf5af2]" />
            <h2 className="text-base font-semibold text-[#1d1d1f] tracking-tight">Smart Data Relationship Engine</h2>
            <span className="text-[10px] font-mono uppercase bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/25 px-2 py-0.5 rounded-full font-medium">
              Graph Studio
            </span>
          </div>
          <p className="text-xs text-[#6e6e73] mt-1">
            Visual graph detecting 1:1, 1:N, and N:M entity connections, foreign keys, and referential data integrity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-[#f5f5f7] border border-[#d2d2d7] rounded-full p-1 text-[#515154]">
            <button 
              onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} 
              className="p-1 hover:text-[#1d1d1f] rounded-full hover:bg-black/5"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-1.5 text-[#1d1d1f]">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(2.0, z + 0.15))} 
              className="p-1 hover:text-[#1d1d1f] rounded-full hover:bg-black/5"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
              className="p-1 hover:text-[#1d1d1f] rounded-full hover:bg-black/5"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="secondary"
            size="xs"
            icon={<Sparkles className={`w-3.5 h-3.5 text-[#ff9f0a] ${analyzing ? 'animate-spin' : ''}`} />}
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Auto-Detect'}
          </Button>

          <Button
            variant="secondary"
            size="xs"
            icon={<Plus className="w-3.5 h-3.5 text-[#2997ff]" />}
            onClick={() => setIsAddRelOpen(true)}
          >
            Add Link
          </Button>

          <Button
            variant="primary"
            size="xs"
            icon={<PlayCircle className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />}
            onClick={() => handleSeed(5)}
            disabled={seeding}
            title={`Seed data into ${activeEnvironment.toUpperCase()}`}
          >
            {seeding ? 'Seeding...' : `Seed Data (${activeEnvironment.toUpperCase()})`}
          </Button>

          <Button
            variant="outline"
            size="xs"
            icon={savedSuccess ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Save className="w-3.5 h-3.5 text-[#6e6e73]" />}
            onClick={handleSave}
          >
            {savedSuccess ? 'Saved' : 'Save Graph'}
          </Button>
        </div>
      </div>

      {seedSuccess && (
        <div className="bg-[#34c759]/10 border border-[#34c759]/25 text-[#15803d] p-3.5 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{seedSuccess}</span>
          </div>
          <span className="font-mono text-[11px] text-[#1d1d1f]">Target: {activeEnvironment}</span>
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[580px] bg-[#f8f8fa] border border-[#d2d2d7] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-apple-md"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-30">
            <div className="flex items-center space-x-3 text-[#a1a1a6] text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2997ff]" />
              <span>Analyzing entity models and relationship connections...</span>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f2fc] border border-[#0071e3]/10 flex items-center justify-center mb-3 text-[#0071e3]">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#1d1d1f] mb-1">No Entity Schemas Detected</h4>
            <p className="text-xs text-[#6e6e73] max-w-sm mb-4 leading-relaxed">
              Add mock routes to your project or import an OpenAPI schema, then click Auto-Detect.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={handleAnalyze}
            >
              Detect from Mock Routes
            </Button>
          </div>
        ) : null}

        {/* Scaled & Translated World */}
        <div 
          className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          {/* SVG Connection Lines (Edges) — Apple Blue style */}
          <svg className="absolute inset-0 w-[3000px] h-[3000px] pointer-events-none">
            <defs>
              <marker
                id="arrowhead-apple"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0071e3" />
              </marker>
              <filter id="glow-apple" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0071e3" floodOpacity="0.4" />
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
                    stroke="#0071e3"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead-apple)"
                    filter="url(#glow-apple)"
                  />
                  {/* Badge on connection line */}
                  <rect
                    x={midX - 30}
                    y={midY - 11}
                    width="60"
                    height="22"
                    rx="11"
                    fill="#ffffff"
                    stroke="#0071e3"
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    fill="#2997ff"
                    fontSize="10"
                    fontWeight="600"
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
                className={`interactive-node absolute w-60 bg-white rounded-2xl border transition-all select-none cursor-move shadow-apple-md ${
                  isSelected 
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/30 shadow-apple-blue' 
                    : 'border-black/[0.07] hover:border-black/20'
                }`}
                style={{
                  left: `${node.x || 100}px`,
                  top: `${node.y || 100}px`
                }}
              >
                {/* Node Header */}
                <div 
                  className="px-3.5 py-2.5 rounded-t-2xl flex items-center justify-between border-b border-[#d2d2d7]/50 bg-[#fbfbfd]"
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: node.color || '#0071e3' }} 
                    />
                    <span className="font-semibold text-xs text-[#1d1d1f] capitalize">{node.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 text-[#515154]">
                    {node.recordCount} recs
                  </span>
                </div>

                {/* Field List */}
                <div className="p-3 space-y-1">
                  {node.fields.slice(0, 6).map((field) => {
                    const isLinked = edges.some(e => 
                      (e.target === node.id && e.targetField === field.name) ||
                      (e.source === node.id && field.isPrimary)
                    );

                    return (
                      <div 
                        key={field.name}
                        className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded-lg hover:bg-black/[0.03]"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {field.isPrimary ? (
                            <Key className="w-3 h-3 text-[#ff9f0a] shrink-0" />
                          ) : isLinked ? (
                            <ArrowRight className="w-3 h-3 text-[#2997ff] shrink-0" />
                          ) : (
                            <span className="w-3 h-3 inline-block" />
                          )}
                          <span className={`font-mono truncate ${field.isPrimary ? 'text-[#d97706] font-medium' : isLinked ? 'text-[#0071e3]' : 'text-[#1d1d1f]'}`}>
                            {field.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#86868b] font-mono shrink-0 ml-2">
                          {field.type}
                        </span>
                      </div>
                    );
                  })}
                  {node.fields.length > 6 && (
                    <div className="text-[10px] text-[#86868b] font-mono text-center pt-1">
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
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-white/95 border border-[#d2d2d7] rounded-3xl backdrop-blur-xl shadow-apple-md p-5 flex flex-col z-30 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color || '#0071e3' }} />
                <h3 className="font-semibold text-sm text-[#1d1d1f] capitalize">{selectedNode.name} Schema</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-full hover:bg-black/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#a1a1a6] mb-3">
              Resource: <code className="text-[#2997ff] font-mono bg-[#000000] px-2 py-0.5 rounded-md">/{selectedNode.resource}</code>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <h4 className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-2 font-mono">Schema Fields</h4>
                <div className="space-y-1">
                  {selectedNode.fields.map(f => (
                    <div key={f.name} className="flex items-center justify-between bg-[#fbfbfd] p-2 rounded-xl border border-[#d2d2d7]/50 text-xs">
                      <div className="flex items-center space-x-1.5">
                        {f.isPrimary && <Key className="w-3 h-3 text-[#ff9f0a]" />}
                        <span className="font-mono text-[#1d1d1f]">{f.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#86868b]">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-2 font-mono">Connected Relationships</h4>
                <div className="space-y-1.5">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => (
                    <div key={e.id} className="bg-[#fbfbfd] p-2.5 rounded-xl border border-[#d2d2d7]/50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-semibold text-[#0071e3]">{e.type}</span>
                        <span className="text-[10px] text-[#86868b] font-mono">{e.sourceField} &rarr; {e.targetField}</span>
                      </div>
                      <div className="text-[11px] text-[#1d1d1f]">{e.label}</div>
                    </div>
                  ))}
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
                    <p className="text-xs text-[#6e6e73] italic">No direct relationships linked yet.</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSourceNodeId(selectedNode.id);
                setIsAddRelOpen(true);
              }}
              className="mt-3 w-full"
            >
              Link to Another Entity
            </Button>
          </div>
        )}
      </div>

      {/* Manual Add Relationship Modal */}
      <Modal
        isOpen={isAddRelOpen}
        onClose={() => setIsAddRelOpen(false)}
        title="Add Entity Relationship"
        description="Connect two entities with a foreign-key relationship and specified cardinality."
        maxWidth="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#6e6e73] mb-1 font-medium">Source Entity (Parent)</label>
            <select
              value={sourceNodeId}
              onChange={(e) => setSourceNodeId(e.target.value)}
              className="w-full bg-white border border-[#d2d2d7] rounded-xl p-2.5 text-[#1d1d1f] font-mono"
            >
              <option value="">Select source entity...</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[#6e6e73] mb-1 font-medium">Target Entity (Dependent)</label>
            <select
              value={targetNodeId}
              onChange={(e) => {
                setTargetNodeId(e.target.value);
                const targetNode = nodes.find(n => n.id === e.target.value);
                if (targetNode && targetNode.fields.length > 0) {
                  setTargetField(targetNode.fields[1]?.name || targetNode.fields[0].name);
                }
              }}
              className="w-full bg-white border border-[#d2d2d7] rounded-xl p-2.5 text-[#1d1d1f] font-mono"
            >
              <option value="">Select target entity...</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          {targetNodeId && (
            <div>
              <label className="block text-[#6e6e73] mb-1 font-medium">Target Foreign-Key Field</label>
              <input
                type="text"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                placeholder="e.g. userId, authorId, customerId"
                className="w-full bg-white border border-[#d2d2d7] rounded-xl p-2.5 text-[#1d1d1f] font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-[#6e6e73] mb-1 font-medium">Relationship Cardinality</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1', '1:N', 'N:M'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRelType(t)}
                  className={`p-2 rounded-xl font-mono font-bold text-center border transition-colors ${
                    relType === t 
                      ? 'bg-[#0071e3] text-white border-[#0071e3]' 
                      : 'bg-[#f5f5f7] text-[#86868b] border-[#d2d2d7] hover:text-[#1d1d1f]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddRelOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddRelationship}
            disabled={!sourceNodeId || !targetNodeId || !targetField}
          >
            Create Edge
          </Button>
        </div>
      </Modal>
    </div>
  );
};
