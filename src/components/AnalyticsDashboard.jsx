import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  X, 
  RefreshCw, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Wrench,
  Gauge
} from 'lucide-react';
import {
  fetchAnalyticsSummary,
  fetchDomainBreakdown,
  fetchConfidenceDistribution,
  fetchApprovalBreakdown
} from '../services/api';

const DOMAIN_COLORS = {
  THERMAL_OVERHEAT: 'from-rose-500 to-amber-500 text-rose-300 border-rose-500/30',
  PNEUMATIC_PRESSURE_DROP: 'from-sky-500 to-cyan-500 text-sky-300 border-sky-500/30',
  KINEMATIC_MISALIGNMENT: 'from-violet-500 to-indigo-500 text-violet-300 border-violet-500/30',
  QUALITY_BEAD_DEFECT: 'from-emerald-500 to-teal-500 text-emerald-300 border-emerald-500/30',
  CONTRADICTORY_TELEMETRY: 'from-amber-500 to-orange-500 text-amber-300 border-amber-500/30',
  ELECTRICAL_POWER_SAG: 'from-yellow-500 to-amber-500 text-yellow-300 border-yellow-500/30',
  ACOUSTIC_BEARING_FAULT: 'from-pink-500 to-rose-500 text-pink-300 border-pink-500/30',
  GENERAL_FAULT: 'from-slate-500 to-slate-400 text-slate-300 border-slate-500/30',
  UNKNOWN: 'from-slate-600 to-slate-500 text-slate-400 border-slate-600/30'
};

export default function AnalyticsDashboard({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [domains, setDomains] = useState([]);
  const [confidence, setConfidence] = useState({});
  const [approvals, setApprovals] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, domData, confData, appData] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchDomainBreakdown(),
        fetchConfidenceDistribution(),
        fetchApprovalBreakdown()
      ]);
      setSummary(sumData);
      setDomains(domData);
      setConfidence(confData);
      setApprovals(appData);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalConfidenceSamples = Object.values(confidence).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                Investigation Fleet Analytics
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  REAL-TIME DB
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Historical telemetry anomalies, multi-agent convergence & HITL sign-off performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>Total Incidents</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-heading font-extrabold text-white">
                {summary?.total_incidents || 0}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-1">
                Persistent in SQLite DB
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>Conclusive Rate</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-heading font-extrabold text-emerald-400 font-mono">
                {summary?.conclusive_rate || 0}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                AI consensus reached
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>Mean Confidence</span>
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-heading font-extrabold text-indigo-300 font-mono">
                {summary?.average_confidence || 0}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Verified mathematical engine
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>Anti-Hallucinations</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-heading font-extrabold text-amber-400 font-mono">
                {summary?.contradictions_detected || 0}
              </div>
              <div className="text-[10px] text-amber-300/80 font-mono mt-1">
                Critic refutations enforced
              </div>
            </div>
          </div>

          {/* Two Columns: Domain Breakdown & Confidence Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Domain Breakdown */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                    <PieChart className="w-4 h-4 text-cyan-400" />
                    <span>Incidents by Failure Domain</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {domains.length} Distinct Domains
                  </span>
                </div>

                <div className="space-y-3">
                  {domains.map((d) => {
                    const colorStyle = DOMAIN_COLORS[d.domain] || DOMAIN_COLORS.UNKNOWN;
                    return (
                      <div key={d.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">{d.domain}</span>
                          <span className="text-slate-400">
                            <strong className="text-white">{d.count}</strong> ({d.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colorStyle}`}
                            style={{ width: `${Math.max(d.percentage, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                Data populated via real-time triage trace extraction & telemetry classifiers.
              </div>
            </div>

            {/* Right: Confidence Distribution & Human Sign-off */}
            <div className="lg:col-span-5 space-y-6 flex flex-col">
              {/* Confidence Distribution Histogram */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span>Confidence Distribution</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Scores</span>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(confidence).map(([bracket, count]) => {
                    const pct = Math.round((count / totalConfidenceSamples) * 100);
                    const barColor = 
                      bracket === '90-100%' ? 'bg-emerald-500' :
                      bracket === '80-89%' ? 'bg-cyan-500' :
                      bracket === '70-79%' ? 'bg-indigo-500' :
                      bracket === '60-69%' ? 'bg-amber-500' : 'bg-rose-500';

                    return (
                      <div key={bracket} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400 font-semibold">{bracket}</span>
                          <span className="text-slate-300">{count} incidents ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Human-in-the-Loop Sign-off Metrics */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span>HITL Safety Audit Log</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Total: {approvals?.total_actions || 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-center">
                      <div className="text-[10px] font-mono text-emerald-400 uppercase">Approve</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {approvals?.actions?.APPROVE || 0}
                      </div>
                      <div className="text-[9px] text-emerald-300/80 font-mono">
                        {approvals?.approval_rate || 0}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-center">
                      <div className="text-[10px] font-mono text-amber-400 uppercase">Override</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {approvals?.actions?.OVERRIDE || 0}
                      </div>
                      <div className="text-[9px] text-amber-300/80 font-mono">
                        {approvals?.override_rate || 0}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-center">
                      <div className="text-[10px] font-mono text-rose-400 uppercase">Dispatch</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {approvals?.actions?.DISPATCH_TECH || 0}
                      </div>
                      <div className="text-[9px] text-rose-300/80 font-mono">
                        {approvals?.dispatch_rate || 0}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800">
                  Every mitigation execution is cryptographically logged to the audit table.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
