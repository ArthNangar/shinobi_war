'use client';

import React from 'react';
import { Jutsu } from '@/types/shinobi';
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';

interface JutsuClashOverlayProps {
  activeJutsu: Jutsu | null;
  winner: string | null;
  onResetMatch: () => void;
}

export const JutsuClashOverlay: React.FC<JutsuClashOverlayProps> = ({
  activeJutsu,
  winner,
  onResetMatch,
}) => {
  if (winner) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-28 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-amber-300 font-cinzel tracking-wider uppercase drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
          VICTORY!
        </h1>
        <p className="text-lg text-slate-200 mt-2 font-tech max-w-md">
          <span className="text-amber-400 font-bold">{winner}</span> has prevailed in the hand sign battle arena!
        </p>
        <button
          onClick={onResetMatch}
          className="mt-6 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm uppercase tracking-widest transition shadow-xl shadow-amber-500/30 flex items-center gap-2 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" /> Start Rematch
        </button>
      </div>
    );
  }

  if (activeJutsu) {
    return (
      <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center p-4">
        <div className="px-8 py-4 rounded-3xl bg-slate-950/90 border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,242,254,0.6)] backdrop-blur-md flex flex-col items-center space-y-2 animate-bounce">
          <div className="text-5xl animate-pulse">{activeJutsu.icon}</div>
          <h2 className="text-xl md:text-3xl font-black text-cyan-200 font-cinzel tracking-wider uppercase text-center">
            {activeJutsu.name}
          </h2>
          <p className="text-xs md:text-sm font-bold text-amber-300 font-tech">
            {activeJutsu.japaneseName} • {activeJutsu.damage} DAMAGE
          </p>
        </div>
      </div>
    );
  }

  return null;
};
