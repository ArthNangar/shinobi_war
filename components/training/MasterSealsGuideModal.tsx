'use client';

import React from 'react';
import { SealType } from '@/types/shinobi';
import { SEAL_GRID_MAPPING } from './HandSignReferenceImage';
import { X, Sparkles, Check, Target } from 'lucide-react';

interface MasterSealsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeal: SealType;
  onSelectSeal: (seal: SealType) => void;
  masteredSigns: Set<SealType>;
}

export const MasterSealsGuideModal: React.FC<MasterSealsGuideModalProps> = ({
  isOpen,
  onClose,
  selectedSeal,
  onSelectSeal,
  masteredSigns,
}) => {
  if (!isOpen) return null;

  const sealList = Object.keys(SEAL_GRID_MAPPING) as SealType[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl ninja-glass rounded-3xl border border-cyan-500/40 p-5 md:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black font-cinzel text-slate-100 tracking-wide flex items-center gap-2">
                Official Shinobi Hand Seals Tutorial Guide
              </h2>
              <p className="text-xs text-slate-400 font-tech">
                Click any hand seal on the chart to select and practice it live with webcam AI tracking.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Chart Container with Overlay Hotspots */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl bg-black">
          <img
            src="/hand-seals-reference.png"
            alt="Official Shinobi Hand Seals Reference Guide"
            className="w-full h-full object-cover"
          />

          {/* Grid Overlay Hotspots */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1 p-1">
            {sealList.map((sealKey) => {
              const info = SEAL_GRID_MAPPING[sealKey];
              const isSelected = selectedSeal === sealKey;
              const isMastered = masteredSigns.has(sealKey);

              return (
                <button
                  key={sealKey}
                  onClick={() => {
                    onSelectSeal(sealKey);
                    onClose();
                  }}
                  className={`relative group rounded-xl transition-all duration-200 flex flex-col justify-between p-2 text-left overflow-hidden border ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.5)] scale-[0.98]'
                      : 'bg-black/10 border-transparent hover:bg-cyan-950/40 hover:border-cyan-500/60'
                  }`}
                >
                  {/* Top Bar Status Badges */}
                  <div className="flex items-center justify-between w-full pointer-events-none">
                    <span
                      className={`text-[11px] font-black font-cinzel tracking-wider px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-cyan-400 text-black shadow-md'
                          : 'bg-black/70 text-slate-200 border border-slate-700/80 group-hover:border-cyan-500/60'
                      }`}
                    >
                      {info.name}
                    </span>

                    {isMastered && (
                      <span className="p-1 rounded-full bg-emerald-500/90 text-black shadow-lg">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Bottom Practice Hint */}
                  <div className="w-full flex justify-end pointer-events-none">
                    <span className="text-[10px] font-mono font-bold text-cyan-300/0 group-hover:text-cyan-300 transition-opacity bg-black/80 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                      <Target className="w-3 h-3 text-cyan-400" /> Practice
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-4 h-4" /> 12 Official Shinobi Hand Signs
          </span>
          <span className="text-slate-500">
            Select a sign to practice holding it for 1.5 seconds in webcam view.
          </span>
        </div>
      </div>
    </div>
  );
};
