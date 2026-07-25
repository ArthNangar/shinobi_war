'use client';

import React from 'react';
import { SequenceItem, SealType, Jutsu } from '@/types/shinobi';
import { SealBadge } from './SealBadge';
import { HAND_SEALS } from '@/hooks/useHandSignSequence';
import { Trash2, BookOpen, Sparkles, Flame } from 'lucide-react';

interface SequenceBarProps {
  sequence: SequenceItem[];
  matchedJutsu: Jutsu | null;
  onAddSeal: (sealType: SealType) => void;
  onClearSequence: () => void;
  onOpenJutsuLibrary: () => void;
}

export const SequenceBar: React.FC<SequenceBarProps> = React.memo(({
  sequence,
  matchedJutsu,
  onAddSeal,
  onClearSequence,
  onOpenJutsuLibrary,
}) => {
  const allSealTypes = Object.keys(HAND_SEALS) as SealType[];

  return (
    <div className="w-full ninja-glass rounded-2xl p-4 md:p-5 border border-cyan-500/30 shadow-2xl space-y-4 relative">
      {/* Sequence Display Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-sm md:text-base font-extrabold text-cyan-200 uppercase tracking-widest font-cinzel">
            Hand Seal Sequence ({sequence.length}/8)
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJutsuLibrary}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-purple-400" /> Jutsu Library
          </button>

          {sequence.length > 0 && (
            <button
              onClick={onClearSequence}
              className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-red-400" /> Clear Seals
            </button>
          )}
        </div>
      </div>

      {/* Queued Hand Signs Display Row */}
      <div className="min-h-[88px] w-full p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center gap-2 md:gap-3 overflow-x-auto relative">
        {sequence.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-2 text-slate-500 text-xs font-semibold space-y-1">
            <span className="text-base">🥷</span>
            <span>Weave hand signs using camera or selector bar below to construct Ninjutsu!</span>
          </div>
        ) : (
          sequence.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 shrink-0 animate-scale-in">
              <SealBadge sealType={item.type} index={idx} isActive={true} />
              {idx < sequence.length - 1 && (
                <span className="text-cyan-500 font-bold text-sm">→</span>
              )}
            </div>
          ))
        )}

        {/* Matched Jutsu Notification Banner */}
        {matchedJutsu && (
          <div className="absolute right-3 top-2 bottom-2 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl animate-bounce">
            <Flame className="w-5 h-5 text-amber-200" />
            <span>JUTSU READY: {matchedJutsu.name}!</span>
          </div>
        )}
      </div>

      {/* Quick 12 Zodiac Seals Selector Bar */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-tech">
          Zodiac Hand Seal Palette (Click or use Keyboard Keys [1-9, Q, W, E]):
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {allSealTypes.map((sealType) => (
            <SealBadge
              key={sealType}
              sealType={sealType}
              onClick={() => onAddSeal(sealType)}
              showKeyHint={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

SequenceBar.displayName = 'SequenceBar';
