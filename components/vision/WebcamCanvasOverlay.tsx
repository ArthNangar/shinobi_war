'use client';

import React from 'react';
import { Camera, CameraOff, Cpu, Activity, Eye } from 'lucide-react';

interface WebcamCanvasOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  cameraError: string | null;
  fps: number;
  isSimulatedMode: boolean;
  onToggleCamera: () => void;
  playerLabel?: string;
}

export const WebcamCanvasOverlay: React.FC<WebcamCanvasOverlayProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  cameraError,
  fps,
  isSimulatedMode,
  onToggleCamera,
  playerLabel = 'PLAYER 1 (HERO)',
}) => {
  return (
    <div className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-transparent shadow-2xl flex flex-col group">
      {/* Video & Canvas Container */}
      <div className="relative flex-1 w-full h-full bg-transparent flex items-center justify-center overflow-hidden">
        {/* Live HTML <video> element capturing webcam stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-0 opacity-100 bg-slate-950"
        />

        {/* HTML5 Overlay Canvas for hand landmarks and skeleton tracking */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-10 pointer-events-none"
        />

        {/* Scanline Grid Background Effect */}
        <div className="absolute inset-0 scanline-bg pointer-events-none z-20 opacity-60" />

        {/* Camera Off / Standby Overlay */}
        {!isCameraActive && (
          <div className="relative z-30 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#0B101D]/90 backdrop-blur-md w-full h-full">
            <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
              <CameraOff className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">VISION SENSOR OFFLINE</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Activate your camera feed to enable real-time hand landmark tracking and gesture recognition.
              </p>
            </div>
            <button
              onClick={onToggleCamera}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Start Camera Sensor
            </button>
          </div>
        )}

        {/* Top HUD Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Player & Sensor Tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-bold text-cyan-300 tracking-wider font-tech uppercase">
              {playerLabel}
            </span>
          </div>

          {/* FPS & Model Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>{fps} FPS</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-cyan-500/40 text-[10px] text-cyan-400 font-mono">
              <Cpu className="w-3 h-3" />
              <span>{isSimulatedMode ? 'SIMULATOR ML' : 'MEDIAPIPE AI'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Floating Control Trigger */}
        {isCameraActive && (
          <div className="absolute bottom-3 right-3 z-30">
            <button
              onClick={onToggleCamera}
              className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5"
            >
              <CameraOff className="w-3.5 h-3.5" /> Toggle Sensor
            </button>
          </div>
        )}

        {/* Camera Access Error Alert */}
        {cameraError && (
          <div className="absolute bottom-12 left-3 right-3 z-30 p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 backdrop-blur-md">
            <Eye className="w-4 h-4 text-red-400 shrink-0" />
            <span>{cameraError} — Running in interactive simulator mode.</span>
          </div>
        )}
      </div>
    </div>
  );
};
