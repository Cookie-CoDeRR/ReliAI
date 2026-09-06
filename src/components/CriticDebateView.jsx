import React from "react";
import { GitCommit, ShieldAlert, CheckCircle2, XCircle, Scale, Loader2 } from "lucide-react";

export default function CriticDebateView({ rootCause = null, criticReport = null, isInvestigating = false }) {
  const contradictions = criticReport?.contradictions_detected || [];
  const challenged = contradictions.length > 0 || criticReport?.is_physically_possible === false;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[16px] p-3 border border-[#ecd5c5]/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[11px] font-mono font-bold text-slate-800">
          Hypothesis Validation
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold ${
            isInvestigating && !criticReport
              ? "border-[#efc4ab] bg-[#faeee5] text-[#c8764b]"
              : challenged
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : criticReport
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {isInvestigating && !criticReport ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : challenged ? (
            <XCircle className="w-2.5 h-2.5" />
          ) : criticReport ? (
            <CheckCircle2 className="w-2.5 h-2.5" />
          ) : (
            <Scale className="w-2.5 h-2.5" />
          )}
          <span>{isInvestigating && !criticReport ? "AUDITING" : challenged ? "CHALLENGED" : criticReport ? "VALIDATED" : "STANDBY"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
        {/* Generator Claim */}
        <div className="rounded-[10px] border border-slate-200/80 bg-slate-50/90 p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-[#c8764b] font-bold uppercase mb-1">
              <GitCommit className="w-3 h-3 text-[#c8764b]" />
              AI Hypothesis
            </div>
            <div className="text-[11px] font-semibold text-slate-800 leading-4">
              {rootCause?.title || (isInvestigating ? "Analyzing failure mode..." : "Awaiting root-cause analysis...")}
            </div>
          </div>
          <div className="mt-1.5 text-[8.5px] font-mono text-slate-500">
            Confidence: <strong className="text-slate-800">{rootCause?.preliminary_confidence != null ? `${rootCause.preliminary_confidence}%` : "--"}</strong>
          </div>
        </div>

        {/* Critic Objection */}
        <div
          className={`rounded-[10px] border p-2.5 flex flex-col justify-between ${
            challenged ? "border-rose-200 bg-rose-50/50" : "border-slate-200/80 bg-slate-50/90"
          }`}
        >
          <div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-amber-700 font-bold uppercase mb-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              Critic Review
            </div>
            <div className={`text-[10.5px] leading-4 ${challenged ? "text-rose-900 font-medium" : "text-slate-700"}`}>
              {criticReport?.objection_summary || (isInvestigating ? "Checking consistency..." : "Pending execution.")}
            </div>
          </div>

          {challenged && contradictions[0] && (
            <div className="mt-1.5 text-[8.5px] font-mono text-rose-700 bg-white p-1.5 rounded border border-rose-200 truncate">
              {contradictions[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
