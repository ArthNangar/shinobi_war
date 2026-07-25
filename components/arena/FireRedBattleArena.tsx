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
    '忍 術 発 動: Channel Chakra into Hand Seals to unleash powerful Ninjutsu!'
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
        Fire: '火 遁 • KATON',
        Water: '水 遁 • SUITON',
        Lightning: '雷 遁 • RAITON',
        Secret: '秘 術 • HIJUTSU',
        Earth: '土 遁 • DOTON',
        Wind: '風 遁 • FUTON',
      };

      setClashState({
        active: true,
        type: clashType,
        caster: player1.activeStatus === 'CASTING' ? 'p1' : 'p2',
        damage: activeJutsuFX.damage,
        title: activeJutsuFX.name,
        japaneseName: activeJutsuFX.japaneseName,
        kanji: kanjiMap[activeJutsuFX.element] || '忍 術',
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
      setBattleMessage('⚡ 終末の谷・印結び: Dual Shinobi seals resolving in real-time clash!');
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
      className={`w-full max-w-6xl mx-auto flex flex-col my-2 select-none ${
        clashState.active ? 'animate-screen-shake' : ''
      }`}
    >
      {/* =========================================================================
          TOP 70%: THE STAGE - VALLEY OF THE END (Shumatsu no Tani) 2D ARENA
         ========================================================================= */}
      <div className="w-full relative h-[500px] md:h-[540px] rounded-t-2xl overflow-hidden border-t-4 border-x-4 border-[#b45309] bg-gradient-to-b from-[#090d16] via-[#1a233a] to-[#0d1322] shadow-2xl">
        {/* Background Sky & Valley Waterfall Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-indigo-950/80 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 scanline-bg opacity-20 pointer-events-none" />

        {/* Valley of the End (終末の谷) Giant Stone Statues Backdrop */}
        <div className="absolute top-0 inset-x-0 h-48 pointer-events-none flex items-end justify-between px-6 opacity-35">
          {/* Hashirama Senju Statue (Left Cliff) */}
          <div className="flex flex-col items-center">
            <svg width="100" height="120" viewBox="0 0 100 120" fill="currentColor" className="text-amber-100/60">
              <path d="M20 120 L30 40 Q50 10 70 40 L80 120 Z" />
              <circle cx="50" cy="30" r="16" />
              <rect x="35" y="15" width="30" height="8" rx="2" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-amber-200 tracking-wider">初 代 (HASHIRAMA)</span>
          </div>

          {/* Central Waterfall Cascade */}
          <div className="w-20 h-44 bg-gradient-to-b from-cyan-400/20 via-blue-500/30 to-cyan-300/40 blur-sm animate-pulse rounded-b-full border-x border-cyan-300/20 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-cyan-200 opacity-60">滝 (WATERFALL)</span>
          </div>

          {/* Madara Uchiha Statue (Right Cliff) */}
          <div className="flex flex-col items-center">
            <svg width="100" height="120" viewBox="0 0 100 120" fill="currentColor" className="text-amber-100/60">
              <path d="M15 120 L25 35 Q50 5 75 35 L85 120 Z" />
              <path d="M25 30 C15 15 35 5 50 12 C65 5 85 15 75 30 Z" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-amber-200 tracking-wider">マ ダ ラ (MADARA)</span>
          </div>
        </div>

        {/* Ninja Training Field Ground Terrain (Valley Lake & Forest Edge) */}
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#14532d] via-[#166534]/70 to-transparent border-t border-amber-500/40" />

        {/* Kawarimi Substitution Log & Leaf Particles */}
        <div className="absolute bottom-20 left-6 text-2xl opacity-70 pointer-events-none" title="Kawarimi Log">
          🪵
        </div>
        <div className="absolute top-36 left-1/4 text-xl opacity-50 pointer-events-none animate-bounce">
          🍃
        </div>
        <div className="absolute top-28 right-1/3 text-lg opacity-40 pointer-events-none">
          🍥
        </div>

        {/* -----------------------------------------------------------------------
            FLOATING NINJA SCROLL PANEL 1: OPPONENT STATUS BOX (TOP-LEFT)
           ----------------------------------------------------------------------- */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 w-64 md:w-72 naruto-scroll-box p-3 animate-fade-in relative shadow-2xl">
          {/* Scroll Handle Edges (Makimono Wood Ends) */}
          <div className="absolute -left-3 top-0 bottom-0 w-3.5 bg-[#78350f] rounded-l-md border-2 border-[#451a03] shadow-md flex items-center justify-center">
            <div className="w-1.5 h-full bg-[#3f1d0b] rounded-sm" />
          </div>
          <div className="absolute -right-3 top-0 bottom-0 w-3.5 bg-[#78350f] rounded-r-md border-2 border-[#451a03] shadow-md flex items-center justify-center">
            <div className="w-1.5 h-full bg-[#3f1d0b] rounded-sm" />
          </div>

          <div className="flex items-center justify-between font-bold text-xs md:text-sm tracking-wide border-b border-amber-800/40 pb-1">
            <span className="truncate font-mono uppercase text-amber-950 flex items-center gap-1.5 font-black">
              <span className="text-sm">☁️</span>
              {player2.name}
            </span>
            <span className="font-mono text-[11px] text-red-950 font-black bg-red-200/90 px-1.5 py-0.5 rounded border border-red-400">
              AKATSUKI • Lv.50
            </span>
          </div>

          {/* Opponent HP Bar */}
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-red-900 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-red-700" /> 体 力 (HP)
              </span>
              <span>{Math.round(p2HpPercent)}%</span>
            </div>
            <div className="w-full h-3.5 firered-hp-container">
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
          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-blue-900 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-cyan-600" /> チャクラ (Chakra)
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
            OPPONENT AVATAR (TOP-RIGHT) - Akatsuki Rogue Shinobi Front Stance
           ----------------------------------------------------------------------- */}
        <div className="absolute top-16 right-8 md:top-14 md:right-20 z-10 flex flex-col items-center">
          {/* Opponent Battle Pedestal */}
          <div className="w-44 h-16 md:w-56 md:h-20 battle-pedestal-opponent absolute -bottom-4 rounded-full border border-blue-400/30" />

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
            {/* Front View Rogue Shinobi SVG with Sharingan & Akatsuki Clouds */}
            <svg
              width="135"
              height="155"
              viewBox="0 0 100 120"
              fill="none"
              className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.9)]"
            >
              {/* Cloak & Collar */}
              <path d="M18 115 L28 60 L50 50 L72 60 L82 115 Z" fill="#0f172a" stroke="#dc2626" strokeWidth="2" />
              <path d="M35 60 Q50 75 65 60 L75 115 L25 115 Z" fill="#020617" />
              {/* Akatsuki Red Cloud Motif */}
              <path d="M42 85 Q50 78 58 85 Q64 92 50 95 Q36 92 42 85 Z" fill="#dc2626" stroke="#f87171" strokeWidth="1" />
              {/* High Collar */}
              <path d="M28 55 L50 42 L72 55 L62 68 L38 68 Z" fill="#7f1d1d" />
              {/* Face & Headband */}
              <path d="M36 32 Q50 26 64 32 L62 52 Q50 58 38 52 Z" fill="#fca5a5" />
              <rect x="32" y="28" width="36" height="10" rx="2" fill="#334155" />
              <rect x="40" y="29" width="20" height="8" rx="1" fill="#94a3b8" />
              {/* Crossed Leaf Symbol for Rogue Shinobi */}
              <line x1="42" y1="33" x2="58" y2="33" stroke="#020617" strokeWidth="2" />
              <line x1="42" y1="30" x2="58" y2="36" stroke="#dc2626" strokeWidth="1.5" />
              {/* Hair */}
              <path d="M28 30 C22 18 32 12 38 20 C44 8 56 8 62 20 C68 12 78 18 72 30 Z" fill="#020617" />
              {/* Sharingan Eyes (Red Tomoe Pupils) */}
              <circle cx="43" cy="38" r="3.5" fill="#ef4444" className="animate-pulse" />
              <circle cx="43" cy="38" r="1.2" fill="#020617" />
              <circle cx="57" cy="38" r="3.5" fill="#ef4444" className="animate-pulse" />
              <circle cx="57" cy="38" r="1.2" fill="#020617" />
            </svg>

            {/* Casting / Charging Red Aura Effect */}
            {player2.isChargingChakra && (
              <div className="absolute inset-0 bg-red-600/30 rounded-full blur-xl animate-ping pointer-events-none" />
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            CENTER STAGE VISUAL CLASH & NINJUTSU ANIMATION LAYER
           ----------------------------------------------------------------------- */}
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          {clashState.active && (
            <div className="relative flex flex-col items-center justify-center">
              {/* Katon: Fireball Attack Animation */}
              {clashState.type === 'fireball' && (
                <div className="animate-fireball flex flex-col items-center">
                  <div className="text-8xl filter drop-shadow-[0_0_35px_#ff2e63]">🔥</div>
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 blur-md animate-spin" />
                </div>
              )}

              {/* Suiton: Water Dragon Animation */}
              {clashState.type === 'water' && (
                <div className="animate-water-dragon flex flex-col items-center">
                  <div className="text-8xl filter drop-shadow-[0_0_35px_#00f2fe]">🐉</div>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-300 blur-md animate-pulse" />
                </div>
              )}

              {/* Raikiri / Lightning Attack Animation */}
              {clashState.type === 'lightning' && (
                <div className="animate-clash-burst flex flex-col items-center">
                  <div className="text-8xl filter drop-shadow-[0_0_35px_#9d4edd]">⚡</div>
                  <div className="w-36 h-36 rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-300 blur-lg animate-ping" />
                </div>
              )}

              {/* Rasengan / Swirling Chakra Orb Animation */}
              {clashState.type === 'rasengan' && (
                <div className="animate-rasengan flex flex-col items-center">
                  <div className="text-8xl filter drop-shadow-[0_0_40px_#00f2fe]">🌀</div>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 blur-md animate-spin" />
                </div>
              )}

              {/* Japanese Kanji Callout Banner */}
              {clashState.title && (
                <div className="mt-4 px-6 py-2.5 rounded-2xl bg-black/95 border-2 border-amber-500 text-amber-300 font-extrabold text-sm md:text-lg font-cinzel shadow-2xl animate-bounce tracking-widest text-center">
                  <span className="block text-xs font-mono text-amber-400 font-black uppercase">
                    {clashState.kanji}
                  </span>
                  <span>{clashState.title}</span>
                  {clashState.japaneseName && (
                    <span className="block text-xs font-mono text-amber-200/80 italic">
                      {clashState.japaneseName}
                    </span>
                  )}
                  {clashState.damage && (
                    <span className="block text-xs font-mono text-red-400 font-bold">
                      -{clashState.damage} HP DAMAGE!
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* -----------------------------------------------------------------------
            WEBCAM / MEDIAPIPE PIP MONITOR OVERLAY
           ----------------------------------------------------------------------- */}
        {showWebcamPip && (
          <div className="absolute top-4 right-4 md:right-1/2 md:translate-x-1/2 z-20 w-44 md:w-52 bg-slate-950/90 border-2 border-amber-500/60 rounded-xl p-1.5 shadow-2xl backdrop-blur-md transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 px-1 mb-1">
              <span className="flex items-center gap-1 font-bold">
                <Camera className="w-3 h-3 text-amber-400" /> VISION MONITOR ({fps} FPS)
              </span>
              <button
                onClick={() => setShowWebcamPip(false)}
                className="text-slate-400 hover:text-white font-bold"
                title="Minimize PIP"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800">
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
            className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold hover:bg-slate-800 transition flex items-center gap-1"
          >
            <Tv className="w-3 h-3 text-amber-400" /> Show Camera PIP
          </button>
        )}

        {/* -----------------------------------------------------------------------
            PLAYER AVATAR (BOTTOM-LEFT) - Konoha Shinobi Back View Stance
           ----------------------------------------------------------------------- */}
        <div className="absolute bottom-6 left-8 md:bottom-8 md:left-20 z-10 flex flex-col items-center">
          {/* Player Battle Pedestal */}
          <div className="w-52 h-20 md:w-64 md:h-24 battle-pedestal-player absolute -bottom-4 rounded-full border border-emerald-400/30" />

          {/* Player Character Sprite (Back View with Orange Jumpsuit Accents) */}
          <div
            className={`relative z-10 transition-transform duration-300 ${
              player1.activeStatus === 'HIT'
                ? 'animate-bounce opacity-80 filter drop-shadow-[0_0_20px_red]'
                : player1.activeStatus === 'CASTING'
                ? 'scale-110 filter drop-shadow-[0_0_25px_#00f2fe]'
                : 'hover:scale-105'
            }`}
          >
            {/* Back View Konoha Shinobi SVG Silhouette Art */}
            <svg
              width="155"
              height="175"
              viewBox="0 0 100 120"
              fill="none"
              className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.9)]"
            >
              {/* Back Torso & Naruto Orange/Black Jacket */}
              <path d="M15 115 L25 55 L50 48 L75 55 L85 115 Z" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
              {/* Konoha Jonin Flak Vest */}
              <path d="M28 58 L50 52 L72 58 L78 95 L22 95 Z" fill="#15803d" stroke="#22c55e" strokeWidth="1.5" />
              {/* Red Uzumaki Whirlpool Spiral Crest on Back */}
              <circle cx="50" cy="76" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
              {/* Scroll Strap */}
              <line x1="28" y1="62" x2="72" y2="92" stroke="#b45309" strokeWidth="3" />
              {/* Hair & Headband Ribbon Tail */}
              <path d="M32 35 C25 22 35 15 42 22 C48 8 58 8 62 22 C68 15 78 22 72 35 Q50 42 32 35 Z" fill="#eab308" />
              <rect x="34" y="32" width="32" height="7" rx="2" fill="#1d4ed8" />
              {/* Blue Headband Ribbons Flowing in Wind */}
              <path d="M62 35 Q75 42 84 38 L88 45 Q72 48 62 38 Z" fill="#1d4ed8" className="animate-pulse" />
              <path d="M62 37 Q78 50 82 55 L76 58 Q68 48 62 39 Z" fill="#1e40af" />
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
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 w-64 md:w-72 naruto-scroll-box p-3 animate-fade-in relative shadow-2xl">
          {/* Scroll Handle Edges */}
          <div className="absolute -left-3 top-0 bottom-0 w-3.5 bg-[#78350f] rounded-l-md border-2 border-[#451a03] shadow-md flex items-center justify-center">
            <div className="w-1.5 h-full bg-[#3f1d0b] rounded-sm" />
          </div>
          <div className="absolute -right-3 top-0 bottom-0 w-3.5 bg-[#78350f] rounded-r-md border-2 border-[#451a03] shadow-md flex items-center justify-center">
            <div className="w-1.5 h-full bg-[#3f1d0b] rounded-sm" />
          </div>

          <div className="flex items-center justify-between font-bold text-xs md:text-sm tracking-wide border-b border-amber-800/40 pb-1">
            <span className="truncate font-mono uppercase text-amber-950 flex items-center gap-1.5 font-black">
              <span className="text-sm">🍃</span>
              {player1.name}
            </span>
            <span className="font-mono text-[11px] text-cyan-950 font-black bg-cyan-200/90 px-1.5 py-0.5 rounded border border-cyan-400">
              KONOHA • Lv.50
            </span>
          </div>

          {/* Local Player HP Bar */}
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-red-900 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-red-700" /> 体 力 (HP)
              </span>
              <span>
                {player1.hp} / {player1.maxHp}
              </span>
            </div>
            <div className="w-full h-3.5 firered-hp-container">
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
          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-amber-950">
              <span className="text-blue-900 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-cyan-600" /> チャクラ (Chakra)
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
          BOTTOM 30%: MASTER NINJA SCROLL UI CONSOLE (Naruto Bordered Aesthetic)
         ========================================================================= */}
      <div className="w-full naruto-scroll-box p-4 md:p-5 flex flex-col space-y-4 rounded-b-2xl border-b-4 border-x-4 border-[#b45309] relative shadow-2xl">
        {/* Retro Ninja Scroll Prompt Box */}
        <div className="w-full p-2.5 rounded-lg bg-[#271003] border-2 border-[#b45309] text-amber-200 font-mono text-xs md:text-sm flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <Scroll className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <p className="font-semibold">{battleMessage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold">
              {connectionStatus === 'CONNECTED' ? `P2P MATCH (${roomId})` : 'SOLO / AI MATCH'}
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            HAND SIGN STREAMS: 'MY SIGNS' AND 'ENEMY SIGNS'
           ----------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Stream 1: MY SIGNS (Local Player Hand Sign Stream) */}
          <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-md">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
              <span className="flex items-center gap-1.5 font-black">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                印 結 び • MY SIGNS ({localSequence.length}/8)
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

            <div className="min-h-[60px] w-full p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 overflow-x-auto">
              {localSequence.length === 0 ? (
                <span className="text-slate-500 text-xs font-mono italic">
                  No seals weaved yet. Click seals below or use camera!
                </span>
              ) : (
                localSequence.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-1.5 shrink-0 animate-scale-in">
                    <SealBadge sealType={item.type} index={idx} isActive={true} />
                    {idx < localSequence.length - 1 && (
                      <span className="text-cyan-500 font-bold text-xs">→</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stream 2: ENEMY SIGNS (Opponent Hand Sign Stream) */}
          <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-slate-950/90 border border-red-500/40 shadow-md">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-red-300">
              <span className="flex items-center gap-1.5 font-black">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                敵 印 • ENEMY SIGNS ({opponentSequence.length}/8)
              </span>
              <button
                onClick={onAIOpponentAction}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40 flex items-center gap-1"
                title="Simulate Opponent Weaving Signs"
              >
                <Bot className="w-3 h-3 text-amber-400" /> Sim Opponent
              </button>
            </div>

            <div className="min-h-[60px] w-full p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 overflow-x-auto">
              {opponentSequence.length === 0 ? (
                <span className="text-slate-500 text-xs font-mono italic">
                  Awaiting enemy hand seal signals over DataChannel...
                </span>
              ) : (
                opponentSequence.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-1.5 shrink-0 animate-scale-in">
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
        <div className="space-y-2 pt-1 border-t border-amber-900/40">
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono font-bold text-amber-950">
            <span>十二支印 (Zodiac Hand Seals - Click or Press 1-9, Q, W, E):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChargeChakra('p1')}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-extrabold text-xs shadow-md border border-cyan-400/40 transition flex items-center gap-1 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-cyan-300" /> Charge Chakra (+25)
              </button>

              <button
                onClick={onOpenJutsuLibrary}
                className="px-3 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 font-extrabold text-xs border border-purple-500/40 transition flex items-center gap-1 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Ninjutsu Scroll
              </button>
            </div>
          </div>

          {/* 12 Zodiac Seals Grid Selector */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
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
