'use client';

import React from 'react';
import { WebcamCanvasOverlay } from '@/components/vision/WebcamCanvasOverlay';
import { SealType, Jutsu } from '@/types/shinobi';
import { HAND_SEALS_REFERENCE_DATA } from '@/lib/game/handSignData';
import { PredictionResult } from '@/lib/vision';
import { Eye, CheckCircle2, Zap, Clock, Sparkles, Flame, ShieldAlert } from 'lucide-react';

import { HandSignReferenceImage } from './HandSignReferenceImage';

interface JutsuComboCameraOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  cameraError: string | null;
  fps: number;
  isSimulatedMode: boolean;
  onToggleCamera: () => void;
  selectedJutsu: Jutsu;
  currentStepIndex: number;
  stepHoldProgress: number; // 0 to 100%
  timeLeftMs: number;
  timerProgress: number; // 0 to 100%
  isTimerRunning: boolean;
  latestPrediction: PredictionResult;
  comboSuccessJutsu: Jutsu | null;
}

export const JutsuComboCameraOverlay: React.FC<JutsuComboCameraOverlayProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  cameraError,
  fps,
  isSimulatedMode,
  onToggleCamera,
  selectedJutsu,
  currentStepIndex,
  stepHoldProgress,
  timeLeftMs,
  timerProgress,
  isTimerRunning,
  latestPrediction,
  comboSuccessJutsu,
}) => {
  const currentLabel = latestPrediction?.label || 'None';
  const currentConfidence = latestPrediction?.confidence || 0;

  const targetSeal = selectedJutsu.sequence[currentStepIndex] || selectedJutsu.sequence[0];
  const targetSealData = HAND_SEALS_REFERENCE_DATA[targetSeal];

  // Match logic helper
  const normLabel = currentLabel.toUpperCase();
  const isMatch =
    normLabel === targetSeal.toUpperCase() ||
    (normLabel === 'SNAKE' && targetSeal === 'SERPENT') ||
    (normLabel === 'RABBIT' && targetSeal === 'HARE');

  return (
    <div
      className={`relative w-full h-full min-h-[380px] max-h-[520px] rounded-2xl overflow-hidden transition-all duration-300 ${
        comboSuccessJutsu
          ? 'border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.9)] animate-screen-shake'
          : isMatch && stepHoldProgress > 0
          ? 'border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
          : 'border border-cyan-500/30 shadow-2xl'
      }`}
    >
      {/* Base Camera & Landmark Canvas */}
      <WebcamCanvasOverlay
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCameraActive={isCameraActive}
        cameraError={cameraError}
        fps={fps}
        isSimulatedMode={isSimulatedMode}
        onToggleCamera={onToggleCamera}
        playerLabel={`JUTSU PRACTICE: ${selectedJutsu.name.toUpperCase()}`}
      />

      {/* DYNAMIC FULL-SCREEN ELEMENTAL ATTACK ANIMATION OVERLAY */}
      {comboSuccessJutsu && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs pointer-events-none flex flex-col items-center justify-center overflow-hidden">
          {/* Element-specific visual attack graphics */}
          {comboSuccessJutsu.element === 'Fire' && (
            <div className="absolute inset-0 flex items-center justify-center animate-fireball">
              <div className="w-64 h-64 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 blur-md shadow-[0_0_100px_#ff2e63] flex items-center justify-center text-7xl animate-spin-slow">
                🔥
              </div>
            </div>
          )}

          {comboSuccessJutsu.element === 'Water' && (
            <div className="absolute inset-0 flex items-center justify-center animate-water-dragon">
              <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-500 to-teal-300 blur-md shadow-[0_0_100px_#00f2fe] flex items-center justify-center text-8xl">
                🌊
              </div>
            </div>
          )}

          {comboSuccessJutsu.element === 'Lightning' && (
            <div className="absolute inset-0 flex items-center justify-center animate-chidori">
              <div className="w-64 h-64 rounded-full bg-gradient-to-r from-yellow-300 via-cyan-400 to-blue-600 blur-md shadow-[0_0_100px_#ffb703] flex items-center justify-center text-7xl">
                ⚡
              </div>
            </div>
          )}

          {comboSuccessJutsu.element === 'Wind' && (
            <div className="absolute inset-0 flex items-center justify-center animate-gale-palm">
              <div className="w-72 h-72 rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-300 blur-md shadow-[0_0_90px_#2ec4b6] flex items-center justify-center text-8xl">
                🌪️
              </div>
            </div>
          )}

          {comboSuccessJutsu.element === 'Earth' && (
            <div className="absolute inset-0 flex items-center justify-center animate-mud-wall">
              <div className="w-80 h-64 rounded-2xl bg-gradient-to-t from-stone-800 via-amber-900 to-stone-600 border-4 border-amber-600 shadow-[0_0_80px_#8d99ae] flex items-center justify-center text-8xl">
                🧱
              </div>
            </div>
          )}

          {(comboSuccessJutsu.element === 'Secret' || comboSuccessJutsu.soundType === 'clone') && (
            <div className="absolute inset-0 flex items-center justify-center animate-clone-smoke">
              <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-300 blur-lg shadow-[0_0_100px_#ffb703] flex items-center justify-center text-8xl">
                👥
              </div>
            </div>
          )}

          {/* Celebratory Banner Card */}
          <div className="relative z-10 p-6 rounded-3xl bg-slate-950/90 border-2 border-amber-400 text-center shadow-2xl shadow-amber-500/60 space-y-3 max-w-sm mx-4 transform animate-bounce">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center font-bold text-3xl shadow-xl"
              style={{
                backgroundColor: comboSuccessJutsu.color,
                boxShadow: `0 0 30px ${comboSuccessJutsu.color}`,
              }}
            >
              {comboSuccessJutsu.icon}
            </div>

            <div>
              <div className="text-xs font-bold text-amber-300 font-tech uppercase tracking-widest">
                JUTSU CAST SUCCESSFUL!
              </div>
              <h3 className="text-xl md:text-2xl font-black font-cinzel text-white tracking-wide">
                {comboSuccessJutsu.name}
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Completed {comboSuccessJutsu.sequence.length}-Seal Combo within 5.0 Seconds!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOP FLOATING REAL-TIME FEEDBACK BAR */}
      <div className="absolute top-12 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Active Target Sign Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-slate-700/80 backdrop-blur-md flex items-center gap-2.5">
          <HandSignReferenceImage
            sealType={targetSeal}
            className="w-9 h-8 rounded border border-amber-400/60"
          />
          <div>
            <span className="text-[10px] text-slate-400 font-tech block uppercase">
              Target Step ({currentStepIndex + 1}/{selectedJutsu.sequence.length})
            </span>
            <span className="text-xs font-bold text-amber-300 font-cinzel flex items-center gap-1">
              <span>{targetSealData?.name || targetSeal}</span>
              <span className="text-slate-400 font-mono">{targetSealData?.symbol}</span>
            </span>
          </div>
        </div>

        {/* Live Recognized Prediction Pill */}
        <div
          className={`px-3 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-2 transition-all ${
            isMatch
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/30'
              : currentLabel !== 'None'
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
              : 'bg-black/80 border-slate-700 text-slate-400'
          }`}
        >
          {isMatch ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
          ) : (
            <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-tech opacity-80">Detected:</span>
              <span className="text-xs font-bold font-mono">
                {currentLabel} ({Math.round(currentConfidence * 100)}%)
              </span>
            </div>
            <span className="text-[9px] font-mono block">
              {isMatch ? 'MATCH! HOLD FORM...' : 'Awaiting correct sign posture'}
            </span>
          </div>
        </div>
      </div>

      {/* FLOATING SEQUENCE PROGRESS BAR OVERLAID ON CAMERA FEED */}
      <div className="absolute bottom-14 left-3 right-3 z-30 p-2.5 rounded-xl bg-black/85 border border-cyan-500/40 backdrop-blur-md flex items-center justify-center gap-1.5 pointer-events-none overflow-x-auto">
        {selectedJutsu.sequence.map((seal, idx) => {
          const sData = HAND_SEALS_REFERENCE_DATA[seal];
          const isDone = idx < currentStepIndex;
          const isCurr = idx === currentStepIndex;

          return (
            <div
              key={`camera-seq-${seal}-${idx}`}
              className={`px-2 py-1 rounded-lg border text-xs font-bold font-mono flex items-center gap-1 shrink-0 ${
                isDone
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                  : isCurr
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-slate-900/80 border-slate-700 text-slate-500'
              }`}
            >
              <span>{sData?.symbol || '📜'}</span>
              <span>{sData?.name || seal}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
          );
        })}
      </div>

      {/* BOTTOM REAL-TIME 5.0S COUNTDOWN & STEP HOLD METER */}
      <div className="absolute bottom-2 left-3 right-3 z-30 p-2 rounded-xl bg-black/90 border border-slate-800 backdrop-blur-md flex items-center justify-between gap-3 pointer-events-none text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
          <span className="font-tech font-bold text-slate-300">Combo Window:</span>
          <span className="font-mono text-amber-300">{(timeLeftMs / 1000).toFixed(1)}s</span>
        </div>

        <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              timerProgress < 30 ? 'bg-red-500' : timerProgress < 60 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
