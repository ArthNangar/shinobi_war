'use client';

import React from 'react';
import { HandSealReferenceDetail } from '@/types/shinobi';
import { Flame, Shield, BookOpen, Layers, Award } from 'lucide-react';

interface HandSignCardProps {
  seal: HandSealReferenceDetail;
  isMastered: boolean;
}

export const HandSignCard: React.FC<HandSignCardProps> = ({ seal, isMastered }) => {
  return (
    <div className="w-full ninja-glass rounded-2xl p-5 border border-cyan-500/30 flex flex-col space-y-4 shadow-xl relative overflow-hidden">
      {/* Background Subtle Element Glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: seal.color }}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border relative"
            style={{
              backgroundColor: `${seal.color}15`,
              borderColor: `${seal.color}50`,
              boxShadow: `0 0 20px ${seal.color}25`,
            }}
          >
            {seal.symbol}
            <span className="absolute -bottom-1 -right-1 text-xs font-cinzel font-black px-1.5 py-0.5 rounded bg-black/80 border border-slate-700 text-amber-300">
              {seal.kanji}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-cinzel text-slate-100 tracking-wide">
                {seal.englishName}
              </h2>
              {isMastered && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" /> MASTERED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-tech mt-0.5">{seal.primaryFingers}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wider border uppercase flex items-center gap-1"
            style={{
              backgroundColor: `${seal.color}20`,
              borderColor: `${seal.color}60`,
              color: seal.color,
            }}
          >
            <Flame className="w-3 h-3" /> {seal.elementAffinity} Style
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            Difficulty: {seal.difficulty}
          </span>
        </div>
      </div>

      {/* Visual Reference Graphic Diagram */}
      <div className="relative w-full h-44 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center p-4 overflow-hidden group">
        {/* Animated Background Canvas Pattern */}
        <div className="absolute inset-0 scanline-bg opacity-30 pointer-events-none" />

        {/* Stylized SVG Diagram displaying Seal Hands */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
          <svg className="w-32 h-24 drop-shadow-[0_0_12px_rgba(0,242,254,0.3)]" viewBox="0 0 200 140" fill="none">
            {/* Outer Chakra Ring */}
            <circle cx="100" cy="70" r="55" stroke={seal.color} strokeWidth="1.5" strokeDasharray="4 4" className="animate-spin-slow opacity-60" />
            <circle cx="100" cy="70" r="42" stroke="#00F2FE" strokeWidth="1" opacity="0.4" />
            
            {/* Hand Sign Skeleton Illustration Vector */}
            <path
              d="M70,110 L80,70 L95,35 L100,25 L105,35 L120,70 L130,110"
              stroke="#00F2FE"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M80,70 L100,50 L120,70 M85,85 L100,65 L115,85"
              stroke={seal.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Joint Nodes */}
            <circle cx="100" cy="25" r="4.5" fill="#00F2FE" />
            <circle cx="95" cy="35" r="3.5" fill="#00F2FE" />
            <circle cx="105" cy="35" r="3.5" fill="#00F2FE" />
            <circle cx="80" cy="70" r="4" fill={seal.color} />
            <circle cx="120" cy="70" r="4" fill={seal.color} />
            <circle cx="100" cy="50" r="3.5" fill="#FFB703" />
          </svg>
          <span className="text-[11px] font-mono text-cyan-300/80 uppercase tracking-wider">
            {seal.name} Seal Technique Vector Diagram
          </span>
        </div>

        {/* Shortcut Pill */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 border border-slate-700 text-[10px] font-mono text-slate-300">
          Shortcut Key: <strong className="text-cyan-400">[{seal.keyShortcut}]</strong>
        </div>
      </div>

      {/* Text Description */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {seal.description}
      </p>

      {/* Execution Instructions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-tech flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Finger Placement & Form:
        </h3>
        <ul className="space-y-1.5">
          {seal.executionSteps.map((step, idx) => (
            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
              <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Associated Ninjutsu */}
      <div className="pt-1 border-t border-slate-800/80">
        <h3 className="text-[11px] font-bold uppercase text-slate-400 font-tech flex items-center gap-1.5 mb-1.5">
          <Layers className="w-3 h-3 text-amber-400" /> Featured Ninjutsu Jutsus:
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {seal.featuredInJutsus.map((jutsuName, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-medium"
            >
              ⚡ {jutsuName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
