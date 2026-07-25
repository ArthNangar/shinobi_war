'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerState, SealType, Jutsu, SequenceItem } from '@/types/shinobi';
import { HAND_SEALS, JUTSU_LIBRARY } from '@/hooks/useHandSignSequence';
import { SealBadge } from '@/components/sequence/SealBadge';
import { WebcamCanvasOverlay } from '@/components/vision/WebcamCanvasOverlay';
import { soundFx } from '@/components/audio/SoundEffects';
import {
  Heart,
  Zap,
  Swords,
  Flame,
  Droplets,
  Sparkles,
  BookOpen,
  Trash2,
  Camera,
  RefreshCw,
  Shield,
  Bot,
  Scroll,
  Tv,
  Eye,
  Feather,
  Layers,
  Flag,
} from 'lucide-react';

export interface FireRedBattleArenaProps {
  player1: PlayerState;
  player2: PlayerState;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  cameraError: string | null;
  fps: number;
  isSimulatedMode: boolean;
  onToggleCamera: () => void;
  onRegisterSeal: (seal: SealType) => void;
  onChargeChakra: (player: 'p1' | 'p2') => void;
  onClearSequence: () => void;
  onOpenJutsuLibrary: () => void;
  localSequence: SequenceItem[];
  opponentSequence: SequenceItem[];
  matchedJutsu: Jutsu | null;
  activeJutsuFX: Jutsu | null;
  connectionStatus: string;
  roomId: string | null;
  onAIOpponentAction?: () => void;
  isPaused?: boolean;
}

export const FireRedBattleArena: React.FC<FireRedBattleArenaProps> = ({
  player1,
  player2,
  videoRef,
  canvasRef,
  isCameraActive,
  cameraError,
  fps,
  isSimulatedMode,
  onToggleCamera,
  onRegisterSeal,
  onChargeChakra,
  onClearSequence,
  onOpenJutsuLibrary,
  localSequence,
  opponentSequence,
  matchedJutsu,
  activeJutsuFX,
  connectionStatus,
  roomId,
  onAIOpponentAction,
  isPaused = false,
}) => {
  // Local state for tracking clash animation active status & type
  const [clashState, setClashState] = useState<{
    active: boolean;
    type: 'fireball' | 'water' | 'lightning' | 'rasengan' | 'clash';
    caster: 'p1' | 'p2' | 'both';
    damage?: number;
    title?: string;
    japaneseName?: string;
    kanji?: string;
  }>({
    active: false,
    type: 'fireball',
    caster: 'p1',
  });

  const [showWebcamPip, setShowWebcamPip] = useState(true);
  const [battleMessage, setBattleMessage] = useState<string>(
    '   : Channel Chakra into Hand Seals to unleash powerful Ninjutsu!'
  );

  // Monitor activeJutsuFX or sequence changes to trigger center stage visual clashes
  useEffect(() => {
    if (activeJutsuFX) {
      const isFire = activeJutsuFX.element === 'Fire';
      const isWater = activeJutsuFX.element === 'Water';
      const isLightning = activeJutsuFX.element === 'Lightning';
      const isSecret = activeJutsuFX.element === 'Secret';

      const clashType = isWater
        ? 'water'
        : isLightning
        ? 'lightning'
        : isSecret
        ? 'rasengan'
        : 'fireball';

      const kanjiMap: Record<string, string> = {
        Fire: '  • KATON',
        Water: '  • SUITON',
        Lightning: '  • RAITON',
        Secret: '  • HIJUTSU',
        Earth: '  • DOTON',
        Wind: '  • FUTON',
      };

      setClashState({
        active: true,
        type: clashType,
        caster: player1.activeStatus === 'CASTING' ? 'p1' : 'p2',
        damage: activeJutsuFX.damage,
        title: activeJutsuFX.name,
        japaneseName: activeJutsuFX.japaneseName,
        kanji: kanjiMap[activeJutsuFX.element] || ' ',
      });

      setBattleMessage(
        `【${kanjiMap[activeJutsuFX.element] || 'NINJUTSU'}】 ${
          player1.activeStatus === 'CASTING' ? player1.name : player2.name
        } cast [${activeJutsuFX.name}] (${activeJutsuFX.japaneseName || 'Ninjutsu'})!`
      );

      const timer = setTimeout(() => {
        setClashState((prev) => ({ ...prev, active: false }));
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [activeJutsuFX, player1.activeStatus, player1.name, player2.name]);

  // Trigger simultaneous clash if both sequences have seals
  useEffect(() => {
    if (localSequence.length >= 3 && opponentSequence.length >= 3) {
      setBattleMessage('⚡ : Dual Shinobi seals resolving in real-time clash!');
    }
  }, [localSequence.length, opponentSequence.length]);

  const p1HpPercent = Math.max(0, Math.min(100, (player1.hp / player1.maxHp) * 100));
  const p2HpPercent = Math.max(0, Math.min(100, (player2.hp / player2.maxHp) * 100));

  const p1ChakraPercent = Math.max(0, Math.min(100, (player1.chakra / player1.maxChakra) * 100));
  const p2ChakraPercent = Math.max(0, Math.min(100, (player2.chakra / player2.maxChakra) * 100));

  const getHpBarClass = (hp: number, maxHp: number) => {
    const pct = (hp / maxHp) * 100;
    if (pct > 50) return 'firered-hp-green';
    if (pct > 20) return 'firered-hp-yellow';
    return 'firered-hp-red';
  };

  const allSealTypes = Object.keys(HAND_SEALS) as SealType[];

  return (
    <div
      className={`w-full max-w-5xl mx-auto flex flex-col my-1 select-none ${
        clashState.active ? 'animate-screen-shake' : ''
      }`}
    >
      {/* =========================================================================
          TOP STAGE (65% HEIGHT): VALLEY OF THE END 2D BATTLE SCREEN
         ========================================================================= */}
      <div className="w-full relative h-[360px] md:h-[400px] rounded-t-2xl overflow-hidden border-t-4 border-x-4 border-[#b45309] bg-gradient-to-b from-[#090d16] via-[#1a233a] to-[#0d1322] shadow-2xl">
        {/* Background Sky Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-indigo-950/80 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 scanline-bg opacity-15 pointer-events-none" />

        {/* BATTLE PAUSED OVERLAY WHEN PLAYER IS IN TRAINING MODE */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="px-6 py-4 rounded-2xl bg-slate-900/90 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)] flex flex-col items-center space-y-2 max-w-md">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 text-2xl animate-pulse">
                ⏸️
              </div>
              <h2 className="text-xl font-black font-cinzel text-amber-300 tracking-wider">
                BATTLE PAUSED
              </h2>
              <p className="text-xs text-slate-300 font-tech">
                Player is currently practicing in <strong className="text-cyan-400">Training Mode</strong>. Return to the Arena tab to resume the battle!
              </p>
            </div>
          </div>
        )}

        {/* Valley of the End Statue Silhouette Backdrop */}
        <div className="absolute top-0 inset-x-0 h-32 pointer-events-none flex items-end justify-between px-10 opacity-30">
          {/* Hashirama Statue */}
          <div className="flex flex-col items-center">
            <svg width="70" height="80" viewBox="0 0 100 120" fill="currentColor" className="text-amber-100/60">
              <path d="M20 120 L30 40 Q50 10 70 40 L80 120 Z" />
              <circle cx="50" cy="30" r="16" />
            </svg>
          </div>

          {/* Central Waterfall */}
          <div className="w-16 h-28 bg-gradient-to-b from-cyan-400/20 via-blue-500/30 to-cyan-300/40 blur-xs animate-pulse rounded-b-full border-x border-cyan-300/20" />

          {/* Madara Statue */}
          <div className="flex flex-col items-center">
            <svg width="70" height="80" viewBox="0 0 100 120" fill="currentColor" className="text-amber-100/60">
              <path d="M15 120 L25 35 Q50 5 75 35 L85 120 Z" />
            </svg>
          </div>
        </div>

        {/* Konoha Ninja Training Field Ground Terrain */}
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#14532d] via-[#166534]/80 to-transparent border-t border-amber-500/30" />

        {/* Kawarimi Substitution Log Decoration */}
        <div className="absolute bottom-16 left-5 text-xl opacity-70 pointer-events-none">
          🪵
        </div>

        {/* -----------------------------------------------------------------------
            FLOATING NINJA SCROLL PANEL 1: OPPONENT STATUS BOX (TOP-LEFT)
           ----------------------------------------------------------------------- */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 w-68 md:w-76 naruto-scroll-box p-2.5 shadow-2xl animate-fade-in">
          {/* Scroll Handle Wood Ends */}
          <div className="absolute -left-2.5 top-0 bottom-0 w-2.5 bg-[#78350f] rounded-l border border-[#451a03] shadow-md" />
          <div className="absolute -right-2.5 top-0 bottom-0 w-2.5 bg-[#78350f] rounded-r border border-[#451a03] shadow-md" />

          <div className="flex items-center justify-between font-bold text-xs tracking-wide border-b border-amber-800/40 pb-1 gap-2">
            <span className="min-w-0 flex-1 font-mono uppercase text-amber-950 flex items-center gap-1 font-black truncate">
              <span className="text-sm shrink-0">☁️</span>
              <span className="truncate">{player2.name}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-red-950 font-black bg-red-200/90 px-1.5 py-0.5 rounded border border-red-400">
              AKATSUKI • Lv.50
            </span>
          </div>

          {/* Opponent HP Bar */}
          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-red-900 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-red-700" />   (HP)
              </span>
              <span>{Math.round(p2HpPercent)}%</span>
            </div>
            <div className="w-full h-3 firered-hp-container">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getHpBarClass(
                  player2.hp,
                  player2.maxHp
                )}`}
                style={{ width: `${p2HpPercent}%` }}
              />
            </div>
          </div>

          {/* Opponent Chakra Bar */}
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-blue-900 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-cyan-600" />  (Chakra)
              </span>
              <span>{player2.chakra}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full border border-slate-950 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300"
                style={{ width: `${p2ChakraPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            OPPONENT AVATAR (TOP-RIGHT) - Akatsuki Rogue Shinobi Front View Stance
           ----------------------------------------------------------------------- */}
        <div className="absolute top-12 right-6 md:top-10 md:right-16 z-10 flex flex-col items-center">
          {/* Opponent Battle Pedestal */}
          <div className="w-40 h-14 md:w-48 md:h-16 battle-pedestal-opponent absolute -bottom-3 rounded-full border border-blue-400/30" />

          {/* Opponent Character Sprite */}
          <div
            className={`relative z-10 transition-transform duration-300 ${
              player2.activeStatus === 'HIT'
                ? 'animate-bounce opacity-80 filter drop-shadow-[0_0_20px_red]'
                : player2.activeStatus === 'CASTING'
                ? 'scale-110 filter drop-shadow-[0_0_25px_#ef4444]'
                : 'hover:scale-105'
            }`}
          >
            {/* Front View Akatsuki Shinobi SVG Sprite */}
            <svg
              width="120"
              height="135"
              viewBox="0 0 100 120"
              fill="none"
              className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.9)]"
            >
              {/* Akatsuki Cloak Body */}
              <path d="M20 115 L30 55 L50 48 L70 55 L80 115 Z" fill="#020617" stroke="#dc2626" strokeWidth="2" />
              {/* Red Cloud Motif */}
              <path d="M42 82 Q50 75 58 82 Q64 89 50 92 Q36 89 42 82 Z" fill="#dc2626" stroke="#f87171" strokeWidth="1" />
              {/* Collar */}
              <path d="M30 52 L50 40 L70 52 L60 64 L40 64 Z" fill="#7f1d1d" />
              {/* Face & Headband */}
              <path d="M36 30 Q50 24 64 30 L62 48 Q50 54 38 48 Z" fill="#fca5a5" />
              <rect x="33" y="26" width="34" height="9" rx="2" fill="#334155" />
              <rect x="40" y="27" width="20" height="7" rx="1" fill="#94a3b8" />
              {/* Slashing line across forehead protector */}
              <line x1="42" y1="28" x2="58" y2="33" stroke="#dc2626" strokeWidth="1.5" />
              {/* Hair */}
              <path d="M30 28 C24 16 34 10 40 18 C46 6 58 6 64 18 C70 10 80 16 74 28 Z" fill="#0f172a" />
              {/* Sharingan Eyes */}
              <circle cx="43" cy="36" r="3" fill="#ef4444" className="animate-pulse" />
              <circle cx="43" cy="36" r="1" fill="#020617" />
              <circle cx="57" cy="36" r="3" fill="#ef4444" className="animate-pulse" />
              <circle cx="57" cy="36" r="1" fill="#020617" />
            </svg>

            {/* Red Charging Aura */}
            {player2.isChargingChakra && (
              <div className="absolute inset-0 bg-red-600/30 rounded-full blur-xl animate-ping pointer-events-none" />
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            CENTER STAGE NINJUTSU CLASH ANIMATION LAYER
           ----------------------------------------------------------------------- */}
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          {clashState.active && (
            <div className="relative flex flex-col items-center justify-center">
              {/* Katon: Fireball Attack Animation */}
              {clashState.type === 'fireball' && (
                <div className="animate-fireball flex flex-col items-center">
                  <div className="text-7xl filter drop-shadow-[0_0_30px_#ff2e63]">🔥</div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 blur-md animate-spin" />
                </div>
              )}

              {/* Suiton: Water Dragon Animation */}
              {clashState.type === 'water' && (
                <div className="animate-water-dragon flex flex-col items-center">
                  <div className="text-7xl filter drop-shadow-[0_0_30px_#00f2fe]">🐉</div>
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-300 blur-md animate-pulse" />
                </div>
              )}

              {/* Raikiri / Lightning Animation */}
              {clashState.type === 'lightning' && (
                <div className="animate-clash-burst flex flex-col items-center">
                  <div className="text-7xl filter drop-shadow-[0_0_30px_#9d4edd]">⚡</div>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-300 blur-lg animate-ping" />
                </div>
              )}

              {/* Rasengan Animation */}
              {clashState.type === 'rasengan' && (
                <div className="animate-rasengan flex flex-col items-center">
                  <div className="text-7xl filter drop-shadow-[0_0_35px_#00f2fe]">🌀</div>
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 blur-md animate-spin" />
                </div>
              )}

              {/* Japanese Kanji Callout Banner */}
              {clashState.title && (
                <div className="mt-3 px-5 py-2 rounded-2xl bg-black/95 border-2 border-amber-500 text-amber-300 font-extrabold text-sm font-cinzel shadow-2xl animate-bounce tracking-widest text-center">
                  <span className="block text-[11px] font-mono text-amber-400 font-black uppercase">
                    {clashState.kanji}
                  </span>
                  <span>{clashState.title}</span>
                  {clashState.japaneseName && (
                    <span className="block text-[10px] font-mono text-amber-200/80 italic">
                      {clashState.japaneseName}
                    </span>
                  )}
                  {clashState.damage && (
                    <span className="block text-[10px] font-mono text-red-400 font-bold">
                      -{clashState.damage} HP DAMAGE!
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* -----------------------------------------------------------------------
            WEBCAM / MEDIAPIPE PIP MONITOR OVERLAY (BOTTOM-CENTER OF ARENA)
           ----------------------------------------------------------------------- */}
        {showWebcamPip && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-56 md:w-72 bg-slate-950/80 border-2 border-amber-500/80 rounded-2xl p-1.5 shadow-[0_0_25px_rgba(245,158,11,0.4)] backdrop-blur-md transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 px-2 py-0.5 mb-1 bg-amber-950/60 rounded-lg border border-amber-600/40">
              <span className="flex items-center gap-1.5 font-extrabold tracking-wider">
                <Camera className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> VISION SENSOR ({fps} FPS)
              </span>
              <button
                onClick={() => setShowWebcamPip(false)}
                className="text-amber-400 hover:text-white font-black px-1 text-xs"
                title="Minimize PIP"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video bg-black/40 rounded-xl overflow-hidden border border-amber-500/30">
              <WebcamCanvasOverlay
                videoRef={videoRef}
                canvasRef={canvasRef}
                isCameraActive={isCameraActive}
                cameraError={cameraError}
                fps={fps}
                isSimulatedMode={isSimulatedMode}
                onToggleCamera={onToggleCamera}
                playerLabel=""
              />
            </div>
          </div>
        )}

        {!showWebcamPip && (
          <button
            onClick={() => setShowWebcamPip(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-xl bg-slate-900/90 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-2xl"
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" /> Show Camera PIP
          </button>
        )}

        {/* -----------------------------------------------------------------------
            PLAYER AVATAR (BOTTOM-LEFT) - Konoha Shinobi Back View Hero Stance
           ----------------------------------------------------------------------- */}
        <div className="absolute bottom-4 left-6 md:bottom-6 md:left-14 z-10 flex flex-col items-center">
          {/* Player Battle Pedestal */}
          <div className="w-44 h-16 md:w-56 md:h-20 battle-pedestal-player absolute -bottom-3 rounded-full border border-emerald-400/30" />

          {/* Player Character Sprite */}
          <div
            className={`relative z-10 transition-transform duration-300 ${
              player1.activeStatus === 'HIT'
                ? 'animate-bounce opacity-80 filter drop-shadow-[0_0_20px_red]'
                : player1.activeStatus === 'CASTING'
                ? 'scale-110 filter drop-shadow-[0_0_25px_#00f2fe]'
                : 'hover:scale-105'
            }`}
          >
            {/* Clean Back View Konoha Shinobi SVG Hero Artwork */}
            <svg
              width="135"
              height="150"
              viewBox="0 0 100 120"
              fill="none"
              className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.9)]"
            >
              {/* Naruto Orange/Black Jacket Back */}
              <path d="M20 115 L30 55 L50 48 L70 55 L80 115 Z" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
              {/* Green Jonin Flak Vest */}
              <path d="M30 58 L50 52 L70 58 L76 92 L24 92 Z" fill="#15803d" stroke="#22c55e" strokeWidth="1.5" />
              {/* Red Uzumaki Whirlpool Spiral Crest */}
              <circle cx="50" cy="74" r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
              {/* Scroll Strap */}
              <line x1="30" y1="62" x2="70" y2="90" stroke="#b45309" strokeWidth="2.5" />
              {/* Hair & Headband Ribbon Tail */}
              <path d="M34 35 C28 22 36 15 44 22 C50 8 60 8 64 22 C70 15 78 22 72 35 Q50 42 34 35 Z" fill="#eab308" />
              <rect x="36" y="32" width="28" height="7" rx="2" fill="#1d4ed8" />
              {/* Flowing Blue Ribbon Tails */}
              <path d="M60 35 Q72 42 80 38 L84 45 Q70 48 60 38 Z" fill="#1d4ed8" className="animate-pulse" />
              <path d="M60 37 Q75 50 78 54 L72 57 Q66 48 60 39 Z" fill="#1e40af" />
            </svg>

            {/* Cyan Chakra Aura Pulse Effect */}
            {player1.isChargingChakra && (
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-ping pointer-events-none" />
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            FLOATING NINJA SCROLL PANEL 2: LOCAL PLAYER STATUS BOX (BOTTOM-RIGHT)
           ----------------------------------------------------------------------- */}
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20 w-68 md:w-76 naruto-scroll-box p-2.5 shadow-2xl animate-fade-in">
          {/* Scroll Handle Wood Ends */}
          <div className="absolute -left-2.5 top-0 bottom-0 w-2.5 bg-[#78350f] rounded-l border border-[#451a03] shadow-md" />
          <div className="absolute -right-2.5 top-0 bottom-0 w-2.5 bg-[#78350f] rounded-r border border-[#451a03] shadow-md" />

          <div className="flex items-center justify-between font-bold text-xs tracking-wide border-b border-amber-800/40 pb-1 gap-2">
            <span className="min-w-0 flex-1 font-mono uppercase text-amber-950 flex items-center gap-1 font-black truncate">
              <span className="text-sm shrink-0">🍃</span>
              <span className="truncate">{player1.name}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-cyan-950 font-black bg-cyan-200/90 px-1.5 py-0.5 rounded border border-cyan-400">
              KONOHA • Lv.50
            </span>
          </div>

          {/* Local Player HP Bar */}
          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-red-900 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-red-700" />   (HP)
              </span>
              <span>
                {player1.hp} / {player1.maxHp}
              </span>
            </div>
            <div className="w-full h-3 firered-hp-container">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getHpBarClass(
                  player1.hp,
                  player1.maxHp
                )}`}
                style={{ width: `${p1HpPercent}%` }}
              />
            </div>
          </div>

          {/* Local Player Chakra Bar */}
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-blue-900 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-cyan-600" />  (Chakra)
              </span>
              <span>
                {player1.chakra} / {player1.maxChakra}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full border border-slate-950 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300"
                style={{ width: `${p1ChakraPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM CONSOLE: MASTER NINJA SCROLL UI (Hand Sign Streams & Seals)
         ========================================================================= */}
      <div className="w-full naruto-scroll-box p-3 md:p-4 flex flex-col space-y-3 rounded-b-2xl border-b-4 border-x-4 border-[#b45309] shadow-2xl">
        {/* Retro Ninja Scroll Prompt Box */}
        <div className="w-full p-2 rounded-lg bg-[#271003] border-2 border-[#b45309] text-amber-200 font-mono text-xs flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 truncate">
            <Scroll className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <p className="font-semibold truncate">{battleMessage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold">
              {connectionStatus === 'CONNECTED' ? `P2P MATCH (${roomId})` : 'SOLO / AI MATCH'}
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            HAND SIGN STREAMS: 'MY SIGNS' AND 'ENEMY SIGNS'
           ----------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Stream 1: MY SIGNS */}
          <div className="flex flex-col space-y-1 p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-md">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
              <span className="flex items-center gap-1.5 font-black">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                   • MY SIGNS ({localSequence.length}/8)
              </span>
              {localSequence.length > 0 && (
                <button
                  onClick={onClearSequence}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="min-h-[52px] w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 overflow-x-auto">
              {localSequence.length === 0 ? (
                <span className="text-slate-500 text-[11px] font-mono italic">
                  Weave seals with keys 1-9, Q, W, E or vision camera!
                </span>
              ) : (
                localSequence.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-1 shrink-0 animate-scale-in">
                    <SealBadge sealType={item.type} index={idx} isActive={true} />
                    {idx < localSequence.length - 1 && (
                      <span className="text-cyan-500 font-bold text-xs">→</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stream 2: ENEMY SIGNS */}
          <div className="flex flex-col space-y-1 p-2.5 rounded-xl bg-slate-950/90 border border-red-500/40 shadow-md">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-red-300">
              <span className="flex items-center gap-1.5 font-black">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  • ENEMY SIGNS ({opponentSequence.length}/8)
              </span>
              <button
                onClick={onAIOpponentAction}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40 flex items-center gap-1"
                title="Simulate Opponent Weaving Signs"
              >
                <Bot className="w-3 h-3 text-amber-400" /> Sim Opponent
              </button>
            </div>

            <div className="min-h-[52px] w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 overflow-x-auto">
              {opponentSequence.length === 0 ? (
                <span className="text-slate-500 text-[11px] font-mono italic">
                  Awaiting enemy hand seal signals over DataChannel...
                </span>
              ) : (
                opponentSequence.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-1 shrink-0 animate-scale-in">
                    <SealBadge sealType={item.type} index={idx} isActive={true} />
                    {idx < opponentSequence.length - 1 && (
                      <span className="text-red-500 font-bold text-xs">→</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            ACTION & ZODIAC HAND SEAL PALETTE CONTROLS
           ----------------------------------------------------------------------- */}
        <div className="space-y-1.5 pt-1 border-t border-amber-900/40">
          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono font-bold text-amber-950">
            <span> (Zodiac Hand Seals - Click or Press 1-9, Q, W, E):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChargeChakra('p1')}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-extrabold text-[11px] shadow-md border border-cyan-400/40 transition flex items-center gap-1 active:scale-95"
              >
                <Zap className="w-3 h-3 fill-cyan-300" /> Charge Chakra (+25)
              </button>

              <button
                onClick={onOpenJutsuLibrary}
                className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 font-extrabold text-[11px] border border-purple-500/40 transition flex items-center gap-1 active:scale-95"
              >
                <BookOpen className="w-3 h-3 text-purple-400" /> Ninjutsu Scroll
              </button>
            </div>
          </div>

          {/* 12 Zodiac Seals Grid Selector */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1">
            {allSealTypes.map((sealType) => (
              <SealBadge
                key={sealType}
                sealType={sealType}
                onClick={() => onRegisterSeal(sealType)}
                showKeyHint={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
