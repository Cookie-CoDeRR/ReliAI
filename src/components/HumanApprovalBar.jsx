import React, { useState } from 'react';
import { CheckCircle, XCircle, Wrench, Shield, UserCheck, AlertOctagon } from 'lucide-react';

export default function HumanApprovalBar({ 
  status, 
  confidenceScore = 0, 
  recommendedMitigation = "", 
  onAction,
  isProcessing = false 
}) {
  const [engineerId, setEngineerId] = useState("ENG-STATION-LEAD-01");
  const [notes, setNotes] = useState("");
  const isApproved = status === "APPROVED";
  const isContradictory = status === "INCONCLUSIVE_CONTRADICTIONS";

  const handleAction = (actionType) => {
    onAction({
      action: actionType,
      engineer_id: engineerId,
      notes: notes || `Action ${actionType} triggered from Command Center.`
    });
  };

  return (
    <div className={`glass-panel rounded-xl p-4 border transition-all ${
      isContradictory 
        ? 'border-rose-500/60 bg-slate-950/90 shadow-2xl shadow-rose-950/30' 
        : isApproved 
          ? 'border-emerald-500/60 bg-slate-950/90 shadow-2xl shadow-emerald-950/30' 
          : 'border-cyan-500/40 bg-slate-950/90'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Title & Safeguard Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
            <UserCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-white">
              Human-in-the-Loop Safety Authorization Gateway
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic Gate: No automated maintenance or PLC override is dispatched without verified engineer sign-off.
            </p>
          </div>
        </div>

        {/* Confidence Score Pill */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Verified Confidence</div>
            <div className={`font-mono text-xl font-extrabold ${
              confidenceScore >= 80 ? 'text-emerald-400' : confidenceScore <= 45 ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {confidenceScore.toFixed(1)}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center font-mono text-xs">
            {confidenceScore >= 80 ? 'âœ“' : '!'}
          </div>
        </div>
      </div>

      {/* Recommended Mitigation Display */}
      {recommendedMitigation && (
        <div className="mb-3 bg-slate-900/80 rounded-lg p-3 border border-slate-800 text-xs font-mono text-slate-200">
          <div className="text-slate-400 font-bold mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Recommended Corrective Action (SOP Grounded):
          </div>
          <div className="text-cyan-200">{recommendedMitigation}</div>
        </div>
      )}

      {/* Inputs & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2 grow">
          <input
            type="text"
            value={engineerId}
            onChange={(e) => setEngineerId(e.target.value)}
            placeholder="Engineer ID (e.g. ENG-01)"
            className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 w-48"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Authorization audit notes / shift log..."
            className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 grow min-w-[220px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isContradictory ? (
            <button
              onClick={() => handleAction('DISPATCH_TECH')}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-heading font-semibold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-rose-950 transition cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Dispatch Field Technician (Multimeter Audit)</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction('APPROVE')}
                disabled={isProcessing || isApproved}
                className={`flex items-center gap-2 font-heading font-semibold text-xs px-3.5 py-2 rounded-lg shadow-lg transition ${
                  isApproved 
                    ? 'bg-emerald-800 text-emerald-200 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isApproved ? "Approved & Dispatched" : "Approve Mitigation Plan"}</span>
              </button>

              <button
                onClick={() => handleAction('OVERRIDE')}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-heading font-semibold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-amber-400" />
                <span>Override AI</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

