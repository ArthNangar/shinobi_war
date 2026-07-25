'use client';

import React from 'react';
import { HandSealReferenceDetail } from '@/types/shinobi';
import { Flame, Shield, BookOpen, Layers, Award } from 'lucide-react';
import { HandSignIllustration } from './HandSignIllustration';
import { HandSignReferenceImage } from './HandSignReferenceImage';

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

      {/* Primary Reference Hero Container: Hand Sign Image on the Left with Name & Metadata */}
      <div className="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800 p-4 overflow-hidden flex flex-col md:flex-row items-center gap-5 shadow-inner group">
        {/* Background Scanline & Element Glow */}
        <div className="absolute inset-0 scanline-bg opacity-20 pointer-events-none" />
        <div
          className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-2xl pointer-events-none opacity-20"
          style={{ backgroundColor: seal.color }}
        />

        {/* LEFT SIDE: OFFICIAL ANIME REFERENCE IMAGE & HAND STRUCTURE */}
        <div className="relative shrink-0 flex flex-row md:flex-col items-center justify-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl group-hover:border-cyan-400/60 transition-all duration-300">
          {/* Official Anime Reference Image Crop */}
          <HandSignReferenceImage
            sealType={seal.type}
            className="w-36 h-36 md:w-44 md:h-44"
          />

          {/* Seal Symbol Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/80 border border-slate-700">
            <span className="text-xl">{seal.symbol}</span>
            <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">OFFICIAL TUTORIAL FORM</span>
          </div>
        </div>

        {/* RIGHT SIDE (Alongside Image): NAME, DETAILS & SHORTCUT */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black font-cinzel text-slate-100 tracking-wide">
                  {seal.name}
                </h2>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  ({seal.englishName.split(' ')[1] || seal.englishName})
                </span>
                {isMastered && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <Award className="w-3 h-3 text-emerald-400" /> MASTERED
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-300 font-tech mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {seal.primaryFingers}
              </p>
            </div>

            {/* Shortcut Badge */}
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Key Trigger</span>
              <strong className="text-sm font-mono text-cyan-400 font-black">[{seal.keyShortcut}]</strong>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span
              className="px-2.5 py-1 rounded-lg font-bold tracking-wider border uppercase flex items-center gap-1"
              style={{
                backgroundColor: `${seal.color}20`,
                borderColor: `${seal.color}60`,
                color: seal.color,
              }}
            >
              <Flame className="w-3.5 h-3.5" /> {seal.elementAffinity} Style
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-medium">
              Difficulty: <strong className="text-amber-300">{seal.difficulty}</strong>
            </span>
          </div>

          {/* Quick Form Hint */}
          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
            {seal.description}
          </p>
        </div>
      </div>

      {/* Execution Instructions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-tech flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Form Execution Steps:
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {seal.executionSteps.map((step, idx) => (
            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-tight">{step}</span>
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
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1"
            >
              ⚡ {jutsuName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
