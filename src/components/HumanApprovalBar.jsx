import React, { useState } from "react";
import { CheckCircle, XCircle, Wrench, UserCheck, LockKeyhole, ShieldCheck } from "lucide-react";

export default function HumanApprovalBar({ status, confidenceScore = 0, recommendedMitigation = "", onAction, isProcessing = false }) {
  const [engineerId, setEngineerId] = useState("ENG-STATION-LEAD-01");
  const [notes, setNotes] = useState("");
  const approved = status === "APPROVED";
  const contradictory = status === "INCONCLUSIVE_CONTRADICTIONS";
  const act = (action) => onAction({ action, engineer_id: engineerId, notes: notes || `Action ${action} triggered from ReliAI Investigation OS.` });

  return (
    <section className={`os-panel rounded-2xl overflow-hidden ${contradictory ? "border-rose-500/30" : approved ? "border-emerald-500/30" : ""}`}>
      <div className="px-4 py-3.5 flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="xl:w-[300px] flex items-center gap-3"><div className="w-10 h-10 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] flex items-center justify-center"><UserCheck className="w-4.5 h-4.5 text-cyan-300" /></div><div><div className="flex items-center gap-2"><div className="font-heading text-[14px] font-bold text-white">Human Decision Gate</div><LockKeyhole className="w-3 h-3 text-slate-600" /></div><div className="mt-0.5 text-[8px] font-mono text-slate-600">No PLC or maintenance action without engineer authorization.</div></div></div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[190px_1fr] gap-2"><input value={engineerId} onChange={(e) => setEngineerId(e.target.value)} className="h-9 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-[9px] font-mono text-slate-200 outline-none focus:border-cyan-500/40" /><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Authorization notes / shift log..." className="h-9 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-[9px] font-mono text-slate-200 outline-none focus:border-cyan-500/40" /></div>
        <div className="flex items-center gap-2"><div className="hidden md:block pr-1 text-right"><div className="text-[7px] font-mono uppercase tracking-wider text-slate-600">Verified Confidence</div><div className={`mt-0.5 text-[16px] font-mono font-bold ${confidenceScore >= 80 ? "text-emerald-400" : confidenceScore <= 45 ? "text-rose-400" : "text-amber-400"}`}>{Number(confidenceScore || 0).toFixed(1)}%</div></div>{contradictory ? <button onClick={() => act("DISPATCH_TECH")} disabled={isProcessing} className="h-9 px-4 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] text-rose-200 hover:bg-rose-500/[0.13] transition flex items-center gap-2 text-[9px] font-semibold"><Wrench className="w-3.5 h-3.5" />Dispatch Tech</button> : <><button onClick={() => act("OVERRIDE")} disabled={isProcessing} className="h-9 px-3 rounded-lg border border-slate-700 bg-slate-950/55 text-slate-400 hover:text-white hover:border-amber-500/30 transition flex items-center gap-2 text-[9px] font-semibold"><XCircle className="w-3.5 h-3.5 text-amber-400" />Override</button><button onClick={() => act("APPROVE")} disabled={isProcessing || approved} className={`h-9 px-4 rounded-lg transition flex items-center gap-2 text-[9px] font-bold ${approved ? "border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400/65" : "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"}`}>{approved ? <ShieldCheck className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}{approved ? "Approved" : "Approve Mitigation"}</button></>}</div>
      </div>
      {recommendedMitigation && <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/30 text-[8px] font-mono text-slate-600 truncate">Proposed action: <span className="text-slate-400">{recommendedMitigation}</span></div>}
    </section>
  );
}
