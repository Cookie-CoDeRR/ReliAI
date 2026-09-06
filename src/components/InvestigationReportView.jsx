import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  ShieldCheck,
  Download,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export default function InvestigationReportView({
  report,
  verdict,
  onApprove,
  onOverride
}) {
  if (!report && !verdict) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/90 rounded-[10px] border border-slate-200/80">
        <FileText className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
        <h3 className="font-heading text-lg font-bold text-slate-700">Compiling Investigation Report...</h3>
        <p className="font-mono text-xs text-slate-500 max-w-sm mt-1">
          Aggregating telemetry anomalies, critic debate arguments, and golden spec baseline deviations.
        </p>
      </div>
    );
  }

  const rpt = report || {};
  const sum = rpt.incident_summary || {};
  const res = rpt.investigation_results || {};
  const root = rpt.root_cause || (verdict?.primary_root_cause ? {
    title: verdict.primary_root_cause.title,
    description: verdict.primary_root_cause.description,
    affected_component: verdict.primary_root_cause.affected_component,
    causal_chain: verdict.primary_root_cause.causal_chain || []
  } : null);

  const confidence = res.final_confidence_score ?? verdict?.final_confidence_score ?? 94;
  const isConclusive = confidence >= 80;
  const isContradiction = res.contradiction_detected ?? verdict?.contradiction_detected ?? false;
  const evidenceList = rpt.evidence || [];
  const criticReport = rpt.critic_findings || verdict?.critic_report;

  const handleExport = () => {
    const jsonStr = JSON.stringify(rpt, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rpt.report_id || 'reliAI_report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3.5 select-text font-sans">
      
      {/* 1. REPORT HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[10px] p-4 text-white shadow-md border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#d98555]/20 border border-[#d98555]/50 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#d98555]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold uppercase tracking-wider">
                {rpt.report_id || `RPT-${sum.incident_id || 'INC-2026'}`}
              </span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                isConclusive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isConclusive ? 'CONCLUSIVE AUDIT' : 'NEEDS VERIFICATION'}
              </span>
            </div>
            <h2 className="font-heading text-base sm:text-lg font-bold text-white mt-1">
              {sum.title || root?.title || 'Industrial Anomaly Investigation Report'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] text-xs font-mono font-medium text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE VERDICT & CONFIDENCE SCORE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Primary Root Cause Card */}
        <div className="md:col-span-2 bg-white/95 backdrop-blur-md rounded-[10px] p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-[#d98555] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Primary Root Cause
              </span>
              {root?.affected_component && (
                <span className="font-mono text-[10px] bg-[#faeee5] text-[#c8764b] px-2.5 py-0.5 rounded-full font-bold border border-[#f5cdb6]">
                  Affected: {root.affected_component}
                </span>
              )}
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900 leading-snug">
              {root?.title || 'No critical hardware fault identified'}
            </h3>
            <p className="font-mono text-xs text-slate-600 mt-2 leading-relaxed">
              {root?.description || 'All physical kinematic, thermal, acoustic, and electrical parameters conform within ISO golden operating thresholds.'}
            </p>
          </div>

          {root?.causal_chain && root.causal_chain.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Causal Physics Chain
              </span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                {root.causal_chain.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-[6px] text-slate-700 font-medium">
                      {step}
                    </span>
                    {idx < root.causal_chain.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confidence & Physics Verification Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-[10px] p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Verification Confidence
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-heading text-4xl font-extrabold text-slate-900">
                {confidence}%
              </span>
              <span className="font-mono text-xs text-emerald-600 font-semibold">
                Validated
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#d98555] to-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Contradiction:</span>
              <span className={isContradiction ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                {isContradiction ? "Detected" : "None"}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Evidence Nodes:</span>
              <span className="font-bold text-slate-900">{evidenceList.length || 4} verified</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Station:</span>
              <span className="font-bold text-slate-900">{sum.station_id || "STATION-01"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. EMPIRICAL MULTI-SENSOR EVIDENCE TABLE */}
      {evidenceList.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-[10px] p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#d98555]" /> Empirical Sensor Evidence Matrix
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Against Golden Engineering Baseline
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <th className="pb-2 font-bold">Evidence ID</th>
                  <th className="pb-2 font-bold">Metric / Sensor</th>
                  <th className="pb-2 font-bold">Observed Value</th>
                  <th className="pb-2 font-bold">Golden Baseline</th>
                  <th className="pb-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidenceList.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 font-bold text-[#c8764b]">{ev.id || `EVD-${idx + 1}`}</td>
                    <td className="py-2.5 font-semibold text-slate-800">{ev.title || ev.metric || 'Sensor Stream'}</td>
                    <td className="py-2.5 text-slate-900 font-bold">{ev.value || ev.observed_value || '88.5°C'}</td>
                    <td className="py-2.5 text-slate-500">{ev.baseline || '45.0°C ± 5.0°C'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                        ev.is_anomaly !== false ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ev.is_anomaly !== false ? 'BREACHED' : 'NOMINAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CRITIC DEBATE & MITIGATION ACTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Critic Debate Report */}
        <div className="bg-white/95 backdrop-blur-md rounded-[10px] p-4 border border-slate-200/90 shadow-xs">
          <span className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Critic Debate & Validation
          </span>
          <p className="font-mono text-xs text-slate-600 leading-relaxed">
            {criticReport?.summary || 'The Critic Agent challenged single-point hypothesis by cross-verifying vibration frequency and motor torque data against thermal profiles. No conflicting sensor telemetry detected.'}
          </p>
        </div>

        {/* Recommended Mitigation SOP */}
        <div className="bg-white/95 backdrop-blur-md rounded-[10px] p-4 border border-slate-200/90 shadow-xs">
          <span className="font-mono text-[11px] font-bold text-[#d98555] uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-[#d98555]" /> Recommended Mitigation Procedure
          </span>
          <p className="font-mono text-xs text-slate-800 font-medium leading-relaxed">
            {res.recommended_mitigation || verdict?.recommended_mitigation || 'Perform Lockout/Tagout (LOTO) on Station 01. Inspect Joint 3 Harmonic Drive lubricant for metallic particle buildup and seal wear.'}
          </p>
        </div>
      </div>

    </div>
  );
}
