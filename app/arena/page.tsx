'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBattleState } from '@/hooks/useBattleState';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useHandSignSequence, HAND_SEALS, JUTSU_LIBRARY } from '@/hooks/useHandSignSequence';
import { useWebRTCNetwork } from '@/hooks/useWebRTCNetwork';
import { useGameStateManager } from '@/hooks/useGameStateManager';
import { EventQueueProcessor } from '@/lib/webrtc/EventQueueProcessor';
import { FireRedBattleArena } from '@/components/arena/FireRedBattleArena';
import { JutsuLibraryModal } from '@/components/sequence/JutsuLibraryModal';
import { JutsuClashOverlay } from '@/components/arena/JutsuClashOverlay';
import { Jutsu, SealType, SequenceItem } from '@/types/shinobi';
import { soundFx } from '@/components/audio/SoundEffects';
import { Volume2, VolumeX, Wifi, RefreshCw, Flame, Swords, Target, Scroll, ArrowLeft } from 'lucide-react';
import { DatasetCollectorPanel } from '@/components/vision/DatasetCollectorPanel';
import { TrainingMode } from '@/components/training/TrainingMode';
import Link from 'next/link';

export default function ShinobiBattleArenaPage() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'arena' | 'training'>('arena');

  // Master Battle State
  const {
    player1,
    player2,
    battleStatus,
    isPaused,
    winner,
    logs,
    castJutsu,
    castJutsuAsync,
    chargeChakra,
    resetBattle,
    pauseBattle,
    resumeBattle,
  } = useBattleState();

  // Opponent Hand Sign Stream Array
  const [opponentSequence, setOpponentSequence] = useState<SequenceItem[]>([]);

  // Modal & Audio Toggle States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeJutsuFX, setActiveJutsuFX] = useState<Jutsu | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [customRoomInput, setCustomRoomInput] = useState<string>('room-leaf-01');

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
            damage: attackPayload.damage || 25,
            chakraCost: 15,
            description: 'Attack dispatched over WebRTC Data Channel by opponent.',
            icon: '⚡',
            color: '#FF2E63',
            soundType: 'fire' as const,
          };

          setActiveJutsuFX(opponentJutsu);
          // Await full cast and hit animation duration before resolving for next queued item
          await castJutsuAsync('p2', opponentJutsu);
          soundFx.playJutsuCastSound(opponentJutsu.soundType);

          setTimeout(() => {
            setActiveJutsuFX(null);
            setOpponentSequence([]);
          }, 1200);
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
    if (incomingMsg.type === 'SEAL_REGISTERED') {
      const sealType = incomingMsg.payload?.sealType as SealType;
      if (sealType) {
        soundFx.playSealSound(Math.floor(Math.random() * 7));
        const newItem: SequenceItem = {
          id: Math.random().toString(36).substring(2, 9),
          type: sealType,
          timestamp: Date.now(),
          accuracy: 0.95,
        };
        setOpponentSequence((prev) => {
          const next = [...prev, newItem];
          return next.length > 8 ? next.slice(next.length - 8) : next;
        });
      }
    } else if (eventQueueRef.current) {
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

  // Registered seal handler (Local Player -> WebRTC + Local State)
  const handleRegisterSealLocal = useCallback(
    (seal: SealType) => {
      addSeal(seal);
      if (connectionStatus === 'CONNECTED') {
        sendPeerEvent('SEAL_REGISTERED', { sealType: seal, timestamp: Date.now() });
      }
    },
    [addSeal, connectionStatus, sendPeerEvent]
  );

  // Core Game State Manager for Vision Prediction Stream & Sliding Window Filtering
  const { processVisionFrame, registerManualSeal } = useGameStateManager({
    networkManager,
    onAttackTriggered: (attackPayload) => {
      const matchingJutsu =
        JUTSU_LIBRARY.find(
          (j) => j.element === attackPayload.element || j.name.toLowerCase().includes(attackPayload.name.toLowerCase())
        ) || JUTSU_LIBRARY[0];

      handleJutsuTriggered(matchingJutsu);
    },
    onSealRegistered: (seal) => {
      handleRegisterSealLocal(seal);
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

  // Automatically Pause Battle when entering Training Mode and Resume when returning to Arena
  useEffect(() => {
    if (activeTab === 'training') {
      pauseBattle();
    } else {
      resumeBattle();
    }
  }, [activeTab, pauseBattle, resumeBattle]);

  // Keyboard shortcut listener for fast seal weaving (active only in Battle Arena)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeTab === 'training' || isPaused) return; // Ignore arena shortcuts while in training mode

      const key = e.key.toUpperCase();
      const matchedSeal = Object.values(HAND_SEALS).find((s) => s.keyShortcut === key);

      if (matchedSeal) {
        handleRegisterSealLocal(matchedSeal.type);
      } else if (key === 'C') {
        clearSequence();
      } else if (key === 'SPACE') {
        chargeChakra('p1');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isPaused, handleRegisterSealLocal, clearSequence, chargeChakra]);

  // AI Opponent Action Simulation
  const handleAIOpponentCounter = useCallback(() => {
    if (activeTab === 'training' || isPaused) return; // Prevent AI actions when battle is paused in training mode

    const sampleSeals: SealType[] = ['TIGER', 'SERPENT', 'MONKEY'];
    sampleSeals.forEach((seal, idx) => {
      setTimeout(() => {
        soundFx.playSealSound((idx + 2) % 7);
        setOpponentSequence((prev) => [
          ...prev.slice(-7),
          {
            id: Math.random().toString(36).substring(2, 9),
            type: seal,
            timestamp: Date.now(),
            accuracy: 0.95,
          },
        ]);
      }, idx * 250);
    });

    setTimeout(() => {
      const sampleJutsus = [
        {
          id: 'ai-fireball',
          name: 'Katon: Flame Whirlwind',
          japaneseName: 'Katon: Renkei Fire',
          element: 'Fire' as const,
          sequence: ['TIGER', 'SERPENT'] as SealType[],
          damage: 25,
          chakraCost: 15,
          description: 'AI Opponent flame counter strike.',
          icon: '🔥',
          color: '#FF2E63',
          soundType: 'fire' as const,
        },
        {
          id: 'ai-water',
          name: 'Suiton: Water Dragon Strike',
          japaneseName: 'Suiton: Suiryu Torrent',
          element: 'Water' as const,
          sequence: ['BIRD', 'SERPENT'] as SealType[],
          damage: 30,
          chakraCost: 20,
          description: 'AI Opponent water dragon strike.',
          icon: '🌊',
          color: '#00B4D8',
          soundType: 'water' as const,
        },
      ];
      const chosen = sampleJutsus[Math.floor(Math.random() * sampleJutsus.length)];
      setActiveJutsuFX(chosen);
      castJutsu('p2', chosen);

      setTimeout(() => {
        setActiveJutsuFX(null);
        setOpponentSequence([]);
      }, 1500);
    }, 1000);
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
    <main className="min-h-screen w-full bg-[#060913] text-slate-100 p-2 md:p-5 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#060913] to-[#060913] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col space-y-3">
        {/* Header Bar */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl ninja-glass border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-400 transition"
              title="Return to Shinobi Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 border border-amber-300 shadow-lg shadow-amber-500/30 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black font-cinzel text-amber-200 tracking-wide">
                SHINOBI SEALS • FIRE RED ARENA
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 font-tech">
                Classic 2D Pokémon Style Hand Sign WebRTC Battle Arena
              </p>
            </div>
          </div>

          {/* Controls & Connection Status */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleSimulate5RapidAttacks}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md border border-red-400/40 transition flex items-center gap-1.5"
              title="Simulate 5 rapid-fire attacks over DataChannel queue"
            >
              <Flame className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>Simulate Attacks {queueLength > 0 ? `(${queueLength})` : ''}</span>
            </button>

            {/* WebRTC Match Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
              <input
                type="text"
                value={customRoomInput}
                onChange={(e) => setCustomRoomInput(e.target.value)}
                placeholder="Room Code"
                disabled={connectionStatus === 'CONNECTED' || connectionStatus === 'CONNECTING'}
                className="w-24 px-2 py-1 bg-slate-950 text-cyan-300 text-xs font-mono rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              <button
                onClick={() =>
                  connectionStatus === 'CONNECTED' || connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                    ? disconnectRoom()
                    : createRoom(customRoomInput || 'room-leaf-01')
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                    : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                    ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900/80'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {connectionStatus === 'CONNECTED'
                    ? `P2P LIVE (${roomId})`
                    : connectionStatus === 'CONNECTING'
                    ? 'Cancel Connecting...'
                    : connectionStatus === 'RECONNECTING'
                    ? 'Cancel Reconnecting...'
                    : 'Host Match'}
                </span>
              </button>

              {(connectionStatus === 'DISCONNECTED' || connectionStatus === 'FAILED') && (
                <button
                  onClick={() => joinRoom(customRoomInput || 'room-leaf-01')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                >
                  Join
                </button>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Rematch */}
            <button
              onClick={resetBattle}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Reset
            </button>
          </div>
        </header>

        {/* Tab Navigation System */}
        <nav className="w-full flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md gap-2">
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs md:text-sm font-bold font-cinzel tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'arena'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-black font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>2D Fire Red Battle Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs md:text-sm font-bold font-cinzel tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'training'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-black font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Training Mode (Practice Signs)</span>
            {activeTab === 'training' && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-200 flex items-center gap-1">
                ⏸️ BATTLE PAUSED
              </span>
            )}
          </button>
        </nav>

        {/* View Switch */}
        {activeTab === 'arena' ? (
          <>
            {/* Pokémon Fire Red 2D Battle Arena Stage & Console */}
            <FireRedBattleArena
              player1={player1}
              player2={player2}
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              fps={fps}
              isSimulatedMode={isSimulatedMode}
              onToggleCamera={toggleCamera}
              onRegisterSeal={handleRegisterSealLocal}
              onChargeChakra={(p) => chargeChakra(p)}
              onClearSequence={clearSequence}
              onOpenJutsuLibrary={() => setIsLibraryOpen(true)}
              localSequence={sequence}
              opponentSequence={opponentSequence}
              matchedJutsu={matchedJutsu}
              activeJutsuFX={activeJutsuFX}
              connectionStatus={connectionStatus}
              roomId={roomId}
              onAIOpponentAction={handleAIOpponentCounter}
              isPaused={isPaused}
            />

            {/* Computer Vision & Custom Model Dataset Panel */}
            <DatasetCollectorPanel
              latestResult={latestResult}
              recordedSamplesCount={recordedSamplesCount}
              onRecordSample={recordCurrentSample}
              onExportDataset={exportDataset}
              onTrainModel={trainModel}
            />

            {/* Live Commentary Battle Log */}
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
          </>
        ) : (
          <TrainingMode
            videoRef={videoRef}
            canvasRef={canvasRef}
            isCameraActive={isCameraActive}
            cameraError={cameraError}
            fps={fps}
            isSimulatedMode={isSimulatedMode}
            onToggleCamera={toggleCamera}
            latestPrediction={latestResult.prediction}
          />
        )}
      </div>

      {/* Ninjutsu Scroll Library Modal */}
      <JutsuLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectJutsuSequence={(seq) => {
          clearSequence();
          seq.forEach((s) => handleRegisterSealLocal(s));
        }}
      />

      {/* Victory / Match Over Overlay */}
      <JutsuClashOverlay
        activeJutsu={null}
        winner={winner}
        onResetMatch={resetBattle}
      />
    </main>
  );
}
