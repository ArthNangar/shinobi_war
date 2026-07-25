'use client';

import React from 'react';
import { Jutsu } from '@/types/shinobi';
import { HAND_SEALS_REFERENCE_DATA } from '@/lib/game/handSignData';
import { Clock, Check, Flame, Shield, Sparkles, ChevronRight, Play } from 'lucide-react';
import { HandSignIllustration } from './HandSignIllustration';
import { HandSignReferenceImage } from './HandSignReferenceImage';

interface JutsuComboCardProps {
  jutsu: Jutsu;
  currentStepIndex: number;
  stepHoldProgress: number; // 0 to 100%
  timeLeftMs: number;
  timerProgress: number; // 0 to 100%
  isTimerRunning: boolean;
  onManualAdvance?: () => void;
  onResetCombo?: () => void;
}

export const JutsuComboCard: React.FC<JutsuComboCardProps> = ({
  jutsu,
  currentStepIndex,
  stepHoldProgress,
  timeLeftMs,
  timerProgress,
  isTimerRunning,
  onManualAdvance,
  onResetCombo,
}) => {
  const isLastStep = currentStepIndex === jutsu.sequence.length - 1;

  return (
    <div className="ninja-glass p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between space-y-4 h-full min-h-[420px]">
      {/* Top Header: Jutsu Name, Element & Details */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl border shadow-lg shrink-0"
              style={{
                backgroundColor: `${jutsu.color}20`,
                borderColor: jutsu.color,
                boxShadow: `0 0 20px ${jutsu.color}40`,
              }}
            >
              {jutsu.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${jutsu.color}30`, color: jutsu.color }}
                >
                  {jutsu.element} STYLE
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {jutsu.sequence.length} STEPS
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black font-cinzel text-amber-200 tracking-wide">
                {jutsu.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono italic">
                {jutsu.japaneseName}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-bold text-amber-400 font-tech">
              ⚡ {jutsu.damage} DMG
            </div>
            <div className="text-[10px] text-cyan-300 font-mono">
              💧 {jutsu.chakraCost} Chakra
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-tech leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          {jutsu.description}
        </p>
      </div>

      {/* CURRENT ACTIVE SIGN REQUIRED HERO BANNER */}
      {(() => {
        const activeSealType = jutsu.sequence[Math.min(currentStepIndex, jutsu.sequence.length - 1)];
        const activeSealData = HAND_SEALS_REFERENCE_DATA[activeSealType];

        return (
          <div className="relative w-full rounded-2xl bg-slate-950/90 border border-amber-400/50 p-3.5 overflow-hidden flex items-center gap-4 shadow-[0_0_20px_rgba(251,191,36,0.15)] group">
            <div className="absolute inset-0 scanline-bg opacity-20 pointer-events-none" />

            {/* OFFICIAL ANIME REFERENCE IMAGE + SKELETON DIAGRAM */}
            <div className="relative shrink-0 flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-amber-400/60 shadow-lg">
              <HandSignReferenceImage
                sealType={activeSealType}
                className="w-16 h-16 rounded-lg border border-amber-400/40"
              />
              <div className="shrink-0 hidden sm:block">
                <HandSignIllustration
                  sealType={activeSealType}
                  color={activeSealData?.color || '#FFB703'}
                  size="md"
                />
              </div>
            </div>

            {/* NAME & EXECUTION INSTRUCTIONS ALONGSIDE IMAGE */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  NEXT SIGN NEEDED (STEP {Math.min(currentStepIndex + 1, jutsu.sequence.length)}/{jutsu.sequence.length})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-cyan-300">
                  Key [{activeSealData?.keyShortcut}]
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-cinzel text-slate-100 truncate">
                  {activeSealData?.name || activeSealType} Seal
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {activeSealData?.symbol}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 font-tech line-clamp-2 leading-snug">
                {activeSealData?.primaryFingers}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Required Sequence Progression Array */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold font-tech text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            REQUIRED SIGN SEQUENCE ARRAY:
          </span>
          <span className="text-cyan-400 font-mono">
            STEP {Math.min(currentStepIndex + 1, jutsu.sequence.length)} OF {jutsu.sequence.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {jutsu.sequence.map((sealType, idx) => {
            const sealData = HAND_SEALS_REFERENCE_DATA[sealType];
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div
                key={`${sealType}-${idx}`}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 relative overflow-hidden ${
                  isCompleted
                    ? 'bg-emerald-950/80 border-emerald-400/80 text-emerald-200 shadow-md shadow-emerald-500/20'
                    : isActive
                    ? 'bg-slate-900 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02]'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                {/* Step Counter Badge */}
                <div
                  className={`w-5 h-5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-black'
                      : isActive
                      ? 'bg-amber-400 text-black animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </div>

                {/* OFFICIAL HAND SIGN IMAGE CROPPED THUMBNAIL */}
                <div className="shrink-0 flex items-center gap-1">
                  <HandSignReferenceImage
                    sealType={sealType}
                    className="w-8 h-8 rounded border border-slate-700/80"
                  />
                </div>

                {/* Sign Name & Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-cinzel truncate">
                      {sealData?.name || sealType}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{sealData?.symbol}</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {isActive ? 'FORM NOW' : isCompleted ? 'DONE' : 'WAITING'}
                  </div>
                </div>

                {/* Step Hold Progress Bar overlay for active step */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-75"
                      style={{ width: `${stepHoldProgress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Sequence Countdown Timer Bar */}
      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
            <span className="font-tech font-bold">5.0s Sequence Timer Window:</span>
          </div>
          <span
            className={`font-bold ${
              timerProgress < 30 ? 'text-red-400 animate-pulse' : timerProgress < 60 ? 'text-amber-300' : 'text-cyan-300'
            }`}
          >
            {(timeLeftMs / 1000).toFixed(1)}s / 5.0s
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              timerProgress < 30
                ? 'bg-gradient-to-r from-red-600 to-amber-500'
                : timerProgress < 60
                ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      </div>

      {/* Manual Step Advance Controls (for testing or simulated mode) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={onResetCombo}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold transition border border-slate-800"
        >
          Reset Sequence
        </button>

        {onManualAdvance && (
          <button
            onClick={onManualAdvance}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black font-black text-xs transition shadow-md flex items-center gap-1.5"
            title="Manual step trigger for simulation testing"
          >
            <span>Manual Step Advance</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
