import React, { useState } from 'react';
import { 
  Compass, 
  Database, 
  Activity, 
  GitCommit, 
  ShieldAlert, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const AGENT_STEPS = [
  { id: 'TRIAGE_AGENT', name: '1. Triage Agent', desc: 'Multimodal Alert Classification', icon: Compass, color: 'text-cyan-400 border-cyan-500/30' },
  { id: 'EVIDENCE_RAG_AGENT', name: '2. Evidence RAG', desc: 'Baseline Diffs & SOP Store', icon: Database, color: 'text-sky-400 border-sky-500/30' },
  { id: 'DOMAIN_ANALYSIS', name: '3. Domain Agents', desc: 'Kinematics, Quality & Maintenance', icon: Activity, color: 'text-indigo-400 border-indigo-500/30' },
  { id: 'ROOT_CAUSE_AGENT', name: '4. Root Cause', desc: 'Ranked Evidence Hypotheses', icon: GitCommit, color: 'text-violet-400 border-violet-500/30' },
  { id: 'CRITIC_AGENT', name: '5. Adversarial Critic', desc: 'Falsification & Contradiction Scan', icon: ShieldAlert, color: 'text-amber-400 border-amber-500/30' },
  { id: 'CONFIDENCE_ENGINE', name: '6. Confidence Engine', desc: 'Deterministic Mathematical Verdict', icon: CheckCircle, color: 'text-emerald-400 border-emerald-500/30' }
];

export default function AgentDeliberationGraph({ agentTraces = [], activeAgent = null, isInvestigating = false }) {
  const [expandedAgent, setExpandedAgent] = useState('CRITIC_AGENT');

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>Multi-Agent Deliberation Pipeline</span>
        </div>
        {isInvestigating && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>STREAMING DELIBERATION</span>
          </div>
        )}
      </div>

      {/* Pipeline Node Tree */}
      <div className="space-y-2.5 overflow-y-auto pr-1 max-h-[520px]">
        {AGENT_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const matchingTrace = agentTraces.find(t => t.agent === step.id && (t.step === 'COMPLETED' || t.step === 'FINAL_VERDICT'));
          const isCurrentActive = isInvestigating && activeAgent === step.id;
          const isDone = Boolean(matchingTrace);
          const isExpanded = expandedAgent === step.id;

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-all ${
                isDone 
                  ? 'bg-slate-900/90 border-slate-700/80 shadow-md' 
                  : isCurrentActive
                    ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-400'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-50'
              }`}
            >
              {/* Header Bar */}
              <div 
                onClick={() => setExpandedAgent(isExpanded ? null : step.id)}
                className="p-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-950 border ${
                    isDone ? step.color : isCurrentActive ? 'text-indigo-400 border-indigo-400 animate-bounce' : 'text-slate-600 border-slate-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-semibold text-white flex items-center gap-2">
                      <span>{step.name}</span>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {isCurrentActive && <span className="text-[10px] font-mono text-indigo-400 animate-pulse">REASONING...</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">{step.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {matchingTrace && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      VERIFIED
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expandable Payload Viewer */}
              {isExpanded && matchingTrace && (
                <div className="border-t border-slate-800/80 p-3.5 bg-slate-950/80 rounded-b-xl text-xs font-mono text-slate-300">
                  {matchingTrace.message && (
                    <div className="text-slate-400 mb-2 pb-2 border-b border-slate-800 flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">INFO:</span>
                      <span>{matchingTrace.message}</span>
                    </div>
                  )}

                  {/* Render formatted highlights depending on agent */}
                  {step.id === 'TRIAGE_AGENT' && matchingTrace.payload && (
                    <div className="space-y-1 text-[11px]">
                      <div><strong className="text-slate-400">Domain:</strong> <span className="text-cyan-300">{matchingTrace.payload.incident_domain}</span></div>
                      <div><strong className="text-slate-400">Severity:</strong> <span className="text-rose-300">{matchingTrace.payload.severity}</span></div>
                      <div><strong className="text-slate-400">Containment:</strong> <span className="text-slate-200">{matchingTrace.payload.immediate_containment_action}</span></div>
                    </div>
                  )}

                  {step.id === 'EVIDENCE_RAG_AGENT' && matchingTrace.payload && (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="text-slate-400 font-bold">Evidence Items Detected: ({matchingTrace.payload.evidence_items?.length || 0})</div>
                      {matchingTrace.payload.evidence_items?.slice(0, 3).map((e, i) => (
                        <div key={i} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[10px] text-slate-300">
                          <span className="text-cyan-400 font-bold mr-1.5">{e.evidence_id}</span>
                          <span>{e.observation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.id === 'ROOT_CAUSE_AGENT' && matchingTrace.payload && (
                    <div className="space-y-1 text-[11px]">
                      <div><strong className="text-slate-400">Top Match:</strong> <span className="text-indigo-300 font-bold">{matchingTrace.payload.title}</span></div>
                      <div><strong className="text-slate-400">Component:</strong> <span className="text-slate-200">{matchingTrace.payload.affected_component}</span></div>
                      <div className="text-slate-400 mt-1"><strong className="text-slate-400">Confidence:</strong> <span className="text-emerald-400 font-bold">{matchingTrace.payload.preliminary_confidence}%</span></div>
                    </div>
                  )}

                  {step.id === 'CRITIC_AGENT' && matchingTrace.payload && (
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <strong className="text-slate-400">Validation:</strong>{' '}
                        <span className={matchingTrace.payload.is_physically_possible ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                          {matchingTrace.payload.is_physically_possible ? 'PHYSICALLY VALIDATED' : 'CONTRADICTIONS FOUND'}
                        </span>
                      </div>
                      {matchingTrace.payload.contradictions_detected?.length > 0 && (
                        <div className="bg-amber-950/40 border border-amber-600/40 p-2 rounded text-amber-200 mt-1 text-[10px]">
                          <strong className="block mb-0.5 text-amber-300">Contradiction:</strong>
                          {matchingTrace.payload.contradictions_detected[0]}
                        </div>
                      )}
                      <div className="text-slate-400 text-[10px] mt-1 italic">{matchingTrace.payload.objection_summary}</div>
                    </div>
                  )}

                  {step.id === 'CONFIDENCE_ENGINE' && matchingTrace.verdict && (
                    <div className="space-y-1 text-[11px]">
                      <div><strong className="text-slate-400">Final Score:</strong> <span className="text-emerald-400 font-bold text-sm">{matchingTrace.verdict.final_confidence_score}%</span></div>
                      <div><strong className="text-slate-400">Status:</strong> <span className="text-cyan-300">{matchingTrace.verdict.status}</span></div>
                      <div><strong className="text-slate-400">Action:</strong> <span className="text-slate-200">{matchingTrace.verdict.recommended_mitigation}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
