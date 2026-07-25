'use client';

import React from 'react';
import { SealType } from '@/types/shinobi';
import { HAND_SEALS_REFERENCE_DATA } from '@/lib/game/handSignData';
import { CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { HandSignReferenceImage } from './HandSignReferenceImage';

interface HandSignSelectorProps {
  selectedSignKey: SealType;
  masteredSigns: Set<SealType>;
  onSelectSign: (seal: SealType) => void;
  onOpenMasterGuide?: () => void;
}

export const HandSignSelector: React.FC<HandSignSelectorProps> = ({
  selectedSignKey,
  masteredSigns,
  onSelectSign,
  onOpenMasterGuide,
}) => {
  const sealsList = Object.values(HAND_SEALS_REFERENCE_DATA);
  const masteredCount = masteredSigns.size;

  return (
    <div className="w-full ninja-glass rounded-2xl p-4 border border-cyan-500/20 flex flex-col space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200 font-tech">
            12 Zodiac Seals Training Library
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMasterGuide && (
            <button
              onClick={onOpenMasterGuide}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs font-cinzel tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Tutorial Chart</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong className="text-white">{masteredCount}</strong> / 12 Mastered
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 12 Hand Signs */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {sealsList.map((seal) => {
          const isSelected = seal.type === selectedSignKey;
          const isMastered = masteredSigns.has(seal.type);

          return (
            <button
              key={seal.type}
              onClick={() => onSelectSign(seal.type)}
              className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all duration-200 group text-left ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.03] z-10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-900/50'
              }`}
            >
              {/* Mastered Badge */}
              {isMastered && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border border-emerald-200 flex items-center justify-center text-black text-[10px] font-bold shadow-md shadow-emerald-500/50 z-20"
                  title="Sign Mastered!"
                >
                  ✓
                </div>
              )}

              {/* Reference Image Thumbnail & Emoji */}
              <div className="flex items-center justify-between w-full gap-1">
                <HandSignReferenceImage
                  sealType={seal.type}
                  className="w-12 h-12 rounded-lg"
                />
                <span className="text-lg">{seal.symbol}</span>
              </div>

              {/* Name */}
              <div className="mt-1.5 w-full">
                <p className={`text-xs font-bold truncate ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                  {seal.name}
                </p>
                <div className="flex items-center justify-between mt-0.5 text-[9px] text-slate-400 font-mono">
                  <span>Key [{seal.keyShortcut}]</span>
                  <span className="opacity-75">{seal.elementAffinity}</span>
                </div>
              </div>

              {/* Active Selection Glow Ring */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/60 pointer-events-none animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
