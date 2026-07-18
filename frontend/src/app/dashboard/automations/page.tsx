'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  Plus,
  Trash2,
  Zap,
  Bot,
  Database,
  MessageSquare,
  Sliders,
  Workflow,
  CheckCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Settings
} from 'lucide-react';

interface NodeItem {
  id: string;
  type: 'trigger' | 'condition' | 'agent' | 'action' | 'integration' | 'end';
  title: string;
  desc: string;
  config: Record<string, string>;
}

export default function FlowBuilderWorkspacePage() {
  const [nodes, setNodes] = useState<NodeItem[]>([
    {
      id: 'node-1',
      type: 'trigger',
      title: 'Receive Message',
      desc: 'Triggers when a new WhatsApp message is received.',
      config: { event: 'messages.received', filter: 'Ignore Groups' }
    },
    {
      id: 'node-2',
      type: 'condition',
      title: 'Keyword Switch',
      desc: 'Branches logic based on keyword parameters.',
      config: { matches: 'price, order, quote', matchType: 'contains' }
    },
    {
      id: 'node-3',
      type: 'agent',
      title: 'Amudhasurabiy AI Agent',
      desc: 'Executes autonomous Gemini prompt guidelines.',
      config: { promptProfile: 'Product Assist Agent', temperature: '0.2' }
    },
    {
      id: 'node-4',
      type: 'action',
      title: 'WooCommerce Order API',
      desc: 'Creates a draft invoice in WooCommerce backend.',
      config: { endpoint: '/api/v1/orders', method: 'POST' }
    },
    {
      id: 'node-5',
      type: 'end',
      title: 'Dispatch Message',
      desc: 'Replies back to the client with invoice links.',
      config: { messageType: 'Product Card template' }
    }
  ]);

  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number | null>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const handleAddNode = () => {
    const newIdx = nodes.length + 1;
    const newNode: NodeItem = {
      id: `node-${newIdx}`,
      type: 'action',
      title: `Custom API Action ${newIdx}`,
      desc: 'Executes external REST payload dispatch.',
      config: { endpoint: '/api/v1/custom', method: 'POST' }
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeIdx(nodes.length);
  };

  const handleRemoveNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setSelectedNodeIdx(null);
  };

  const updateConfig = (key: string, value: string) => {
    if (selectedNodeIdx === null) return;
    setNodes((prev) =>
      prev.map((node, idx) => {
        if (idx === selectedNodeIdx) {
          return {
            ...node,
            config: { ...node.config, [key]: value }
          };
        }
        return node;
      })
    );
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setSimLogs([]);
    const executionDelay = (log: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setSimLogs((prev) => [...prev, log]);
          resolve();
        }, delay);
      });
    };

    const triggerSim = async () => {
      await executionDelay('🚀 [Execution Trace: START] Initializing flow workspace logic...', 400);
      await executionDelay('⚡ [Node 1: Receive Message] Trigger fired for sender +919988776655.', 800);
      await executionDelay('🔍 [Node 2: Keyword Switch] Evaluating keyword filter ("order"). Match found (TRUE). Branching path...', 1200);
      await executionDelay('🤖 [Node 3: AI Agent] Compiling context guidelines. AI generated reply context: "1x Health Malt ₹350".', 1800);
      await executionDelay('🔌 [Node 4: WooCommerce Order API] Sending REST POST endpoint payload to create invoice draft (Success 201).', 2400);
      await executionDelay('💬 [Node 5: Dispatch Message] WhatsApp template message successfully routed to +919988776655.', 3000);
      await executionDelay('✅ [Execution Trace: END] Visual Flow execution chain complete. Latency: 1.4s.', 3400);
      setIsSimulating(false);
    };

    triggerSim();
  };

  const selectedNode = selectedNodeIdx !== null ? nodes[selectedNodeIdx] : null;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col min-h-0">
      
      {/* Title */}
      <div className="shrink-0 flex items-center justify-between border-b border-neutral-900 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            AI Flow Builder Canvas
          </h1>
          <p className="text-xs text-neutral-400">Design automated logic flow charts. Link keywords, databases, webhooks, and AI agent prompts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Play className="w-3.5 h-3.5" /> {isSimulating ? 'Simulating...' : 'Test Execution Flow'}
          </button>
        </div>
      </div>

      {/* Main split canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Side: Node Canvas Editor */}
        <div className="lg:col-span-8 overflow-y-auto border border-neutral-900 bg-[#07090F]/45 rounded-2xl p-6 relative flex flex-col justify-between min-h-[400px]">
          
          {/* Canvas Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none rounded-2xl" />
          
          <div className="relative z-10 space-y-5 flex-1 w-full max-w-lg mx-auto flex flex-col items-center py-6">
            {nodes.map((node, idx) => {
              const isSelected = selectedNodeIdx === idx;
              return (
                <React.Fragment key={node.id}>
                  {idx > 0 && (
                    <div className="h-6 w-[2px] bg-neutral-800 flex items-center justify-center relative">
                      <span className="absolute -bottom-1 border-[4px] border-transparent border-t-neutral-700" />
                    </div>
                  )}
                  
                  <div
                    onClick={() => setSelectedNodeIdx(idx)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 relative group ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center ${
                        node.type === 'trigger'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : node.type === 'condition'
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          : node.type === 'agent'
                          ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      }`}>
                        {node.type === 'trigger' && <Zap className="w-4.5 h-4.5" />}
                        {node.type === 'condition' && <Workflow className="w-4.5 h-4.5" />}
                        {node.type === 'agent' && <Bot className="w-4.5 h-4.5" />}
                        {node.type === 'action' && <Database className="w-4.5 h-4.5" />}
                        {node.type === 'end' && <MessageSquare className="w-4.5 h-4.5" />}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-neutral-200 block">{node.title}</span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">{node.desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveNode(node.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-500/10 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="relative z-10 pt-4 border-t border-neutral-900 flex justify-between">
            <button
              onClick={handleAddNode}
              className="px-4 py-2.5 rounded-xl border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 text-neutral-350 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Logic Node
            </button>
            <span className="text-[10px] text-neutral-600 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Auto-saved local layout
            </span>
          </div>

        </div>

        {/* Right Side: Parameter configuration & Simulation logs */}
        <div className="lg:col-span-4 flex flex-col justify-between overflow-y-auto space-y-6">
          
          {/* Node Config Parameter form */}
          <div className="glass-card border border-neutral-850 rounded-2xl p-5 text-left space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-450 block border-b border-neutral-900 pb-2 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-emerald-400" /> Node Configurations
            </span>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] bg-neutral-950 border border-neutral-900 text-neutral-500 px-2 py-0.5 rounded uppercase font-bold font-mono">
                    Node ID: {selectedNode.id}
                  </span>
                  <h3 className="font-bold text-neutral-200 text-sm mt-2">{selectedNode.title}</h3>
                </div>

                <div className="space-y-3">
                  {Object.entries(selectedNode.config).map(([key, val]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-1.5">{key}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateConfig(key, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-300 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-600 text-xs">
                Select a visual node from the canvas logic workspace to edit its trigger/action settings.
              </div>
            )}
          </div>

          {/* Simulation Output Logger */}
          <div className="flex-1 glass-card border border-neutral-855 rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block border-b border-neutral-900 pb-2">Simulation Test Outputs</span>
            
            <div className="flex-1 bg-neutral-950/90 rounded-xl p-4 border border-neutral-900 font-mono text-[9.5px] leading-relaxed text-neutral-500 text-left overflow-y-auto mt-4 max-h-[200px] space-y-1">
              {simLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-neutral-600 gap-1.5">
                  <Play className="w-4 h-4" /> Trigger "Test Execution Flow" to inspect webhooks execution runs.
                </div>
              ) : (
                simLogs.map((log, i) => {
                  const isEnd = log.includes('END');
                  const isStart = log.includes('START');
                  const isErr = log.includes('ERROR');
                  return (
                    <div
                      key={i}
                      className={
                        isEnd
                          ? 'text-emerald-400 font-bold'
                          : isStart
                          ? 'text-neutral-400 font-bold'
                          : isErr
                          ? 'text-red-400'
                          : 'text-neutral-450'
                      }
                    >
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
