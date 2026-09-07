import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Wrench,
  Loader2
} from 'lucide-react';
import { fetchIncidentDetails, submitHumanApproval } from '../services/api';

export default function InvestigationReplayView({
  incidentId,
  onBack,
  onActionComplete
}) {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({
    step1: true,
    step2: false,
    step3: false,
    step4: true,
    step5: true
  });
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    if (incidentId) {
      loadIncident(incidentId);
    }
  }, [incidentId]);

  const loadIncident = async (id) => {
    setLoading(true);
    try {
      const data = await fetchIncidentDetails(id);
      setIncident(data);
    } catch (err) {
      console.error('Error fetching incident detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepKey) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  const handleAction = async (action) => {
    if (!incidentId) return;
    try {
      await submitHumanApproval(incidentId, {
        action,
        engineer_id: 'ENG-STATION-LEAD',
        notes: `Engineer executed ${action}`
      });
      setActionStatus(action);
      if (onActionComplete) onActionComplete(action);
    } catch (e) {
      console.error('Error recording approval:', e);
    }
  };

  if (!incidentId) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-white/95 backdrop-blur-md rounded-[16px] border border-white/80 text-center text-xs font-mono text-slate-400">
        Select an incident to view replay.
      </div>
    );
  }

  if (loading && !incident) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-white/95 backdrop-blur-md rounded-[16px] border border-white/80 text-center text-xs font-mono text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#d98555]" />
        Loading replay...
      </div>
    );
  }

  const verdict = incident?.verdict || {};
  const rootCause = verdict.primary_root_cause || {};
  const confidenceScore = incident?.final_confidence_score ?? verdict.final_confidence_score ?? 99;

  return (
    <div className="h-full w-full flex flex-col justify-between p-3.5 bg-white/95 backdrop-blur-md rounded-[16px] border border-white/80 shadow-xs overflow-hidden">
      {/* Top Header Row with Back Button & Brand Font */}
      <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full bg-[#faeee5] hover:bg-[#ebd1c1] text-[#c8764b] transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h2 className="font-jersey text-xl sm:text-2xl text-slate-900 tracking-wide leading-none select-none">
              Incident {incident?.id || incidentId}
            </h2>
            <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
              {incident?.station_id || 'FITTER-01'} • Active Anomaly Replay
            </div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200">
          • {incident?.severity || 'CRITICAL'}
        </span>
      </div>

      {/* Simplified 4 KPI Tiles with Jersey 10 Numbers */}
      <div className="p-2.5 rounded-[12px] bg-gradient-to-r from-[#fdfbf9] to-[#fbf7f2] border border-[#ecd5c5]/70 mb-2.5 shrink-0">
        <p className="text-[11px] text-slate-700 font-mono mb-2 line-clamp-1">
          {rootCause.description || incident?.title || 'Excessive thermal degradation on Joint 3 harmonic drive assembly.'}
        </p>

        <div className="grid grid-cols-4 gap-2 border-t border-slate-200/70 pt-1.5 text-center">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Confidence</div>
            <div className="font-jersey text-xl text-slate-900 leading-none mt-0.5">
              {Number(confidenceScore).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Verdict</div>
            <div className="font-jersey text-xl text-rose-600 leading-none mt-0.5">
              HIGH RISK
            </div>
          </div>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Status</div>
            <div className="text-[10px] font-mono font-bold text-[#c8764b] truncate mt-1">
              {actionStatus || (incident?.status === 'APPROVED' ? 'Approved' : 'Pending Review')}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Duration</div>
            <div className="font-jersey text-xl text-slate-800 leading-none mt-0.5">
              0.8s
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Reasoning Timeline Accordion */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 px-1 shrink-0">
          Multi-Agent Investigation Trace
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0">
          {/* 01 Detection */}
          <div className="rounded-[10px] border border-slate-200/80 bg-white overflow-hidden">
            <button
              onClick={() => toggleStep('step1')}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-jersey text-xs text-[#d98555]">01</span>
                <span className="text-[10.5px] font-mono font-bold text-slate-800">Detection Agent</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-600 font-semibold">91%</span>
            </button>
            {expandedSteps.step1 && (
              <div className="px-2.5 pb-2 text-[10px] font-mono text-slate-600 border-t border-slate-100 pt-1.5">
                Thermal spike (88.5°C) and acoustic harmonic signature detected on Joint 3.
              </div>
            )}
          </div>

          {/* 02 Final Verdict */}
          <div className="rounded-[10px] border border-[#ecd5c5]/80 bg-[#fdfbf9] overflow-hidden">
            <button
              onClick={() => toggleStep('step4')}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#faeee5]/50 transition"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-jersey text-xs text-[#d98555]">02</span>
                <span className="text-[10.5px] font-mono font-bold text-[#c8764b]">Causal Root Cause</span>
              </div>
              <span className="text-[9px] font-mono text-rose-600 font-bold">CONFIRMED</span>
            </button>
            {expandedSteps.step4 && (
              <div className="px-2.5 pb-2 text-[10px] font-mono text-slate-700 border-t border-[#ecd5c5]/60 pt-1.5">
                Harmonic drive gearhead lubrication breakdown leading to boundary friction regime.
              </div>
            )}
          </div>

          {/* 03 Human Decision Gate */}
          <div className="rounded-[10px] border border-slate-200/80 bg-white overflow-hidden">
            <button
              onClick={() => toggleStep('step5')}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-jersey text-xs text-[#d98555]">03</span>
                <span className="text-[10.5px] font-mono font-bold text-slate-800">Human Authorization Gate</span>
              </div>
              <span className="text-[9px] font-mono text-[#c8764b]">SIGN-OFF</span>
            </button>
            {expandedSteps.step5 && (
              <div className="px-2.5 pb-2 border-t border-slate-100 pt-1.5 flex items-center justify-between gap-2">
                <span className="text-[9.5px] font-mono text-slate-500">
                  {actionStatus ? `Action ${actionStatus} recorded.` : "Authorize mitigation SOP:"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAction('OVERRIDE')}
                    className="px-2 py-0.5 rounded-[6px] border border-slate-200 bg-slate-50 text-[9px] font-mono font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Override
                  </button>
                  <button
                    onClick={() => handleAction('APPROVE')}
                    className="px-2.5 py-0.5 rounded-[6px] bg-[#d98555] hover:bg-[#c8764b] text-white text-[9px] font-mono font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle className="w-2.5 h-2.5" />
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
