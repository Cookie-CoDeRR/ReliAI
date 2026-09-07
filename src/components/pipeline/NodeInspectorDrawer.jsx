import React, { useState } from 'react';
import {
  X,
  Cpu,
  Clock,
  Sparkles,
  Database,
  Terminal,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check
} from 'lucide-react';

export default function NodeInspectorDrawer({ node, onClose }) {
  const [activeTab, setActiveTab] = useState('reasoning'); // 'reasoning' | 'tools' | 'raw'
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const data = node.data || {};
  const {
    label = 'Agent',
    role = 'Specialist',
    state = 'idle',
    latency = null,
    tokens = null,
    inputPrompt = '',
    outputSnippet = '',
    fullReasoning = '',
    toolsUsed = [],
    confidence = null
  } = data;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[340px] sm:w-[380px] h-full bg-white/95 backdrop-blur-2xl border-l border-[#ecd5c5] p-4 text-slate-800 flex flex-col justify-between overflow-hidden shadow-xl z-30 animate-in slide-in-from-right duration-200">
      
      {/* Drawer Header */}
      <div className="pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state === 'active' || state === 'streaming'
                  ? 'bg-[#d98555] animate-pulse ring-4 ring-[#d98555]/30'
                  : state === 'done'
                  ? 'bg-emerald-500'
                  : state === 'error'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
            />
            <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight leading-none">
              {label}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              title="Copy node data"
              className="p-1 rounded-[6px] bg-slate-100 hover:bg-[#faeee5] text-slate-500 hover:text-[#c8764b] transition cursor-pointer text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-[6px] bg-slate-100 hover:bg-[#faeee5] text-slate-500 hover:text-[#c8764b] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="font-mono text-xs text-[#c8764b] font-medium mt-1">
          {role} • Node ID: <span className="text-slate-400">{node.id}</span>
        </p>

        {/* 3 Metric Pills with 8px corners */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <div className="bg-[#faf5f0] border border-[#ecd7c7] p-2 rounded-[8px] text-center">
            <span className="font-mono text-[8px] text-slate-400 block uppercase">State</span>
            <strong className="font-mono text-xs text-slate-800 uppercase">{state}</strong>
          </div>
          <div className="bg-[#faf5f0] border border-[#ecd7c7] p-2 rounded-[8px] text-center">
            <span className="font-mono text-[8px] text-slate-400 block uppercase">Latency</span>
            <strong className="font-mono text-xs text-[#d98555]">{latency ? `${latency}ms` : '—'}</strong>
          </div>
          <div className="bg-[#faf5f0] border border-[#ecd7c7] p-2 rounded-[8px] text-center">
            <span className="font-mono text-[8px] text-slate-400 block uppercase">Tokens</span>
            <strong className="font-mono text-xs text-[#c8764b]">{tokens || '—'}</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 py-2 shrink-0">
        {[
          { id: 'reasoning', label: 'Reasoning & Output' },
          { id: 'tools', label: 'Tools & Evidence' },
          { id: 'raw', label: 'JSON' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 rounded-[6px] font-mono text-xs font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 font-mono text-xs">
        {activeTab === 'reasoning' ? (
          <>
            {inputPrompt && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-[#d98555]" /> Input Task / Ingestion
                </span>
                <div className="p-2.5 rounded-[8px] bg-[#faf5f0] border border-[#ecd7c7] text-slate-700 leading-relaxed text-[11px]">
                  {inputPrompt}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#d98555]" /> Active Reasoning Stream
              </span>
              <div className="p-2.5 rounded-[8px] bg-[#faf5f0] border border-[#ecd7c7] text-slate-800 leading-relaxed text-[11.5px] whitespace-pre-wrap">
                {fullReasoning || outputSnippet || 'Awaiting agent execution...'}
              </div>
            </div>

            {confidence && (
              <div className="p-2 rounded-[8px] bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-emerald-800 font-semibold">Verification Confidence:</span>
                <span className="text-emerald-700 font-bold">{confidence}%</span>
              </div>
            )}
          </>
        ) : activeTab === 'tools' ? (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
              Executed Tool Calls ({toolsUsed.length})
            </span>
            {toolsUsed.length > 0 ? (
              toolsUsed.map((tool, idx) => (
                <div key={idx} className="p-2 rounded-[6px] bg-[#faf5f0] border border-[#ecd7c7] space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#c8764b] font-bold">
                    <span>{tool.name || `Tool #${idx + 1}`}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">SUCCESS</span>
                  </div>
                  <p className="text-[10px] text-slate-600">{tool.description || 'Vector similarity search & ISO Golden baseline check.'}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">No external tool calls recorded for this step.</p>
            )}
          </div>
        ) : (
          <pre className="p-2.5 rounded-[8px] bg-slate-900 text-[10px] text-amber-300 overflow-x-auto">
            {JSON.stringify(node, null, 2)}
          </pre>
        )}
      </div>

      {/* Footer Strip */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-mono text-slate-400 shrink-0">
        <span>ReliAI Neural DAG v2.4</span>
        <span>DAG Layout: Dagre Hierarchical</span>
      </div>

    </div>
  );
}
