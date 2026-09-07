import React, { useState, useEffect } from 'react';
import {
  fetchAnalyticsSummary,
  fetchDomainAnalytics,
  fetchConfidenceDistribution,
  fetchHumanApprovalStats
} from '../services/api';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Activity,
  UserCheck,
  Gauge,
  X,
  PieChart,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const DOMAIN_COLORS = {
  THERMAL: "from-[#e08252] to-rose-500",
  PNEUMATICS: "from-sky-400 to-blue-500",
  ELECTRICAL: "from-amber-400 to-[#d98555]",
  KINEMATICS: "from-purple-500 to-indigo-600",
  CONTRADICTION: "from-rose-500 to-red-600",
  UNKNOWN: "from-slate-400 to-slate-500"
};

export default function AnalyticsDashboard({ isOpen, onClose }) {
  const [summary, setSummary] = useState(null);
  const [domains, setDomains] = useState([]);
  const [confidence, setConfidence] = useState({});
  const [approvals, setApprovals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, dom, conf, app] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchDomainAnalytics(),
        fetchConfidenceDistribution(),
        fetchHumanApprovalStats()
      ]);
      setSummary(sum);
      setDomains(dom.domains || []);
      setConfidence(conf.distribution || {});
      setApprovals(app);
    } catch (err) {
      console.error("Failed to load analytics dashboard data:", err);
      setError("Failed to fetch analytics metrics from server. Ensure backend is running.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white/95 backdrop-blur-xl border border-[#ecd5c5] rounded-[24px] shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ecd5c5]/80 bg-[#fdfbf9]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[12px] bg-[#faeee5] border border-[#efc4ab] text-[#c8764b]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
                Investigation Fleet Analytics
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#faeee5] text-[#c8764b] border border-[#efc4ab] font-bold">
                  REAL-TIME DB
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Historical telemetry anomalies, multi-agent convergence & HITL sign-off performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[16px] bg-slate-50/90 border border-slate-200/80">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center justify-between">
                <span>Total Incidents</span>
                <Activity className="w-3.5 h-3.5 text-[#c8764b]" />
              </div>
              <div className="text-xl font-heading font-extrabold text-slate-900">
                {summary?.total_incidents || 0}
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                Persistent in SQLite DB
              </div>
            </div>

            <div className="p-3.5 rounded-[16px] bg-slate-50/90 border border-slate-200/80">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center justify-between">
                <span>Conclusive Rate</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-heading font-extrabold text-emerald-600 font-mono">
                {summary?.conclusive_rate || 0}%
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                AI consensus reached
              </div>
            </div>

            <div className="p-3.5 rounded-[16px] bg-slate-50/90 border border-slate-200/80">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center justify-between">
                <span>Mean Confidence</span>
                <Gauge className="w-3.5 h-3.5 text-[#c8764b]" />
              </div>
              <div className="text-xl font-heading font-extrabold text-[#c8764b] font-mono">
                {summary?.average_confidence || 0}%
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                Verified mathematical engine
              </div>
            </div>

            <div className="p-3.5 rounded-[16px] bg-slate-50/90 border border-slate-200/80">
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center justify-between">
                <span>Anti-Hallucinations</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-heading font-extrabold text-amber-600 font-mono">
                {summary?.contradictions_detected || 0}
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                Critic refutations enforced
              </div>
            </div>
          </div>

          {/* Two Columns: Domain Breakdown & Confidence Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Domain Breakdown */}
            <div className="lg:col-span-7 p-4 rounded-[16px] bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                    <PieChart className="w-4 h-4 text-[#c8764b]" />
                    <span>Incidents by Failure Domain</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {domains.length} Domains
                  </span>
                </div>

                <div className="space-y-2.5">
                  {domains.map((d) => {
                    const colorStyle = DOMAIN_COLORS[d.domain] || DOMAIN_COLORS.UNKNOWN;
                    return (
                      <div key={d.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-700 font-semibold">{d.domain}</span>
                          <span className="text-slate-500">
                            <strong className="text-slate-900">{d.count}</strong> ({d.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
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

              <div className="mt-3 pt-2.5 border-t border-slate-200 text-[10px] font-mono text-slate-400">
                Populated via real-time triage trace extraction & telemetry classifiers.
              </div>
            </div>

            {/* Right: Confidence Distribution & Human Sign-off */}
            <div className="lg:col-span-5 space-y-4 flex flex-col">
              {/* Confidence Distribution Histogram */}
              <div className="p-4 rounded-[16px] bg-slate-50/90 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    <span>Confidence Distribution</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Histogram</span>
                </div>

                <div className="space-y-2">
                  {Object.entries(confidence).map(([bracket, count]) => {
                    const pct = Math.round((count / totalConfidenceSamples) * 100);
                    const barColor = 
                      bracket === '90-100%' ? 'bg-emerald-500' :
                      bracket === '80-89%' ? 'bg-[#d98555]' :
                      bracket === '70-79%' ? 'bg-indigo-400' :
                      bracket === '60-69%' ? 'bg-amber-400' : 'bg-rose-400';

                    return (
                      <div key={bracket} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-600 font-semibold">{bracket}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
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
              <div className="p-4 rounded-[16px] bg-slate-50/90 border border-slate-200/80 grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-[#c8764b]" />
                      <span>HITL Safety Audit Log</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Total: {approvals?.total_actions || 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-2 rounded-[12px] bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[9px] font-mono text-emerald-700 uppercase font-bold">Approve</div>
                      <div className="text-base font-bold font-mono text-emerald-800">
                        {approvals?.actions?.APPROVE || 0}
                      </div>
                      <div className="text-[8.5px] text-emerald-600 font-mono">
                        {approvals?.approval_rate || 0}%
                      </div>
                    </div>

                    <div className="p-2 rounded-[12px] bg-amber-50 border border-amber-200 text-center">
                      <div className="text-[9px] font-mono text-amber-700 uppercase font-bold">Override</div>
                      <div className="text-base font-bold font-mono text-amber-800">
                        {approvals?.actions?.OVERRIDE || 0}
                      </div>
                      <div className="text-[8.5px] text-amber-600 font-mono">
                        {approvals?.override_rate || 0}%
                      </div>
                    </div>

                    <div className="p-2 rounded-[12px] bg-rose-50 border border-rose-200 text-center">
                      <div className="text-[9px] font-mono text-rose-700 uppercase font-bold">Dispatch</div>
                      <div className="text-base font-bold font-mono text-rose-800">
                        {approvals?.actions?.DISPATCH_TECH || 0}
                      </div>
                      <div className="text-[8.5px] text-rose-600 font-mono">
                        {approvals?.dispatch_rate || 0}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-slate-200">
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
