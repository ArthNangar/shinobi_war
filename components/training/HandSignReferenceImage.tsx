'use client';

import React from 'react';
import { SealType } from '@/types/shinobi';

interface HandSignReferenceImageProps {
  sealType: SealType;
  className?: string;
  showLabel?: boolean;
}

export const SEAL_GRID_MAPPING: Record<SealType, { col: number; row: number; name: string }> = {
  DRAGON: { col: 0, row: 0, name: 'Dragon' },
  TIGER:  { col: 1, row: 0, name: 'Tiger' },
  DOG:    { col: 2, row: 0, name: 'Dog' },
  RAT:    { col: 3, row: 0, name: 'Rat' },

  RAM:    { col: 0, row: 1, name: 'Ram' },
  HORSE:  { col: 1, row: 1, name: 'Horse' },
  MONKEY: { col: 2, row: 1, name: 'Monkey' },
  BIRD:   { col: 3, row: 1, name: 'Bird' },

  OX:     { col: 0, row: 2, name: 'Ox' },
  SERPENT:{ col: 1, row: 2, name: 'Serpent' },
  HARE:   { col: 2, row: 2, name: 'Hare' },
  BOAR:   { col: 3, row: 2, name: 'Boar' },
};

export const HandSignReferenceImage: React.FC<HandSignReferenceImageProps> = ({
  sealType,
  className = 'w-32 h-32',
  showLabel = false,
}) => {
  const sealInfo = SEAL_GRID_MAPPING[sealType] || SEAL_GRID_MAPPING.TIGER;

  // Background position calculation for 4x3 grid sprite
  const posX = (sealInfo.col / 3) * 100;
  const posY = (sealInfo.row / 2) * 100;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-2xl border-2 border-cyan-500/40 shadow-xl overflow-hidden relative group transition-all duration-300 hover:scale-105 hover:border-cyan-400 ${className}`}
        style={{
          backgroundImage: "url('/hand-seals-reference.png')",
          backgroundSize: '400% 300%',
          backgroundPosition: `${posX}% ${posY}%`,
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Glow overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />
      </div>
      {showLabel && (
        <span className="text-xs font-bold font-cinzel text-cyan-300 tracking-wider">
          {sealInfo.name}
        </span>
      )}
    </div>
  );
};
