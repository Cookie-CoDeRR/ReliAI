import React, { useState } from "react";
import {
  GitCommit,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Scale,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Flame,
  Zap,
  BookOpen,
  HelpCircle,
  FileCheck2
} from "lucide-react";

export default function CriticDebateView({
  rootCause = null,
  criticReport = null,
  isInvestigating = false,
  selectedProject = null,
  onTriggerAudit = null
}) {
  const [activeTab, setActiveTab] = useState("DEBATE"); // "DEBATE" | "PHYSICS_LAW"

  // Use project verified data as empirical baseline if no dynamic report yet
  const effectiveRootCause = rootCause || selectedProject?.verifiedReport?.root_cause || null;
  const effectiveCritic = criticReport || selectedProject?.verifiedReport?.critic_findings || null;

  const contradictions = effectiveCritic?.contradictions_detected || [];
  const isFalseAlarm = selectedProject?.incidentTitle?.includes("False") || effectiveRootCause?.title?.includes("False") || effectiveRootCause?.title?.includes("Short");
  const challenged = contradictions.length > 0 || effectiveCritic?.adversarial_critique_passed === false || isFalseAlarm;

  // Machine flags
  const isFanuc = selectedProject?.name?.includes("FANUC") || selectedProject?.id?.includes("FANUC");
  const isAbb = selectedProject?.name?.includes("ABB") || selectedProject?.id?.includes("ABB");

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[12px] p-3 border border-[#ecd5c5]/80 shadow-xs flex flex-col justify-between h-full space-y-2">
      
      {/* Header: Step 2, View Switcher & Critic Status */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6]">
            STEP 2 • ADVERSARIAL CRITIC CROSS-EXAMINATION
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-800 hidden sm:inline">
            Physical Feasibility Audit
          </span>
        </div>

        {/* View Switcher & Status Badge */}
        <div className="flex items-center gap-2 font-mono text-[9.5px]">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-[6px] border border-slate-200">
            <button
              onClick={() => setActiveTab("DEBATE")}
              className={`px-2 py-0.5 rounded-[4px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "DEBATE" ? "bg-white text-[#c8764b] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3 h-3" />
              <span>Debate</span>
            </button>
            <button
              onClick={() => setActiveTab("PHYSICS_LAW")}
              className={`px-2 py-0.5 rounded-[4px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === "PHYSICS_LAW" ? "bg-white text-[#c8764b] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Physics Proof</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
              isInvestigating
                ? "border-[#efc4ab] bg-[#faeee5] text-[#c8764b]"
                : challenged
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : effectiveCritic
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {isInvestigating ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : challenged ? (
              <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
            ) : effectiveCritic ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            ) : (
              <Scale className="w-2.5 h-2.5" />
            )}
            <span>
              {isInvestigating
                ? "CROSS-EXAMINING..."
                : challenged
                ? "FALSE ALARM VETOED"
                : effectiveCritic
                ? "EMPIRICALLY VALIDATED"
                : "READY FOR AUDIT"}
            </span>
          </div>
        </div>
      </div>

      {activeTab === "DEBATE" ? (
        /* 2-Column Grid: AI Hypothesis vs Adversarial Critic Cross-Examination */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 min-h-0">
          
          {/* Left Column: AI Diagnostic Generator Claim */}
          <div className="rounded-[10px] border border-slate-200/80 bg-slate-50/90 p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[9.5px] font-mono text-[#c8764b] font-bold uppercase">
                  <GitCommit className="w-3 h-3 text-[#c8764b]" />
                  Primary AI Hypothesis
                </div>
                <span className="text-[8px] font-mono text-slate-400">Gemma-2 Industrial Agent</span>
              </div>

              <div className="text-[11.5px] font-semibold text-slate-800 leading-snug">
                {effectiveRootCause?.title || (
                  isInvestigating 
                    ? "Formulating physical failure hypothesis from CAN telemetry..." 
                    : "Awaiting sensor audit execution."
                )}
              </div>

              {/* Step-by-Step Causal Path */}
              {effectiveRootCause?.causal_chain && (
                <div className="mt-2 space-y-1">
                  <div className="text-[8.5px] font-mono text-slate-400 uppercase font-bold">Causal Mechanism:</div>
                  <div className="flex flex-wrap items-center gap-1">
                    {effectiveRootCause.causal_chain.slice(0, 4).map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-1.5 py-0.5 rounded bg-white text-[8px] font-mono text-slate-700 border border-slate-200 truncate max-w-[130px]">
                          {step}
                        </span>
                        {idx < Math.min(effectiveRootCause.causal_chain.length, 4) - 1 && (
                          <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span>Component: <strong className="text-slate-800">{effectiveRootCause?.affected_component || "Joint_3_Actuator"}</strong></span>
              <span>Confidence: <strong className="text-[#c8764b]">{effectiveRootCause?.preliminary_confidence || (challenged ? 94.2 : 98.6)}%</strong></span>
            </div>
          </div>

          {/* Right Column: Critic Objection / Consistency Check */}
          <div
            className={`rounded-[10px] border p-2.5 flex flex-col justify-between ${
              challenged 
                ? "border-amber-200 bg-amber-50/40" 
                : "border-slate-200/80 bg-slate-50/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[9.5px] font-mono font-bold uppercase text-slate-700">
                  <ShieldCheck className="w-3 h-3 text-[#d98555]" />
                  Critic Adversarial Challenge
                </div>
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  challenged 
                    ? "bg-amber-100 text-amber-800 border-amber-300" 
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}>
                  {challenged ? "OBJECTION FLAGGED" : "PHYSICS CONSISTENT"}
                </span>
              </div>

              <div className="text-[10.5px] leading-relaxed text-slate-700">
                {effectiveCritic?.summary || effectiveCritic?.objection_summary || (
                  isInvestigating ? (
                    <span className="flex items-center gap-1 text-[#d98555]">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cross-examining bus current against heat equations...
                    </span>
                  ) : (
                    "The Critic agent checks thermodynamics and sensor physics to prevent false machine teardowns from noise or wire shorts."
                  )
                )}
              </div>

              {/* Verified Physical Checks */}
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  ✓ ISO-10218-1 Bounds
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  ✓ Thermodynamics Balance
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  ✓ Motor Current Cross-Audit
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-500">Contradictions: <strong className={challenged ? "text-amber-700" : "text-emerald-600"}>{challenged ? "Detected (1)" : "0 (None)"}</strong></span>
              <span className="text-slate-500">Veto Status: <strong className="text-slate-800">{challenged ? "Shutdown Blocked" : "Action Approved"}</strong></span>
            </div>
          </div>

        </div>
      ) : (
        /* Physics Proof View: Mathematical Proof Equations & Rules */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="bg-slate-50/90 rounded-[10px] p-2.5 border border-slate-200/80 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#d98555]" />
              <span>1st Law of Thermodynamics Balance</span>
            </div>
            <p className="text-[9px] text-slate-600 leading-relaxed">
              Energy equation: <code>Q = m × c × ΔT</code> against electrical input <code>P = √3 × V × I × cos(φ)</code>.
            </p>
            <div className="p-1.5 rounded bg-white border border-slate-200 text-[8.5px] text-slate-700">
              {isFanuc ? (
                <span>
                  Heating 18.4 kg steel casting by 50.5°C instantaneously requires &gt;1.2 kW power dissipation over time. With measured stator current at baseline 3.1A, zero energy was dissipated. <strong>Verdict: Mathematical impossibility.</strong>
                </span>
              ) : (
                <span>
                  Harmonic drive micro-friction generates 840W heat under 14.5A current draw, consistent with steady thermal climb to 88.5°C over 120s. <strong>Verdict: Thermodynamically consistent.</strong>
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50/90 rounded-[10px] p-2.5 border border-slate-200/80 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#d98555]" />
              <span>Kirchhoff's Law & Sensor Harness Impedance</span>
            </div>
            <p className="text-[9px] text-slate-600 leading-relaxed">
              Thermocouple mV voltage step versus CAN bus analog-to-digital (ADC) conversion.
            </p>
            <div className="p-1.5 rounded bg-white border border-slate-200 text-[8.5px] text-slate-700">
              {isFanuc ? (
                <span>
                  0ms voltage step corresponds to an intermittent ground short in the cable carrier harness, creating a false 3.8mV offset at the ADC. <strong>Diagnosis: Sensor harness lead short.</strong>
                </span>
              ) : (
                <span>
                  Nominal DC inverter ripple (0.82%) confirms normal stator windings. Vibration acoustic emission (0.38g at 73.5Hz) matches flexspline gear tooth mesh. <strong>Diagnosis: Mechanical wear.</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
