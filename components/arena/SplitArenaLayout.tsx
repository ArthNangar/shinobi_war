'use client';

import React from 'react';
import { WebcamCanvasOverlay } from '@/components/vision/WebcamCanvasOverlay';
import { PlayerCard } from '@/components/arena/PlayerCard';
import { VisionControls } from '@/components/vision/VisionControls';
import { PlayerState, SealType } from '@/types/shinobi';

interface SplitArenaLayoutProps {
  player1: PlayerState;
  player2: PlayerState;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  cameraError: string | null;
  fps: number;
  isSimulatedMode: boolean;
  onToggleCamera: () => void;
  onTriggerSeal: (sealType: SealType) => void;
  onChargeChakra: () => void;
  onAIOpponentAction?: () => void;
}

export const SplitArenaLayout: React.FC<SplitArenaLayoutProps> = ({
  player1,
  player2,
  videoRef,
  canvasRef,
  isCameraActive,
  cameraError,
  fps,
  isSimulatedMode,
  onToggleCamera,
  onTriggerSeal,
  onChargeChakra,
  onAIOpponentAction,
}) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-stretch my-4">
      {/* Left Screen: Player 1 (User / Hero with Webcam + Overlay Canvas) */}
      <div className="flex flex-col space-y-3">
        <WebcamCanvasOverlay
          videoRef={videoRef}
          canvasRef={canvasRef}
          isCameraActive={isCameraActive}
          cameraError={cameraError}
          fps={fps}
          isSimulatedMode={isSimulatedMode}
          onToggleCamera={onToggleCamera}
          playerLabel={`${player1.name} (LIVE VISION)`}
        />
        <VisionControls
          onTriggerSeal={onTriggerSeal}
          onChargeChakra={onChargeChakra}
        />
      </div>

      {/* Right Screen: Player 2 (Opponent / Rival Shinobi) */}
      <div className="flex flex-col space-y-3">
        <PlayerCard
          player={player2}
          isOpponent={true}
          onAIActionTrigger={onAIOpponentAction}
        />
      </div>
    </div>
  );
};
