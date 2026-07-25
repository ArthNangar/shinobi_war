'use client';

import React from 'react';
import { SealType } from '@/types/shinobi';

interface HandSignIllustrationProps {
  sealType: SealType;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const HandSignIllustration: React.FC<HandSignIllustrationProps> = ({
  sealType,
  color = '#00F2FE',
  className = '',
  size = 'md',
}) => {
  // Size mappings in px
  const dimensions = {
    sm: { width: 48, height: 48, viewBox: '0 0 100 100' },
    md: { width: 96, height: 96, viewBox: '0 0 160 160' },
    lg: { width: 160, height: 160, viewBox: '0 0 200 200' },
    xl: { width: 240, height: 200, viewBox: '0 0 240 200' },
  }[size];

  // Specific hand structure paths for each seal
  const renderSealPaths = () => {
    switch (sealType) {
      case 'TIGER':
        // Both palms pressed, Index & Middle fingers extended straight UP, Ring & Pinky folded inward
        return (
          <g>
            {/* Center Index & Middle fingers pointing straight up */}
            <path d="M72,110 L72,40 L80,25 L88,40 L88,110" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill={`${color}15`} />
            <path d="M80,25 L80,110" stroke="#FFF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            {/* Left Palm & folded ring/pinky */}
            <path d="M72,80 L52,85 C45,95 48,115 60,120 L72,110" stroke={color} strokeWidth="2.5" fill="none" />
            {/* Right Palm & folded ring/pinky */}
            <path d="M88,80 L108,85 C115,95 112,115 100,120 L88,110" stroke={color} strokeWidth="2.5" fill="none" />
            {/* Crossed Thumbs */}
            <path d="M62,92 L98,92" stroke="#FFB703" strokeWidth="3" strokeLinecap="round" />
            {/* Fingertip Nodes */}
            <circle cx="80" cy="25" r="5" fill="#FF5252" className="animate-pulse" />
            <circle cx="72" cy="40" r="3" fill={color} />
            <circle cx="88" cy="40" r="3" fill={color} />
          </g>
        );

      case 'BIRD':
        // Middle fingertips touch at apex, Index fingers arched over them like beak, thumbs/pinkies form lower ring
        return (
          <g>
            {/* Apex touch */}
            <path d="M80,30 L80,110" stroke="#FFF" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
            {/* Arched Index fingers (Bird Beak arch) */}
            <path d="M50,75 C55,45 70,30 80,30 C90,30 105,45 110,75" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Middle fingers touching vertically */}
            <path d="M72,90 L75,45 L80,38 L85,45 L88,90" stroke="#FF9F1C" strokeWidth="2.5" fill={`${color}20`} strokeLinecap="round" />
            {/* Thumb & Pinky lower ring */}
            <path d="M50,75 C60,105 100,105 110,75" stroke={color} strokeWidth="2.5" fill="none" strokeDasharray="4 2" />
            {/* Beak Nodes */}
            <circle cx="80" cy="30" r="5" fill="#FF9F1C" />
            <circle cx="80" cy="38" r="4" fill="#FFF" />
          </g>
        );

      case 'BOAR':
        // Palms facing DOWN, wrists touching, fingers overlapped horizontally
        return (
          <g>
            {/* Horizontal Wrists & Arms line */}
            <path d="M30,85 L130,85" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Overlapped Horizontal Fingers facing downward */}
            <path d="M40,85 C40,110 70,115 80,115 C90,115 120,110 120,85" stroke="#E71D36" strokeWidth="3" fill={`${color}15`} />
            <path d="M50,92 L110,92" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path d="M55,100 L105,100" stroke={color} strokeWidth="2" strokeLinecap="round" />
            {/* Grounding vectors */}
            <path d="M80,115 L80,135" stroke="#E71D36" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="80" cy="115" r="4" fill="#E71D36" />
          </g>
        );

      case 'DRAGON':
        // Left hand stacked vertically over Right, Thumbs crossed vertically pointing UP, pinkies interlocked
        return (
          <g>
            {/* Vertical Stacked Thumbs pointing UP */}
            <path d="M75,25 L75,80" stroke="#00F2FE" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M85,35 L85,85" stroke="#00F2FE" strokeWidth="3.5" strokeLinecap="round" />
            {/* Upper Hand Stack (Left) */}
            <path d="M50,65 L110,65 L105,95 L55,95 Z" stroke={color} strokeWidth="2.5" fill={`${color}20`} />
            {/* Lower Hand Stack (Right) */}
            <path d="M45,85 L115,85 L110,115 L50,115 Z" stroke="#00F2FE" strokeWidth="2" fill="none" />
            {/* Interlocked Pinkies at base */}
            <path d="M60,115 C75,130 85,130 100,115" stroke="#00F2FE" strokeWidth="3" strokeLinecap="round" />
            {/* Dragon Crest Nodes */}
            <circle cx="75" cy="25" r="4.5" fill="#00F2FE" />
            <circle cx="85" cy="35" r="4" fill="#FFF" />
          </g>
        );

      case 'RAM':
        // Left Index & Middle fingers vertical UP, Right hand clamped horizontally around base
        return (
          <g>
            {/* Left Vertical Index & Middle Fingers */}
            <path d="M72,25 L72,110 M82,25 L82,110" stroke="#9D4EDD" strokeWidth="3.5" strokeLinecap="round" />
            {/* Right Hand Clamped Horizontal Box */}
            <rect x="52" y="65" width="56" height="40" rx="8" stroke={color} strokeWidth="3" fill={`${color}25`} />
            {/* Right Fingers wrapped */}
            <path d="M52,75 L108,75 M52,85 L108,85 M52,95 L108,95" stroke="#9D4EDD" strokeWidth="1.5" />
            {/* Left Thumb crossed over right knuckles */}
            <path d="M62,60 L98,70" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
            {/* Focus Aura Nodes */}
            <circle cx="72" cy="25" r="4" fill="#9D4EDD" />
            <circle cx="82" cy="25" r="4" fill="#9D4EDD" />
          </g>
        );

      case 'SERPENT':
        // 10 Interwoven fingers, Palms flat together, Left thumb crossed over Right
        return (
          <g>
            {/* Intertwined Finger Mesh */}
            <path d="M55,40 C65,30 95,30 105,40 L110,100 C110,120 50,120 50,100 Z" stroke={color} strokeWidth="2.5" fill={`${color}20`} />
            {/* Interlaced Diagonal Knuckle Lines */}
            <path d="M55,50 L105,65 M50,65 L110,80 M55,80 L105,95" stroke="#2EC4B6" strokeWidth="2.5" strokeLinecap="round" />
            {/* Crossed Thumbs at top */}
            <path d="M68,42 L92,52 M92,42 L68,52" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="35" r="5" fill="#2EC4B6" />
          </g>
        );

      case 'MONKEY':
        // Flat Palms, Right hand slid slightly forward, Horizontal Thumbs
        return (
          <g>
            {/* Flat Palms overlapping */}
            <path d="M60,35 L60,115 M100,35 L100,115" stroke={color} strokeWidth="2.5" />
            <rect x="60" y="35" width="40" height="80" rx="6" stroke="#FFB703" strokeWidth="3" fill={`${color}20`} />
            {/* Horizontal Thumbs across back of hands */}
            <path d="M45,60 L115,60" stroke="#FFB703" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M50,75 L110,75" stroke="#FFF" strokeWidth="2" strokeDasharray="4 2" />
            {/* Lightning Strike Spark Node */}
            <circle cx="80" cy="60" r="5" fill="#FFB703" className="animate-ping" />
            <circle cx="80" cy="60" r="4" fill="#FFF" />
          </g>
        );

      case 'OX':
        // Horizontal Fist (Right), Left open palm covering top of fist
        return (
          <g>
            {/* Horizontal Fist (Right) */}
            <rect x="50" y="65" width="60" height="35" rx="10" stroke="#8D99AE" strokeWidth="3" fill={`${color}20`} />
            {/* Left Open Palm covering top */}
            <path d="M40,55 C45,45 115,45 120,55 L115,70 L45,70 Z" stroke={color} strokeWidth="3" fill={`${color}30`} />
            {/* Extended horizontal index/middle fingers */}
            <path d="M45,50 L115,50" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="115" cy="50" r="4" fill="#8D99AE" />
          </g>
        );

      case 'DOG':
        // Flat Open Right Hand supporting Left Fist directly underneath
        return (
          <g>
            {/* Left Fist on top */}
            <rect x="55" y="35" width="50" height="45" rx="10" stroke="#4A4E69" strokeWidth="3" fill={`${color}25`} />
            {/* Supporting Open Hand underneath */}
            <path d="M35,85 L125,85 L120,105 L40,105 Z" stroke={color} strokeWidth="3.5" fill={`${color}30`} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40,85 L40,100 M60,85 L60,100 M80,85 L80,100 M100,85 L100,100" stroke="#FFF" strokeWidth="1.5" />
            {/* Water Shield Node */}
            <circle cx="80" cy="57" r="5" fill="#4A4E69" />
          </g>
        );

      case 'HORSE':
        // Index fingertips touching at a high peak, middle/ring knuckles pressed, pinkies spread
        return (
          <g>
            {/* High Peak Index Fingers */}
            <path d="M50,80 L80,20 L110,80" stroke="#FB8500" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pressed Middle & Ring Knuckles */}
            <path d="M62,80 L98,80 M66,92 L94,92" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Pinkies spread outward */}
            <path d="M50,80 L30,95 M110,80 L130,95" stroke="#FB8500" strokeWidth="2.5" strokeLinecap="round" />
            {/* Peak Flame Node */}
            <circle cx="80" cy="20" r="5" fill="#FB8500" />
            <circle cx="80" cy="20" r="2.5" fill="#FFF" />
          </g>
        );

      case 'HARE':
        // Hooked index finger over opposite index finger, wrapped thumb
        return (
          <g>
            {/* Hooked Index Loop */}
            <path d="M60,40 C60,20 100,20 100,40 C100,55 70,55 70,75" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Opposite Index Hook */}
            <path d="M100,40 C100,25 75,25 75,45" stroke="#00B4D8" strokeWidth="2.5" fill="none" />
            {/* Loose Fist Base */}
            <rect x="52" y="70" width="56" height="40" rx="8" stroke="#00B4D8" strokeWidth="2.5" fill={`${color}20`} />
            <circle cx="80" cy="30" r="4" fill="#00B4D8" />
          </g>
        );

      case 'RAT':
        // Right hand clasped FIRMLY around raised left vertical index finger
        return (
          <g>
            {/* Vertical Left Index Finger */}
            <path d="M80,20 L80,115" stroke="#6C757D" strokeWidth="4" strokeLinecap="round" />
            {/* Right Hand Clasping fingers wrapped around it */}
            <rect x="50" y="50" width="60" height="50" rx="12" stroke={color} strokeWidth="3" fill={`${color}30`} />
            <path d="M50,62 C70,55 90,55 110,62 M50,75 C70,68 90,68 110,75 M50,88 C70,81 90,88 110,88" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
            {/* Clasp Thumb resting over */}
            <path d="M58,52 L98,62" stroke="#6C757D" strokeWidth="3" strokeLinecap="round" />
            {/* Shadow Possession Node */}
            <circle cx="80" cy="20" r="5" fill="#6C757D" />
          </g>
        );

      default:
        return (
          <g>
            <circle cx="80" cy="80" r="40" stroke={color} strokeWidth="2" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={dimensions.viewBox}
        className="drop-shadow-[0_0_12px_rgba(0,242,254,0.4)] transition-all duration-300 pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Elemental Chakra Ring */}
        <circle
          cx="80"
          cy="80"
          r="68"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="animate-spin-slow opacity-50"
        />
        <circle cx="80" cy="80" r="52" stroke="#00F2FE" strokeWidth="1" opacity="0.3" />

        {/* Hand Seal Path rendering */}
        {renderSealPaths()}
      </svg>
    </div>
  );
};
