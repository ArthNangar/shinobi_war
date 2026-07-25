'use client';

import React from 'react';
import { PlayerState } from '@/types/shinobi';
import { Zap, Shield, Flame, Skull, Trophy } from 'lucide-react';

interface PlayerCardProps {
  player: PlayerState;
  isOpponent?: boolean;
  onAIActionTrigger?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isOpponent = false,
  onAIActionTrigger,
}) => {
  const isHit = player.activeStatus === 'HIT';
  const isCasting = player.activeStatus === 'CASTING';
  const isDefeated = player.activeStatus === 'DEFEATED';

  return (
    <div
      className={`relative w-full h-full min-h-[320px] max-h-[500px] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col items-center justify-center p-6 ${
        isHit
          ? 'border-red-500 bg-red-950/40 shadow-2xl shadow-red-500/50 animate-bounce'
          : isCasting
          ? 'border-amber-400 bg-amber-950/30 shadow-2xl shadow-amber-500/40'
          : isDefeated
          ? 'border-slate-800 bg-slate-950/90 grayscale opacity-80'
          : 'border-red-500/30 bg-[#100D1C] shadow-2xl'
      }`}
    >
      {/* Background Stance Graphic */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-slate-950/90 pointer-events-none" />

      {/* Opponent Avatar Badge */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div
          className={`w-28 h-28 md:w-36 md:h-36 rounded-full border-4 flex items-center justify-center relative shadow-2xl transition-transform ${
            isCasting
              ? 'border-amber-400 scale-105 shadow-amber-500/50'
              : 'border-red-500/60 shadow-red-500/30'
          }`}
        >
          {isDefeated ? (
            <Skull className="w-16 h-16 text-slate-500 animate-pulse" />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-900 via-red-900 to-amber-700 flex items-center justify-center text-4xl">
              🥷
            </div>
          )}

          {/* Status Aura Ring */}
          <div className="absolute -inset-2 rounded-full border border-red-500/20 animate-spin-slow pointer-events-none" />
        </div>

        {/* Player Meta Info */}
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-red-100 font-cinzel">
            {player.name}
          </h3>
          <p className="text-xs font-semibold text-red-400 tracking-wider uppercase font-tech">
            {player.title} • {player.village}
          </p>
        </div>

        {/* Active Action Banner */}
        {player.lastCastJutsu && (
          <div className="px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold animate-pulse shadow-lg flex items-center gap-2">
            <span>{player.lastCastJutsu.icon}</span>
            <span>{player.lastCastJutsu.name}</span>
          </div>
        )}

        {/* AI Action Trigger Button for practice testing */}
        {isOpponent && onAIActionTrigger && !isDefeated && (
          <button
            onClick={onAIActionTrigger}
            className="mt-2 px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-xs font-bold transition shadow-lg flex items-center gap-2 active:scale-95"
          >
            <Flame className="w-4 h-4 text-red-400" /> Counter Attack (AI)
          </button>
        )}
      </div>
    </div>
  );
};
