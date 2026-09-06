import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { fetchIncidents, fetchAnalyticsSummary } from '../services/api';

export default function IncidentHistoryView({
  selectedIncidentId,
  onSelectIncident
}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(363);
  const [avgConfidence, setAvgConfidence] = useState(82.4);

  // Fetch summary metrics
  useEffect(() => {
    fetchAnalyticsSummary()
      .then((data) => {
        if (data) {
          if (data.total_incidents) setTotalCount(data.total_incidents);
          if (data.avg_confidence) setAvgConfidence(Number(data.avg_confidence.toFixed(1)));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch incidents
  const loadIncidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await fetchIncidents(params);
      if (Array.isArray(data)) {
        setIncidents(data);
        if (data.length > 0 && !selectedIncidentId && onSelectIncident) {
          onSelectIncident(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [searchQuery]);

  const getSeverityBadge = (sev) => {
    const s = (sev || 'HIGH').toUpperCase();
    if (s === 'CRITICAL') {
      return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200">CRITICAL</span>;
    }
    if (s === 'HIGH') {
      return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-orange-50 text-orange-600 border border-orange-200">HIGH</span>;
    }
    if (s === 'MEDIUM') {
      return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#faeee5] text-[#c8764b] border border-[#efc4ab]">MEDIUM</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">LOW</span>;
  };

  return (
    <div className="h-full w-full flex flex-col justify-between p-3.5 bg-white/95 backdrop-blur-md rounded-[16px] border border-white/80 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-jersey text-2xl sm:text-3xl text-slate-900 tracking-wide leading-none select-none">
            Incident History
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Audit log & AI verdicts
          </span>
        </div>
        <div className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#c8764b] bg-[#faeee5] border border-[#efc4ab]">
          {totalCount} Incidents
        </div>
      </div>

      {/* Clean Minimal Search Input Bar */}
      <div className="relative mb-2.5 shrink-0">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search incident ID, station, or anomaly..."
          className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#d98555] focus:bg-white transition"
        />
      </div>

      {/* Confidence Trend Bar (Simplified) */}
      <div className="p-2.5 rounded-[12px] bg-gradient-to-r from-[#fdfbf9] to-[#fbf7f2] border border-[#ecd5c5]/70 mb-2.5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Avg Confidence</div>
            <div className="font-jersey text-2xl text-[#d98555] leading-none">{avgConfidence}%</div>
          </div>
          <div className="hidden sm:block text-[9px] font-mono text-slate-500 max-w-[180px] leading-tight">
            Multi-agent consensus verification trajectory
          </div>
        </div>

        {/* Clean SVG Sparkline */}
        <div className="w-48 h-7 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 160 28" preserveAspectRatio="none">
            <path
              d="M 0,22 Q 30,18 60,14 T 120,10 T 160,5"
              fill="none"
              stroke="#d98555"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="160" cy="5" r="3" fill="#c8764b" />
          </svg>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0">
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-400">
            {loading ? "Loading incidents..." : "No incidents found."}
          </div>
        ) : (
          incidents.map((inc) => {
            const isSelected = selectedIncidentId === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident && onSelectIncident(inc.id)}
                className={`p-2.5 rounded-[12px] border transition cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? "border-[#d98555] bg-[#faeee5]/70 shadow-2xs"
                    : "border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-6 rounded-full shrink-0 ${inc.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-[#d98555]'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">{inc.id}</span>
                      {getSeverityBadge(inc.severity)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      {inc.station_id || 'Station FITTER-01'} • {inc.title || 'Thermal anomaly'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {inc.status === 'APPROVED' ? 'Approved' : 'Pending'}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#d98555] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
