import React from 'react';
import {
  Factory,
  Cpu,
  User,
  Settings,
  ChevronRight
} from 'lucide-react';

export default function AccountControlPanel({
  user,
  onOpenProfile,
  onOpenSettings,
  sector = "Automotive Manufacturing",
  connectedMachinesCount = 12,
  technicalLeads = ["Alex Morgan", "Priya Sharma"]
}) {
  return (
    <div className="w-full flex flex-col select-none text-slate-800 space-y-3">
      {/* ============================================================ */}
      {/* 1. SITE / MACHINE CONTEXT (Informational Only - Non-Clickable) */}
      {/* ============================================================ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[9.5px] font-mono uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
            <Factory className="w-3 h-3 text-[#d98555]" />
            Site / Machine
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[8px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Sector */}
        <div className="text-[10.5px]">
          <div className="font-mono text-slate-400 text-[8.5px] uppercase tracking-wider">Sector</div>
          <div className="font-semibold text-slate-800 font-heading truncate leading-tight mt-0.5">
            {sector}
          </div>
        </div>

        {/* Connected Machines */}
        <div className="flex items-center justify-between text-[10.5px]">
          <span className="font-mono text-slate-500 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#d98555]" /> Machines
          </span>
          <span className="font-mono font-bold text-[#c8764b] bg-[#faeee5] px-1.5 py-0.5 rounded border border-[#efc4ab] text-[9.5px]">
            {connectedMachinesCount} Connected
          </span>
        </div>

        {/* Technical Leads */}
        <div className="space-y-1">
          <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Technical Leads
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {technicalLeads.map((lead, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100/90 border border-slate-200/80 text-[9px] font-mono text-slate-700 font-medium"
              >
                <span className="w-1 h-1 rounded-full bg-[#d98555]" />
                {lead}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ACTIONABLE ACCOUNT OPTIONS (EXACTLY TWO BUTTONS)           */}
      {/* ============================================================ */}
      <div className="pt-2 border-t border-slate-200/80 space-y-1">
        {/* PROFILE ACTION BUTTON */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-full text-left text-[12.5px] sm:text-[13.5px] font-mono font-medium text-slate-700 hover:text-[#c8764b] hover:bg-[#faeee5]/80 rounded-lg px-2 py-1.5 transition cursor-pointer flex items-center justify-between group focus:outline-none focus:ring-1 focus:ring-[#d98555]/30"
          title="Open User Profile"
        >
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-[#d98555] group-hover:scale-110 transition shrink-0" />
            <span className="truncate">Profile</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#c8764b] group-hover:translate-x-0.5 transition shrink-0" />
        </button>

        {/* SETTINGS ACTION BUTTON */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full text-left text-[12.5px] sm:text-[13.5px] font-mono font-medium text-slate-700 hover:text-[#c8764b] hover:bg-[#faeee5]/80 rounded-lg px-2 py-1.5 transition cursor-pointer flex items-center justify-between group focus:outline-none focus:ring-1 focus:ring-[#d98555]/30"
          title="Open Application Settings"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#c8764b] group-hover:rotate-45 transition shrink-0" />
            <span className="truncate">Settings</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#c8764b] group-hover:translate-x-0.5 transition shrink-0" />
        </button>
      </div>
    </div>
  );
}
