'use client';

import React from 'react';
import { Jutsu } from '@/types/shinobi';
import { CheckCircle, Zap, ShieldAlert } from 'lucide-react';

interface JutsuComboSelectorProps {
  selectedJutsuId: string;
  completedJutsus: Set<string>;
  onSelectJutsu: (jutsu: Jutsu) => void;
  jutsusList: Jutsu[];
}

export const JutsuComboSelector: React.FC<JutsuComboSelectorProps> = ({
  selectedJutsuId,
  completedJutsus,
  onSelectJutsu,
  jutsusList,
}) => {
  return (
    <div className="w-full ninja-glass p-3 md:p-4 rounded-2xl border border-cyan-500/30 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <h2 className="text-xs md:text-sm font-bold font-cinzel text-amber-200 tracking-wider uppercase">
            JUTSU COMBO LIBRARY — PRACTICE & WEAVE
          </h2>
        </div>
        <div className="text-[11px] font-tech text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
          {completedJutsus.size} / {jutsusList.length} Combos Unlocked
        </div>
      </div>

      {/* Scrollable / Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
        {jutsusList.map((jutsu) => {
          const isSelected = jutsu.id === selectedJutsuId;
          const isCompleted = completedJutsus.has(jutsu.id);

          return (
            <button
              key={jutsu.id}
              onClick={() => onSelectJutsu(jutsu)}
              className={`relative p-2.5 rounded-xl transition-all duration-200 text-left flex flex-col justify-between min-h-[90px] border group ${
                isSelected
                  ? 'bg-slate-900 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02]'
                  : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Icon & Status */}
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {jutsu.icon}
                </span>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase"
                    style={{ backgroundColor: `${jutsu.color}20`, color: jutsu.color }}
                  >
                    {jutsu.element}
                  </span>
                )}
              </div>

              {/* Bottom Info */}
              <div className="mt-1 space-y-0.5">
                <h3
                  className={`text-xs font-bold truncate font-cinzel ${
                    isSelected ? 'text-amber-200' : 'text-slate-200'
                  }`}
                >
                  {jutsu.name}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{jutsu.sequence.length} Signs</span>
                  <span>{jutsu.damage} DMG</span>
                </div>
              </div>

              {/* Selected Bottom Glow Line */}
              {isSelected && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: jutsu.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
