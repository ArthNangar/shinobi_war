'use client';

import React from 'react';
import { WebcamCanvasOverlay } from '@/components/vision/WebcamCanvasOverlay';
import { SealType, HandSealReferenceDetail } from '@/types/shinobi';
import { PredictionResult } from '@/lib/vision';
import { Eye, CheckCircle2, Zap, AlertCircle, Sparkles, Award } from 'lucide-react';

interface TrainingCameraOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  cameraError: string | null;
  fps: number;
  isSimulatedMode: boolean;
  onToggleCamera: () => void;
  selectedSignData: HandSealReferenceDetail;
  latestPrediction: PredictionResult;
  holdProgress: number; // 0 to 100
  holdTimeMs: number;
  requiredHoldMs: number;
  isSuccessState: boolean;
}

export const TrainingCameraOverlay: React.FC<TrainingCameraOverlayProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  cameraError,
  fps,
  isSimulatedMode,
  onToggleCamera,
  selectedSignData,
  latestPrediction,
  holdProgress,
  holdTimeMs,
  requiredHoldMs,
  isSuccessState,
}) => {
  const currentLabel = latestPrediction?.label || 'None';
  const currentConfidence = latestPrediction?.confidence || 0;

  // Check if live prediction matches selected target
  const isMatch =
    currentLabel.toUpperCase() === selectedSignData.type.toUpperCase() ||
    (currentLabel.toUpperCase() === 'SNAKE' && selectedSignData.type === 'SERPENT') ||
    (currentLabel.toUpperCase() === 'RABBIT' && selectedSignData.type === 'HARE');

  return (
    <div
      className={`relative w-full h-full min-h-[380px] max-h-[520px] rounded-2xl overflow-hidden transition-all duration-300 ${
        isSuccessState
          ? 'border-4 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-[1.01]'
          : isMatch && holdProgress > 0
          ? 'border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.4)]'
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
        playerLabel={`TRAINING MODE — PRACTICE: ${selectedSignData.name.toUpperCase()}`}
      />

      {/* SUCCESS STATE CELEBRATION AURA OVERLAY */}
      {isSuccessState && (
        <div className="absolute inset-0 z-40 bg-emerald-950/40 backdrop-blur-xs pointer-events-none flex flex-col items-center justify-center animate-pulse">
          <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-center shadow-2xl shadow-emerald-500/50 space-y-2 transform animate-bounce">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-400/80">
              ✓
            </div>
            <h3 className="text-xl font-black font-cinzel text-emerald-200 tracking-wider">
              SIGN MASTERED!
            </h3>
            <p className="text-xs text-emerald-300 font-tech">
              Held {selectedSignData.name} Seal for 2.0 Seconds Stably!
            </p>
          </div>
        </div>
      )}

      {/* TOP FLOATING REAL-TIME FEEDBACK BAR */}
      <div className="absolute top-12 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Target Sign Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-slate-700/80 backdrop-blur-md flex items-center gap-2">
          <span className="text-lg">{selectedSignData.symbol}</span>
          <div>
            <span className="text-[10px] text-slate-400 font-tech block uppercase">Target Sign</span>
            <span className="text-xs font-bold text-cyan-300 font-cinzel">{selectedSignData.name}</span>
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

      {/* BOTTOM REAL-TIME 2-SECOND HOLD PROGRESS METER */}
      <div className="absolute bottom-3 left-3 right-3 z-30 p-3 rounded-xl bg-black/85 border border-cyan-500/40 backdrop-blur-md space-y-2 pointer-events-none">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
            <span className="font-bold text-slate-200 font-tech">Sustained Hold Meter:</span>
          </div>
          <span className="font-mono font-bold text-cyan-300">
            {(holdTimeMs / 1000).toFixed(1)}s / {(requiredHoldMs / 1000).toFixed(1)}s ({holdProgress}%)
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              holdProgress >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-green-300 shadow-[0_0_15px_rgba(16,185,129,0.9)]'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
