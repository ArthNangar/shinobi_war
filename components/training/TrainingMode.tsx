'use client';

import React, { useState } from 'react';
import { useTrainingMode } from '@/hooks/useTrainingMode';
import { useJutsuComboTraining } from '@/hooks/useJutsuComboTraining';
import { HandSignSelector } from './HandSignSelector';
import { HandSignCard } from './HandSignCard';
import { TrainingCameraOverlay } from './TrainingCameraOverlay';
import { SignMasteredModal } from './SignMasteredModal';
import { JutsuComboSelector } from './JutsuComboSelector';
import { JutsuComboCard } from './JutsuComboCard';
import { JutsuComboCameraOverlay } from './JutsuComboCameraOverlay';
import { PredictionResult } from '@/lib/vision';
import { Target, Zap, Sparkles } from 'lucide-react';

interface TrainingModeProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  cameraError: string | null;
  fps: number;
  isSimulatedMode: boolean;
  onToggleCamera: () => void;
  latestPrediction: PredictionResult;
}

export const TrainingMode: React.FC<TrainingModeProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  cameraError,
  fps,
  isSimulatedMode,
  onToggleCamera,
  latestPrediction,
}) => {
  // Sub-Navigation Tab State: 'basic' | 'combos'
  const [subTab, setSubTab] = useState<'basic' | 'combos'>('basic');

  // Tab 1: Basic Signs Training Hook State
  const {
    selectedSignKey,
    selectedSignData,
    masteredSigns,
    holdTimeMs,
    holdProgress,
    requiredHoldMs,
    isSuccessState,
    justMasteredSign,
    selectSign,
    nextSign,
    dismissMasteredModal,
  } = useTrainingMode(latestPrediction);

  // Tab 2: Jutsu Combos Training Hook State
  const {
    selectedJutsu,
    jutsusList,
    currentStepIndex,
    stepHoldProgress,
    timeLeftMs,
    timerProgress,
    isTimerRunning,
    comboSuccessJutsu,
    completedJutsus,
    selectJutsu,
    resetCombo,
    manualAdvanceStep,
  } = useJutsuComboTraining(latestPrediction);

  return (
    <div className="w-full flex flex-col space-y-4 animate-fade-in">
      {/* TRAINING SUB-TAB NAVIGATION SYSTEM */}
      <div className="w-full flex items-center justify-between p-1.5 rounded-2xl ninja-glass border border-cyan-500/30 gap-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Tab 1 Button: Basic Signs */}
          <button
            onClick={() => setSubTab('basic')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold font-cinzel tracking-wider transition-all flex items-center justify-center gap-2 ${
              subTab === 'basic'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Basic Signs</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                subTab === 'basic'
                  ? 'bg-black/30 text-black font-bold'
                  : 'bg-slate-800 text-cyan-300'
              }`}
            >
              {masteredSigns.size} / 12 Mastered
            </span>
          </button>

          {/* Tab 2 Button: Jutsu Combos */}
          <button
            onClick={() => setSubTab('combos')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold font-cinzel tracking-wider transition-all flex items-center justify-center gap-2 ${
              subTab === 'combos'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-black font-black shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Jutsu Combos</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                subTab === 'combos'
                  ? 'bg-black/30 text-black font-bold'
                  : 'bg-slate-800 text-amber-300'
              }`}
            >
              {completedJutsus.size} / {jutsusList.length} Unlocked
            </span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: BASIC HAND SIGNS PRACTICE */}
      {subTab === 'basic' ? (
        <>
          {/* Top Selectable 12 Zodiac Signs Library Grid */}
          <HandSignSelector
            selectedSignKey={selectedSignKey}
            masteredSigns={masteredSigns}
            onSelectSign={selectSign}
          />

          {/* Main Split-Screen Reference & Camera Feed Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left Screen: Reference UI & Execution Instructions */}
            <HandSignCard
              seal={selectedSignData}
              isMastered={masteredSigns.has(selectedSignKey)}
            />

            {/* Right Screen: Camera Feed, MediaPipe Canvas, & Real-Time Feedback Loop */}
            <TrainingCameraOverlay
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              fps={fps}
              isSimulatedMode={isSimulatedMode}
              onToggleCamera={onToggleCamera}
              selectedSignData={selectedSignData}
              latestPrediction={latestPrediction}
              holdProgress={holdProgress}
              holdTimeMs={holdTimeMs}
              requiredHoldMs={requiredHoldMs}
              isSuccessState={isSuccessState}
            />
          </div>

          {/* Celebration Modal when 2-second hold mastery condition is reached */}
          <SignMasteredModal
            masteredSign={justMasteredSign}
            onDismiss={dismissMasteredModal}
            onNextSign={nextSign}
          />
        </>
      ) : (
        /* SUB-TAB 2: JUTSU COMBOS PRACTICE */
        <>
          {/* Top Selectable Unlockable Jutsu Combos Selector */}
          <JutsuComboSelector
            selectedJutsuId={selectedJutsu.id}
            completedJutsus={completedJutsus}
            onSelectJutsu={selectJutsu}
            jutsusList={jutsusList}
          />

          {/* Main Split-Screen Reference & Camera Feed Layout for Jutsu Combos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left Screen: Required Sequence Array & Timer Reference Card */}
            <JutsuComboCard
              jutsu={selectedJutsu}
              currentStepIndex={currentStepIndex}
              stepHoldProgress={stepHoldProgress}
              timeLeftMs={timeLeftMs}
              timerProgress={timerProgress}
              isTimerRunning={isTimerRunning}
              onManualAdvance={manualAdvanceStep}
              onResetCombo={resetCombo}
            />

            {/* Right Screen: Camera Feed with Live Sequence Tracker & Dynamic Elemental FX */}
            <JutsuComboCameraOverlay
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              fps={fps}
              isSimulatedMode={isSimulatedMode}
              onToggleCamera={onToggleCamera}
              selectedJutsu={selectedJutsu}
              currentStepIndex={currentStepIndex}
              stepHoldProgress={stepHoldProgress}
              timeLeftMs={timeLeftMs}
              timerProgress={timerProgress}
              isTimerRunning={isTimerRunning}
              latestPrediction={latestPrediction}
              comboSuccessJutsu={comboSuccessJutsu}
            />
          </div>
        </>
      )}
    </div>
  );
};
