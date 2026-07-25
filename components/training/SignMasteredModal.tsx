'use client';

import React from 'react';
import { SealType } from '@/types/shinobi';
import { HAND_SEALS_REFERENCE_DATA } from '@/lib/game/handSignData';
import { Award, ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';

interface SignMasteredModalProps {
  masteredSign: SealType | null;
  onDismiss: () => void;
  onNextSign: () => void;
}

export const SignMasteredModal: React.FC<SignMasteredModalProps> = ({
  masteredSign,
  onDismiss,
  onNextSign,
}) => {
  if (!masteredSign) return null;

  const sealData = HAND_SEALS_REFERENCE_DATA[masteredSign];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl ninja-glass border-2 border-emerald-400 p-6 shadow-2xl shadow-emerald-500/40 text-center space-y-5 relative overflow-hidden">
        {/* Background Chakra Burst */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Badge Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-300 border-2 border-emerald-200 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/50 transform animate-bounce">
          {sealData.symbol}
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-black border border-emerald-400 text-emerald-300 flex items-center justify-center text-xs">
            ✓
          </div>
        </div>

        {/* Title */}
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
            MASTER SHINOBI ACHIEVEMENT
          </span>
          <h2 className="text-2xl font-black font-cinzel text-slate-100 mt-1">
            SIGN MASTERED!
          </h2>
          <p className="text-sm text-emerald-300 font-tech mt-1">
            You successfully maintained the <strong className="text-white">{sealData.name} ({sealData.kanji})</strong> seal for a full 2.0 seconds!
          </p>
        </div>

        {/* EXP Reward Card */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-around text-xs font-mono text-slate-200">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Mastery EXP: <strong className="text-emerald-300">+100 PTS</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>Form Accuracy: <strong className="text-cyan-300">100%</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={() => {
              onDismiss();
              onNextSign();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2"
          >
            <span>Practice Next Sign</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onDismiss}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Stay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
