import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Clock, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Wrench, Shield, RefreshCw } from 'lucide-react';
import { fetchIncidents as apiFetchIncidents, fetchIncidentDetails } from '../services/api.js';

export default function IncidentHistoryDrawer({ isOpen, onClose, onSelectIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fetchingDetailId, setFetchingDetailId] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchIncidents();
    }
  }, [isOpen, statusFilter, severityFilter, searchTerm]);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await apiFetchIncidents(params);
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading incident history:", err);
      setError(err.message || "Failed to load incident history.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (incidentId) => {
    setFetchingDetailId(incidentId);
    try {
      const detail = await fetchIncidentDetails(incidentId);
      setSelectedId(incidentId);
      onSelectIncident(detail);
      onClose();
    } catch (err) {
      console.error("Error loading incident detail:", err);
      alert(`Could not load incident details: ${err.message}`);
    } finally {
      setFetchingDetailId(null);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
      case 'OVERRIDDEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <XCircle className="w-3 h-3" /> OVERRIDDEN
          </span>
        );
      case 'DISPATCHED_TECH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Wrench className="w-3 h-3" /> TECH DISPATCHED
          </span>
        );
      case 'INCONCLUSIVE_CONTRADICTIONS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> CONTRADICTIONS
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3 animate-pulse" /> PENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status || 'DETECTED'}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity) => {
    const isCrit = severity === 'CRITICAL';
    const isHigh = severity === 'HIGH';
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
        isCrit ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
        isHigh ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
        'bg-slate-800 text-slate-400 border border-slate-700'
      }`}>
        {severity || 'NORMAL'}
      </span>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      {/* Backdrop click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10 selection:bg-cyan-500/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Investigation History</h2>
              <p className="text-xs text-slate-400 font-mono">Historical industrial failure audit log & past AI verdicts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, title, root cause..."
              className="w-full bg-slate-900 border border-slate-700 pl-9 pr-4 py-2 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Filter Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="OVERRIDDEN">Overridden</option>
                <option value="DISPATCHED_TECH">Dispatched Tech</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="INCONCLUSIVE_CONTRADICTIONS">Contradictions</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Filter Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incidents List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-mono text-xs gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Querying database history...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">
              <p className="font-bold mb-1">Error Loading History:</p>
              <p>{error}</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              No historical records found matching filter criteria.
            </div>
          ) : (
            incidents.map((item) => {
              const isFetchingThis = fetchingDetailId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-500/50 ${
                    selectedId === item.id ? 'border-cyan-400 bg-slate-900 shadow-lg shadow-cyan-950/30' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-cyan-300">{item.id}</span>
                      {getSeverityBadge(item.severity)}
                      {getStatusBadge(item.status)}
                    </div>
                    {item.final_confidence_score != null && (
                      <span className="font-mono text-xs font-extrabold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        {item.final_confidence_score.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-semibold text-sm text-white mb-1">
                    {item.title}
                  </h3>

                  {item.root_cause_title && (
                    <p className="text-xs text-slate-400 font-mono mb-2 line-clamp-1">
                      <span className="text-slate-500">Root Cause:</span> {item.root_cause_title}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
                    <span>CELL: {item.station_id}</span>
                    <span className="flex items-center gap-1">
                      {formatDate(item.created_at)}
                      {isFetchingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Total Records: <strong className="text-white">{incidents.length}</strong></span>
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}
