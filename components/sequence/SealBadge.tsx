'use client';

import React from 'react';
import { SealType } from '@/types/shinobi';
import { HAND_SEALS } from '@/hooks/useHandSignSequence';

interface SealBadgeProps {
  sealType: SealType;
  index?: number;
  isActive?: boolean;
  accuracy?: number;
  onClick?: () => void;
  showKeyHint?: boolean;
}

export const SealBadge: React.FC<SealBadgeProps> = ({
  sealType,
  index = 0,
  isActive = false,
  accuracy = 0.95,
  onClick,
  showKeyHint = false,
}) => {
  const seal = HAND_SEALS[sealType] || HAND_SEALS.TIGER;

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 active:scale-90 ${
        isActive
          ? 'bg-slate-900/90 border-cyan-400 scale-105 shadow-xl shadow-cyan-500/40'
          : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90'
      }`}
      style={{
        borderColor: isActive ? seal.color : undefined,
      }}
    >
      {/* Glow Aura */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
        style={{ backgroundColor: seal.color }}
      />

      {/* Symbol */}
      <div className="flex items-center justify-center">
        <span className="text-xl md:text-2xl">{seal.symbol}</span>
      </div>

      {/* Seal Name */}
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200 mt-1">
        {seal.name}
      </span>

      {/* Key Hint Badge */}
      {showKeyHint && (
        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-mono font-bold text-slate-300">
          [{seal.keyShortcut}]
        </span>
      )}
    </button>
  );
};
