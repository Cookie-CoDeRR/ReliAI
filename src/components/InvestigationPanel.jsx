import { useState, useEffect } from "react";
import { submitApproval } from "../services/api";

export default function InvestigationPanel({ analysis, loading, onAnalyze }) {
  const [decision, setDecision] = useState("PENDING");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  // New AI investigation = new human review
  useEffect(() => {
    setDecision("PENDING");
  }, [analysis]);

  const sendDecision = async (newDecision) => {
    try {
      setApprovalLoading(true);
      setApprovalError("");

      const result = await submitApproval(analysis.incident_id, newDecision);

      setDecision(result.decision);
    } catch (error) {
      console.error("Approval failed:", error);
      setApprovalError("Could not record engineer decision.");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprove = () => {
    sendDecision("APPROVED");
  };

  const handleReject = () => {
    sendDecision("REJECTED");
  };

  return (
    <div className="absolute top-4 right-4 z-30 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-cyan-900 bg-[#07101c]/95 p-4 text-sm shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono tracking-widest text-cyan-500">
            RELIAI
          </p>

          <h2 className="font-mono font-bold text-cyan-300">
            AI INVESTIGATION
          </h2>
        </div>

        <div className="h-2 w-2 rounded-full bg-green-400" />
      </div>

      <button
        onClick={onAnalyze}
        disabled={loading}
        className="mb-4 w-full rounded border border-cyan-700 bg-cyan-950/40 px-3 py-2 font-mono text-xs font-bold text-cyan-300 transition hover:bg-cyan-900/50 disabled:opacity-50"
      >
        {loading ? "INVESTIGATING..." : "RUN INVESTIGATION"}
      </button>

      {!analysis && (
        <div className="rounded border border-slate-800 bg-black/20 p-3">
          <p className="font-mono text-xs text-slate-500">
            Waiting for incident analysis...
          </p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4 font-mono">
          <div>
            <p className="text-[10px] tracking-wider text-slate-500">
              INCIDENT
            </p>
            <p className="text-xs text-slate-300">{analysis.incident_id}</p>
          </div>

          <div>
            <p className="text-[10px] tracking-wider text-slate-500">
              ROOT CAUSE
            </p>

            <p className="text-sm font-bold text-white">
              {analysis.root_cause}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-slate-800 p-2">
              <p className="text-[9px] text-slate-500">CONFIDENCE</p>

              <p className="text-lg font-bold text-cyan-300">
                {analysis.confidence}%
              </p>
            </div>

            <div className="rounded border border-slate-800 p-2">
              <p className="text-[9px] text-slate-500">RISK</p>

              <p className="text-lg font-bold text-yellow-400">
                {analysis.risk}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] tracking-wider text-slate-500">
              EVIDENCE
            </p>

            <div className="space-y-1">
              {analysis.evidence.map((item, index) => (
                <div
                  key={index}
                  className="rounded bg-slate-900/60 px-2 py-1.5 text-[10px] text-slate-300"
                >
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <p className="text-[10px] tracking-wider text-slate-500">
              RECOMMENDED ACTION
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {analysis.recommended_action}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-widest text-slate-500">
                  HUMAN REVIEW
                </p>
                <p className="text-[9px] text-slate-600">
                  Engineer authorization required
                </p>
              </div>

              <span
                className={`rounded border px-2 py-1 text-[9px] font-bold ${
                  decision === "APPROVED"
                    ? "border-green-700 bg-green-950/40 text-green-400"
                    : decision === "REJECTED"
                      ? "border-red-700 bg-red-950/40 text-red-400"
                      : "border-yellow-700 bg-yellow-950/40 text-yellow-400"
                }`}
              >
                {decision}
              </span>
            </div>

            {decision === "PENDING" && (
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={approvalLoading}
                    className="rounded border border-green-700 bg-green-950/30 px-2 py-2 text-[10px] font-bold text-green-400 transition hover:bg-green-900/50 disabled:opacity-50"
                  >
                    {approvalLoading ? "SAVING..." : "APPROVE"}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={approvalLoading}
                    className="rounded border border-red-800 bg-red-950/30 px-2 py-2 text-[10px] font-bold text-red-400 transition hover:bg-red-900/50 disabled:opacity-50"
                  >
                    {approvalLoading ? "SAVING..." : "REJECT"}
                  </button>
                </div>

                {approvalError && (
                  <p className="mt-2 text-[9px] text-red-400">
                    {approvalError}
                  </p>
                )}
              </div>
            )}

            {decision === "APPROVED" && (
              <div className="rounded border border-green-900 bg-green-950/20 p-3">
                <p className="text-[10px] font-bold text-green-400">
                  FINDING APPROVED
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-slate-400">
                  Engineer accepted the AI investigation for this incident.
                </p>
              </div>
            )}

            {decision === "REJECTED" && (
              <div className="rounded border border-red-900 bg-red-950/20 p-3">
                <p className="text-[10px] font-bold text-red-400">
                  FINDING REJECTED
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-slate-400">
                  AI finding requires further investigation or correction.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
