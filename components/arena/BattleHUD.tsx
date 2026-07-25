'use client';

import React from 'react';
import { Heart, Zap, Shield, Flame, Swords } from 'lucide-react';
import { PlayerState } from '@/types/shinobi';

interface BattleHUDProps {
  player1: PlayerState;
  player2: PlayerState;
  battleStatus: 'PREPARE' | 'FIGHTING' | 'ENDED';
  winner: string | null;
  onChargeP1Chakra?: () => void;
  onChargeP2Chakra?: () => void;
}

export const BattleHUD: React.FC<BattleHUDProps> = React.memo(({
  player1,
  player2,
  battleStatus,
  winner,
  onChargeP1Chakra,
  onChargeP2Chakra,
}) => {
  const p1HpPercent = Math.max(0, Math.min(100, (player1.hp / player1.maxHp) * 100));
  const p2HpPercent = Math.max(0, Math.min(100, (player2.hp / player2.maxHp) * 100));

  const p1ChakraPercent = Math.max(0, Math.min(100, (player1.chakra / player1.maxChakra) * 100));
  const p2ChakraPercent = Math.max(0, Math.min(100, (player2.chakra / player2.maxChakra) * 100));

  return (
    <div className="w-full ninja-glass rounded-2xl p-4 md:p-5 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
      {/* Top Banner & Match Control */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Player 1 HUD (Left) */}
        <div className="col-span-5 flex flex-col space-y-2">
          {/* Header Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
              <h2 className="text-base md:text-lg font-bold tracking-wide text-cyan-200 font-cinzel">
                {player1.name}
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-cyan-400/80 uppercase">
              {player1.village} • {player1.wins} WINS
            </span>
          </div>

          {/* Player 1 Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1 text-red-400">
                <Heart className="w-3.5 h-3.5 fill-red-500" /> HEALTH
              </span>
              <span className="font-mono text-red-300">
                {player1.hp} / {player1.maxHp}
              </span>
            </div>
            <div className="w-full h-5 bg-slate-950/80 rounded-full border border-red-900/50 overflow-hidden relative p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full hp-bar-fill ${p1HpPercent < 25 ? 'animate-pulse' : ''}`}
                style={{ width: `${p1HpPercent}%` }}
              />
            </div>
          </div>

          {/* Player 1 Chakra Meter */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1 text-cyan-400">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" /> CHAKRA
              </span>
              <span className="font-mono text-cyan-300">
                {player1.chakra} / {player1.maxChakra}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-950/80 rounded-full border border-cyan-900/50 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full chakra-bar-fill"
                style={{ width: `${p1ChakraPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center VS Crest & Match State */}
        <div className="col-span-2 flex flex-col items-center justify-center relative">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-red-600 via-slate-900 to-cyan-600 border-2 border-slate-700 shadow-xl flex items-center justify-center z-10">
            <Swords className="w-6 h-6 md:w-7 md:h-7 text-amber-300 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-amber-400 font-cinzel mt-1 tracking-widest uppercase">
            VS ARENA
          </span>
        </div>

        {/* Player 2 HUD (Right) */}
        <div className="col-span-5 flex flex-col space-y-2 text-right">
          {/* Header Tag */}
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold tracking-wide text-red-200 font-cinzel">
                {player2.name}
              </h2>
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500/50" />
            </div>
            <span className="text-xs font-mono font-semibold text-red-400/80 uppercase">
              {player2.village} • {player2.wins} WINS
            </span>
          </div>

          {/* Player 2 Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 flex-row-reverse">
              <span className="flex items-center gap-1 text-red-400">
                HEALTH <Heart className="w-3.5 h-3.5 fill-red-500" />
              </span>
              <span className="font-mono text-red-300">
                {player2.hp} / {player2.maxHp}
              </span>
            </div>
            <div className="w-full h-5 bg-slate-950/80 rounded-full border border-red-900/50 overflow-hidden relative p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full hp-bar-fill float-right ${p2HpPercent < 25 ? 'animate-pulse' : ''}`}
                style={{ width: `${p2HpPercent}%` }}
              />
            </div>
          </div>

          {/* Player 2 Chakra Meter */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 flex-row-reverse">
              <span className="flex items-center gap-1 text-cyan-400">
                CHAKRA <Zap className="w-3.5 h-3.5 fill-cyan-400" />
              </span>
              <span className="font-mono text-cyan-300">
                {player2.chakra} / {player2.maxChakra}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-950/80 rounded-full border border-cyan-900/50 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full chakra-bar-fill float-right"
                style={{ width: `${p2ChakraPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BattleHUD.displayName = 'BattleHUD';
