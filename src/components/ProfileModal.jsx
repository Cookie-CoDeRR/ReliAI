import React from 'react';
import {
  User,
  X,
  ShieldCheck,
  Building,
  Mail,
  Award,
  Radio,
  Clock,
  KeyRound,
  LogOut
} from 'lucide-react';
import { logoutUser } from '../services/firebase';

export default function ProfileModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Alex Morgan";
  const displayEmail = user?.email || "alex.morgan@reliai.io";
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Sign out triggered:", err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/90 rounded-[20px] shadow-2xl overflow-hidden z-10 text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Banner Header */}
        <div className="h-24 bg-gradient-to-r from-[#d98555] via-[#e8905b] to-[#f5b896] p-4 flex justify-between items-start relative">
          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-white border border-white/40 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Certified Operator Profile
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Content */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar Pill overlapping banner */}
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#c8764b] to-[#e89568] text-white flex items-center justify-center text-2xl font-bold font-heading border-4 border-white shadow-md">
                {initials}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-300/50" />
            </div>

            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
              ● ACTIVE ON-DUTY
            </span>
          </div>

          {/* Name & Role */}
          <div className="mb-4">
            <h2 className="text-xl font-bold font-heading text-slate-900 leading-tight">
              {displayName}
            </h2>
            <p className="text-xs font-mono text-[#c8764b] font-semibold mt-0.5">
              Lead Systems Engineer & Automation Specialist
            </p>
          </div>

          {/* Detailed Info Grid */}
          <div className="space-y-2.5 text-xs font-mono">
            
            {/* Organization */}
            <div className="p-2.5 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <Building className="w-4 h-4 text-[#d98555] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-400 block uppercase">Organization</span>
                <span className="font-semibold text-slate-800 truncate block">
                  ReliAI Autonomous Robotics Division
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="p-2.5 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#d98555] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-400 block uppercase">Account Email</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {displayEmail}
                </span>
              </div>
            </div>

            {/* Station / Access Level */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-[12px] bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] text-slate-400 block uppercase flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#d98555]" /> Assigned Station
                </span>
                <span className="font-bold text-slate-800 text-[10.5px] mt-0.5 block truncate">
                  STATION-TIRE-01
                </span>
              </div>

              <div className="p-2.5 rounded-[12px] bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] text-slate-400 block uppercase flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-[#d98555]" /> Security Level
                </span>
                <span className="font-bold text-slate-800 text-[10.5px] mt-0.5 block truncate">
                  Level 4 Admin
                </span>
              </div>
            </div>

            {/* Shift & Compliance */}
            <div className="p-2.5 rounded-[12px] bg-[#faeee5] border border-[#efc4ab] flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-[#d98555]" /> Shift: Morning (08:00 - 16:00 UTC)
              </span>
              <span className="font-bold text-[#c8764b]">ISO-10218 Verified</span>
            </div>

          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-[8px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{user ? "Sign Out" : "End Session"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-[8px] bg-[#d98555] hover:bg-[#c8764b] text-white text-xs font-mono font-bold transition cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
