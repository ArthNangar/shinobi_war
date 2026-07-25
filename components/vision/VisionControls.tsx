'use client';

import React from 'react';
import { Flame, Zap, Shield, Sparkles } from 'lucide-react';
import { SealType } from '@/types/shinobi';

interface VisionControlsProps {
  onTriggerSeal: (type: SealType) => void;
  onChargeChakra: () => void;
}

export const VisionControls: React.FC<VisionControlsProps> = ({
  onTriggerSeal,
  onChargeChakra,
}) => {
  return (
    <div className="w-full p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
        <span className="text-xs font-semibold text-slate-300">Quick Practice Controls:</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onChargeChakra}
          className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" /> Focus Chakra (+25)
        </button>

        <button
          onClick={() => onTriggerSeal('RAM')}
          className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
        >
          <Shield className="w-3.5 h-3.5 text-purple-400" /> Weave Ram
        </button>

        <button
          onClick={() => onTriggerSeal('TIGER')}
          className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
        >
          <Flame className="w-3.5 h-3.5 text-red-400" /> Weave Tiger
        </button>
      </div>
    </div>
  );
};
