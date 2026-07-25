'use client';

import React from 'react';
import { JUTSU_LIBRARY, HAND_SEALS } from '@/hooks/useHandSignSequence';
import { X, Flame, Zap, Droplets, Wind, Shield, Sparkles } from 'lucide-react';
import { SealType } from '@/types/shinobi';

interface JutsuLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJutsuSequence?: (sequence: SealType[]) => void;
}

export const JutsuLibraryModal: React.FC<JutsuLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectJutsuSequence,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] ninja-glass rounded-3xl border border-cyan-500/40 p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl md:text-2xl font-black text-cyan-200 font-cinzel tracking-wide">
              Ninjutsu Scroll Library
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {JUTSU_LIBRARY.map((jutsu) => (
            <div
              key={jutsu.id}
              className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 hover:border-cyan-500/50 transition flex flex-col space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {jutsu.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 font-cinzel">
                      {jutsu.name}
                    </h3>
                    <span className="text-xs font-semibold text-cyan-400 font-tech">
                      {jutsu.japaneseName} • Element: {jutsu.element}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-red-400 font-mono">
                    DMG: {jutsu.damage}
                  </div>
                  <div className="text-xs font-bold text-cyan-400 font-mono">
                    Chakra: {jutsu.chakraCost}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {jutsu.description}
              </p>

              {/* Hand Seal Combo Path */}
              <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Required Seals:</span>
                {jutsu.sequence.map((sealType, idx) => {
                  const seal = HAND_SEALS[sealType];
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span>{seal.symbol}</span>
                        <span>{seal.name}</span>
                      </span>
                      {idx < jutsu.sequence.length - 1 && (
                        <span className="text-cyan-500 font-bold text-xs">→</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Auto-Fill Test Button */}
              {onSelectJutsuSequence && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectJutsuSequence(jutsu.sequence);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1"
                  >
                    Weave This Combo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
