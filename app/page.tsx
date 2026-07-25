'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Flame, Sparkles, User, Shield, Scroll, CheckCircle2 } from 'lucide-react';

export default function ShinobiLandingPage() {
  const router = useRouter();
  const [shinobiName, setShinobiName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill input if a Shinobi Name was previously saved in sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingName = sessionStorage.getItem('shinobiName') || sessionStorage.getItem('shinobi_name');
      if (existingName) {
        setShinobiName(existingName);
      }
    }
  }, []);

  const isValid = shinobiName.trim().length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    const cleanedName = shinobiName.trim();

    // Persist to sessionStorage
    sessionStorage.setItem('shinobiName', cleanedName);
    sessionStorage.setItem('shinobi_name', cleanedName);

    // Programmatically navigate to /arena
    router.push('/arena');
  };

  return (
    <main className="min-h-screen w-full bg-[#060913] text-slate-100 font-sans relative overflow-hidden flex flex-col items-center justify-center p-4 selection:bg-red-500 selection:text-white">
      {/* Dynamic Background Glowing Mesh & Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(220,38,38,0.15),_transparent_60%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(245,158,11,0.08),_transparent_50%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(6,182,212,0.08),_transparent_50%)] pointer-events-none z-0" />

      {/* Subtle Ambient Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16vw] font-black text-slate-900/40 select-none pointer-events-none z-0 tracking-widest font-mono blur-[1px] uppercase">
        SHINOBI
      </div>

      {/* Main Centered Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center space-y-6">
        {/* Emblem / Badge */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 opacity-75 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0c1222] to-slate-950 border border-amber-500/40 shadow-2xl flex items-center justify-center text-4xl">
            🔥
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-mono font-semibold tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Hand Sign Battle League</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-cinzel tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-red-400 to-amber-100 drop-shadow-[0_4px_24px_rgba(220,38,38,0.4)]">
            SHINOBI SEALS
          </h1>

          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Weave authentic hand signs, unleash legendary Ninjutsu, and conquer rivals in real-time.
          </p>
        </div>

        {/* Glassmorphism Input Form Card */}
        <div className="w-full bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Top Edge Glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="shinobiName" className="block text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Shinobi Identity
                </span>
                <span className={`text-[10px] font-normal font-sans transition-colors ${isValid ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  {shinobiName.trim().length}/3 chars min
                </span>
              </label>

              <div className="relative group">
                <input
                  id="shinobiName"
                  type="text"
                  value={shinobiName}
                  onChange={(e) => setShinobiName(e.target.value)}
                  placeholder="e.g. Uzumaki, Kakashi, Sasuke"
                  maxLength={24}
                  autoComplete="off"
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 shadow-inner group-hover:border-slate-600"
                />

                {isValid && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider font-cinzel transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden shadow-lg ${
                isValid && !isSubmitting
                  ? 'bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:via-amber-500 hover:to-red-500 text-white shadow-red-900/40 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-amber-400/30'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span>Entering Arena...</span>
                </>
              ) : (
                <>
                  <Swords className={`w-4 h-4 transition-transform duration-300 ${isValid ? 'group-hover:rotate-12 text-amber-200' : ''}`} />
                  <span>Enter Arena</span>
                </>
              )}
            </button>
          </form>

          {/* Card Footer Hint */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3 h-3 text-cyan-400" /> WebRTC PvP Active
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Scroll className="w-3 h-3 text-amber-400" /> AI Vision Hand Tracking
            </span>
          </div>
        </div>

        {/* Footer Subtext */}
        <p className="text-[11px] text-slate-500 text-center font-mono">
          Shinobi Seals &copy; {new Date().getFullYear()} • Powered by MediaPipe & WebRTC
        </p>
      </div>
    </main>
  );
}
