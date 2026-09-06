import React, { useState } from "react";
import { CheckCircle, XCircle, Wrench, ShieldCheck } from "lucide-react";

export default function HumanApprovalBar({
  status,
  confidenceScore = 0,
  recommendedMitigation = "",
  onAction,
  isProcessing = false
}) {
  const [engineerId, setEngineerId] = useState("ENG-LEAD");
  const [notes, setNotes] = useState("");
  const approved = status === "APPROVED";
  const contradictory = status === "INCONCLUSIVE_CONTRADICTIONS";

  const act = (action) =>
    onAction({
      action,
      engineer_id: engineerId,
      notes: notes || `Action ${action} approved.`
    });

  return (
    <div
      className={`bg-white/95 backdrop-blur-md rounded-[16px] p-2.5 border shadow-xs transition ${
        contradictory
          ? "border-rose-300"
          : approved
          ? "border-emerald-300"
          : "border-[#ecd5c5]/80"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Short Inputs */}
        <div className="flex items-center gap-2 flex-1">
          <input
            value={engineerId}
            onChange={(e) => setEngineerId(e.target.value)}
            className="w-24 h-7 rounded-[8px] border border-slate-200 bg-slate-50 px-2 text-[9.5px] font-mono text-slate-800 outline-none"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Sign-off notes..."
            className="flex-1 h-7 rounded-[8px] border border-slate-200 bg-slate-50 px-2 text-[9.5px] font-mono text-slate-800 outline-none"
          />
        </div>

        {/* Confidence & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-bold text-slate-700">
            {Number(confidenceScore || 0).toFixed(0)}%
          </span>

          {contradictory ? (
            <button
              onClick={() => act("DISPATCH_TECH")}
              disabled={isProcessing}
              className="h-7 px-2.5 rounded-[8px] border border-rose-300 bg-rose-50 text-rose-700 text-[9.5px] font-bold cursor-pointer flex items-center gap-1"
            >
              <Wrench className="w-3 h-3" />
              Dispatch
            </button>
          ) : (
            <>
              <button
                onClick={() => act("OVERRIDE")}
                disabled={isProcessing}
                className="h-7 px-2.5 rounded-[8px] border border-slate-200 bg-slate-50 text-slate-600 text-[9.5px] font-semibold cursor-pointer"
              >
                Override
              </button>
              <button
                onClick={() => act("APPROVE")}
                disabled={isProcessing || approved}
                className={`h-7 px-3 rounded-[8px] text-[9.5px] font-bold cursor-pointer transition flex items-center gap-1 ${
                  approved
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-[#d98555] hover:bg-[#c8764b] text-white"
                }`}
              >
                {approved ? <ShieldCheck className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                {approved ? "Approved" : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
