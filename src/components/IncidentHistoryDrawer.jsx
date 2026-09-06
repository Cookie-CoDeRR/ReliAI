import React, { useState, useEffect } from 'react';
import {
  fetchIncidentHistory,
  fetchIncidentDetails
} from '../services/api';
import {
  Clock,
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Wrench,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';

export default function IncidentHistoryDrawer({ isOpen, onClose, onSelectIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [fetchingDetailId, setFetchingDetailId] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidentHistory({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        search: searchTerm || undefined,
        limit: 30
      });
      setIncidents(data.incidents || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Failed to fetch incident history:", err);
      setError("Unable to load incident history from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIncidents();
    }
  }, [isOpen, statusFilter, severityFilter]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchIncidents();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelect = async (incidentId) => {
    setSelectedId(incidentId);
    setFetchingDetailId(incidentId);
    try {
      const details = await fetchIncidentDetails(incidentId);
      if (onSelectIncident) {
        onSelectIncident(details);
      }
      onClose();
    } catch (err) {
      console.error("Error loading incident detail:", err);
    } finally {
      setFetchingDetailId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-2.5 h-2.5" /> Approved
          </span>
        );
      case 'OVERRIDDEN':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <XCircle className="w-2.5 h-2.5" /> Overridden
          </span>
        );
      case 'DISPATCHED_TECH':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <Wrench className="w-2.5 h-2.5" /> Tech Dispatched
          </span>
        );
      case 'INCONCLUSIVE_CONTRADICTIONS':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-2.5 h-2.5" /> Contradictions
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#faeee5] text-[#c8764b] border border-[#efc4ab]">MEDIUM</span>;
      default:
        return <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">LOW</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      {/* Backdrop click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl border-l border-[#ecd5c5] rounded-l-[24px] h-full flex flex-col shadow-2xl z-10 text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-[#ecd5c5]/80 flex items-center justify-between bg-[#fdfbf9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[12px] bg-[#faeee5] border border-[#efc4ab] text-[#c8764b]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">Investigation History</h2>
              <p className="text-xs text-slate-500 font-mono">Historical industrial failure audit log & past AI verdicts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-3.5 border-b border-[#ecd5c5]/60 bg-slate-50/60 space-y-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, title, root cause..."
              className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-[10px] text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#d98555]"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9.5px] font-mono text-slate-500 mb-0.5 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 px-2 py-1 rounded-[8px] text-xs font-mono text-slate-700 focus:outline-none focus:border-[#d98555]"
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
              <label className="block text-[9.5px] font-mono text-slate-500 mb-0.5 uppercase">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full bg-[#faeee5] border border-slate-200 px-2 py-1 rounded-[8px] text-xs font-mono text-slate-700 focus:outline-none focus:border-[#d98555]"
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
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {loading && incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-mono text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#c8764b]" />
              <span>Querying database history...</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
              <p className="font-bold mb-0.5">Error Loading History:</p>
              <p>{error}</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-mono text-xs">
              No historical records found matching filter criteria.
            </div>
          ) : (
            incidents.map((item) => {
              const isFetchingThis = fetchingDetailId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`p-3 rounded-[14px] border transition cursor-pointer bg-slate-50/80 hover:bg-white hover:border-[#d98555]/60 hover:shadow-xs ${
                    selectedId === item.id ? 'border-[#d98555] bg-white ring-2 ring-[#d98555]/30' : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[#c8764b]">{item.id}</span>
                      {getSeverityBadge(item.severity)}
                      {getStatusBadge(item.status)}
                    </div>
                    {item.final_confidence_score != null && (
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.final_confidence_score.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-semibold text-xs text-slate-900 mb-1">
                    {item.title}
                  </h3>

                  {item.root_cause_title && (
                    <p className="text-[11px] text-slate-600 font-mono mb-1.5 line-clamp-1">
                      <span className="text-slate-400">Root Cause:</span> {item.root_cause_title}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-200/60">
                    <span>CELL: {item.station_id}</span>
                    <span className="flex items-center gap-1">
                      {formatDate(item.created_at)}
                      {isFetchingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-[#c8764b]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#ecd5c5]/80 bg-[#fdfbf9] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Total Records: <strong className="text-slate-800">{incidents.length}</strong></span>
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1 text-[#c8764b] hover:text-[#b4653a] font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}
