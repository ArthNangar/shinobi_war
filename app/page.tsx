'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBattleState } from '@/hooks/useBattleState';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useHandSignSequence, HAND_SEALS, JUTSU_LIBRARY } from '@/hooks/useHandSignSequence';
import { useWebRTCNetwork } from '@/hooks/useWebRTCNetwork';
import { useGameStateManager } from '@/hooks/useGameStateManager';
import { EventQueueProcessor } from '@/lib/webrtc/EventQueueProcessor';
import { BattleHUD } from '@/components/arena/BattleHUD';
import { SplitArenaLayout } from '@/components/arena/SplitArenaLayout';
import { SequenceBar } from '@/components/sequence/SequenceBar';
import { JutsuLibraryModal } from '@/components/sequence/JutsuLibraryModal';
import { JutsuClashOverlay } from '@/components/arena/JutsuClashOverlay';
import { Jutsu, SealType } from '@/types/shinobi';
import { soundFx } from '@/components/audio/SoundEffects';
import { Volume2, VolumeX, Shield, Wifi, Scroll, RefreshCw, Zap, Flame } from 'lucide-react';
import { DatasetCollectorPanel } from '@/components/vision/DatasetCollectorPanel';

export default function ShinobiBattleArenaPage() {
  // Master Battle State
  const {
    player1,
    player2,
    battleStatus,
    winner,
    logs,
    castJutsu,
    castJutsuAsync,
    chargeChakra,
    resetBattle,
  } = useBattleState();

  // Modal & Audio Toggle States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeJutsuFX, setActiveJutsuFX] = useState<Jutsu | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);

  // Sequential Event Queue Processor to prevent rapid-fire attack clobbering
  const eventQueueRef = useRef<EventQueueProcessor | null>(null);

  useEffect(() => {
    const queue = new EventQueueProcessor(
      async (incomingMsg) => {
        if (incomingMsg.type === 'ATTACK_DISPATCH') {
          const attackPayload = incomingMsg.payload;
          console.log('[P2P Sequential Queue Processing Attack]:', attackPayload);

          const opponentJutsu = JUTSU_LIBRARY.find((j) => j.id === attackPayload.attackType) || {
            id: attackPayload.attackType || 'opponent-jutsu',
            name: attackPayload.name || 'Opponent Elemental Strike',
            japaneseName: 'Opponent Ninjutsu',
            element: (attackPayload.element as any) || 'Fire',
            sequence: attackPayload.sequence || [],
            damage: attackPayload.damage || 20,
            chakraCost: 15,
            description: 'Attack dispatched over WebRTC Data Channel by opponent.',
            icon: '⚡',
            color: '#FF2E63',
            soundType: 'fire' as const,
          };

          // Await full cast and hit animation duration before resolving for next queued item
          await castJutsuAsync('p2', opponentJutsu);
          soundFx.playJutsuCastSound(opponentJutsu.soundType);
        }
      },
      {
        onQueueLengthChange: (len) => setQueueLength(len),
      }
    );

    eventQueueRef.current = queue;

    return () => {
      queue.clear();
    };
  }, [castJutsuAsync]);

  // Trigger Local Player Jutsu Callback
  const handleJutsuTriggered = useCallback(
    (jutsu: Jutsu) => {
      setActiveJutsuFX(jutsu);
      castJutsu('p1', jutsu);

      setTimeout(() => {
        setActiveJutsuFX(null);
      }, 1500);
    },
    [castJutsu]
  );

  // WebRTC Peer Connection Hook with Incoming DataChannel Event Enqueuer
  const handleIncomingWebRTCMessage = useCallback((incomingMsg: any) => {
    if (eventQueueRef.current) {
      eventQueueRef.current.enqueue(incomingMsg);
    }
  }, []);

  const {
    connectionStatus,
    roomId,
    peerId,
    latencyMs,
    createRoom,
    joinRoom,
    disconnectRoom,
    sendPeerEvent,
    networkManager,
  } = useWebRTCNetwork(handleIncomingWebRTCMessage);

  // Hand Sign Sequence & Game State Manager
  const { sequence, matchedJutsu, addSeal, clearSequence } = useHandSignSequence(handleJutsuTriggered);

  // Core Game State Manager for Vision Prediction Stream & Sliding Window Filtering
  const { processVisionFrame, registerManualSeal } = useGameStateManager({
    networkManager,
    onAttackTriggered: (attackPayload) => {
      const matchingJutsu = JUTSU_LIBRARY.find(
        (j) => j.element === attackPayload.element || j.name.toLowerCase().includes(attackPayload.name.toLowerCase())
      ) || JUTSU_LIBRARY[0];

      handleJutsuTriggered(matchingJutsu);
    },
    onSealRegistered: (seal) => {
      addSeal(seal);
    },
  });

  // Direct frame handler from vision loop to game state manager
  const processVisionFrameRef = useRef(processVisionFrame);
  useEffect(() => {
    processVisionFrameRef.current = processVisionFrame;
  }, [processVisionFrame]);

  const handleVisionFrame = useCallback((label: string, confidence: number) => {
    if (label && label !== 'None') {
      processVisionFrameRef.current(label, confidence);
    }
  }, []);

  // Vision Sensor & Landmark Overlay Hook
  const {
    videoRef,
    canvasRef,
    isCameraActive,
    cameraError,
    fps,
    isSimulatedMode,
    latestResult,
    recordedSamplesCount,
    toggleCamera,
    recordCurrentSample,
    exportDataset,
    trainModel,
  } = useHandTracking(handleVisionFrame);

  // Keyboard shortcut listener for fast seal weaving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      const matchedSeal = Object.values(HAND_SEALS).find((s) => s.keyShortcut === key);

      if (matchedSeal) {
        registerManualSeal(matchedSeal.type);
      } else if (key === 'C') {
        clearSequence();
      } else if (key === 'SPACE') {
        chargeChakra('p1');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [registerManualSeal, clearSequence, chargeChakra]);

  // AI Opponent Counter Attack Action (Fallback / Single Player)
  const handleAIOpponentCounter = useCallback(() => {
    const sampleJutsus = [
      {
        id: 'ai-fireball',
        name: 'Katon: Flame Whirlwind',
        japaneseName: 'Katon: Renkei Fire',
        element: 'Fire' as const,
        sequence: ['TIGER' as SealType, 'SERPENT' as SealType],
        damage: 20,
        chakraCost: 15,
        description: 'AI Opponent flame counter strike.',
        icon: '🔥',
        color: '#FF2E63',
        soundType: 'fire' as const,
      },
    ];

    castJutsu('p2', sampleJutsus[0]);
  }, [castJutsu]);

  // Simulate 5 Rapid-Fire Attacks Over DataChannel / Queue
  const handleSimulate5RapidAttacks = useCallback(() => {
    console.log('⚡ SIMULATING 5 RAPID-FIRE ATTACKS OVER DATACHANNEL QUEUE...');
    
    const rapidAttacks = [
      { attackType: 'fireball-jutsu', name: 'Katon: Great Fireball', element: 'Fire', damage: 15, sequence: ['TIGER', 'SERPENT'] },
      { attackType: 'water-dragon-jutsu', name: 'Suiton: Water Dragon', element: 'Water', damage: 18, sequence: ['BIRD', 'SERPENT'] },
      { attackType: 'lightning-blade-jutsu', name: 'Raiton: Chidori', element: 'Lightning', damage: 20, sequence: ['OX', 'HARE'] },
      { attackType: 'fire-dragon-jutsu', name: 'Katon: Dragon Flame', element: 'Fire', damage: 16, sequence: ['DRAGON', 'TIGER'] },
      { attackType: 'water-wall-jutsu', name: 'Suiton: Water Wall', element: 'Water', damage: 15, sequence: ['RAM', 'SERPENT'] },
    ];

    rapidAttacks.forEach((attack, index) => {
      const msg = {
        type: 'ATTACK_DISPATCH' as const,
        payload: {
          ...attack,
          timestamp: Date.now() + index * 10,
        },
        senderId: 'opponent-rapid-fire-tester',
        timestamp: Date.now() + index * 10,
      };

      // If network manager is active & open, send over real P2P connection, else queue locally
      if (connectionStatus === 'CONNECTED') {
        sendPeerEvent('ATTACK_DISPATCH', msg.payload);
      } else {
        if (eventQueueRef.current) {
          eventQueueRef.current.enqueue(msg);
        }
      }
    });
  }, [connectionStatus, sendPeerEvent]);

  // Handle Mute Audio Toggle
  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main className="min-h-screen w-full bg-[#060913] text-slate-100 p-3 md:p-6 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Background Subtle Gradient & Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#060913] to-[#060913] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col space-y-4">
        {/* Navigation Header */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl ninja-glass border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-300 shadow-lg shadow-cyan-500/30 flex items-center justify-center text-xl">
              🥷
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black font-cinzel text-cyan-200 tracking-wide">
                SHINOBI SEALS
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 font-tech">
                Real-Time Hand Sign WebRTC Multiplayer Arena
              </p>
            </div>
          </div>

          {/* Controls & Connection Status */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Rapid Fire Simulation Button */}
            <button
              onClick={handleSimulate5RapidAttacks}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-red-900/40 border border-red-400/40 transition flex items-center gap-1.5"
              title="Simulate 5 rapid-fire attacks over DataChannel queue"
            >
              <Flame className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>Simulate 5 Rapid Attacks {queueLength > 0 ? `(${queueLength})` : ''}</span>
            </button>

            {/* Multiplayer WebRTC Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => (connectionStatus === 'CONNECTED' ? disconnectRoom() : createRoom('room-leaf-01'))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                    : connectionStatus === 'RECONNECTING'
                    ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300 animate-pulse'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {connectionStatus === 'CONNECTED'
                    ? `P2P LIVE (${roomId})`
                    : connectionStatus === 'CONNECTING'
                    ? 'Connecting Signaling...'
                    : connectionStatus === 'RECONNECTING'
                    ? 'Reconnecting Loop...'
                    : 'Host Match'}
                </span>
              </button>

              {connectionStatus === 'DISCONNECTED' && (
                <button
                  onClick={() => joinRoom('room-leaf-01')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                >
                  Join Match
                </button>
              )}

              {connectionStatus === 'CONNECTED' && (
                <div className="px-2 py-1 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>{latencyMs}ms</span>
                </div>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Reset Battle */}
            <button
              onClick={resetBattle}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Rematch
            </button>
          </div>
        </header>

        {/* Interactive Health Bars and Chakra Meters HUD */}
        <BattleHUD
          player1={player1}
          player2={player2}
          battleStatus={battleStatus}
          winner={winner}
          onChargeP1Chakra={() => chargeChakra('p1')}
          onChargeP2Chakra={() => chargeChakra('p2')}
        />

        {/* Split-Screen Multiplayer Battle Arena View */}
        <SplitArenaLayout
          player1={player1}
          player2={player2}
          videoRef={videoRef}
          canvasRef={canvasRef}
          isCameraActive={isCameraActive}
          cameraError={cameraError}
          fps={fps}
          isSimulatedMode={isSimulatedMode}
          onToggleCamera={toggleCamera}
          onTriggerSeal={(seal) => registerManualSeal(seal)}
          onChargeChakra={() => chargeChakra('p1')}
          onAIOpponentAction={handleAIOpponentCounter}
        />

        {/* Bottom Hand Seal Sequence Bar */}
        <SequenceBar
          sequence={sequence}
          matchedJutsu={matchedJutsu}
          onAddSeal={(seal) => registerManualSeal(seal)}
          onClearSequence={clearSequence}
          onOpenJutsuLibrary={() => setIsLibraryOpen(true)}
        />

        {/* Modular Client-Side Computer Vision & TensorFlow.js Dataset Workbench */}
        <DatasetCollectorPanel
          latestResult={latestResult}
          recordedSamplesCount={recordedSamplesCount}
          onRecordSample={recordCurrentSample}
          onExportDataset={exportDataset}
          onTrainModel={trainModel}
        />

        {/* Live Battle Commentary Log Ticker */}
        <div className="w-full p-3 rounded-2xl ninja-glass border border-slate-800/80 flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <Scroll className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-300">BATTLE TICKER:</span>
          </div>
          <div className="truncate text-slate-200 font-medium flex-1">
            {logs.length > 0 ? (
              <span className="animate-fade-in">
                [{logs[0].timestamp}] <strong className="text-cyan-400">{logs[0].sender}</strong>: {logs[0].message}
              </span>
            ) : (
              <span>No battle events recorded yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Ninjutsu Scroll Library Modal */}
      <JutsuLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectJutsuSequence={(seq) => {
          clearSequence();
          seq.forEach((s) => registerManualSeal(s));
        }}
      />

      {/* Active Jutsu Cast FX and Victory Overlay */}
      <JutsuClashOverlay
        activeJutsu={activeJutsuFX}
        winner={winner}
        onResetMatch={resetBattle}
      />
    </main>
  );
}
