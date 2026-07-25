import { useState, useCallback, useEffect, useRef } from 'react';
import { SealType, HandSealInfo, Jutsu, SequenceItem } from '@/types/shinobi';
import { soundFx } from '@/components/audio/SoundEffects';

// Master Database of 12 Zodiac Hand Seals
export const HAND_SEALS: Record<SealType, HandSealInfo> = {
  TIGER: { type: 'TIGER', name: 'Tiger', kanji: '寅', symbol: '🐅', color: '#FF5252', glowClass: 'seal-glow-tiger', keyShortcut: '1' },
  BIRD: { type: 'BIRD', name: 'Bird', kanji: '酉', symbol: '🦅', color: '#FF9F1C', glowClass: 'seal-glow-bird', keyShortcut: '2' },
  BOAR: { type: 'BOAR', name: 'Boar', kanji: '亥', symbol: '🐗', color: '#E71D36', glowClass: 'seal-glow-boar', keyShortcut: '3' },
  DRAGON: { type: 'DRAGON', name: 'Dragon', kanji: '辰', symbol: '🐉', color: '#00F2FE', glowClass: 'seal-glow-dragon', keyShortcut: '4' },
  RAM: { type: 'RAM', name: 'Ram', kanji: '未', symbol: '🐏', color: '#9D4EDD', glowClass: 'seal-glow-ram', keyShortcut: '5' },
  SERPENT: { type: 'SERPENT', name: 'Serpent', kanji: '巳', symbol: '🐍', color: '#2EC4B6', glowClass: 'seal-glow-serpent', keyShortcut: '6' },
  MONKEY: { type: 'MONKEY', name: 'Monkey', kanji: '申', symbol: '🐒', color: '#FFB703', glowClass: 'seal-glow-tiger', keyShortcut: '7' },
  OX: { type: 'OX', name: 'Ox', kanji: '丑', symbol: '🐂', color: '#8D99AE', glowClass: 'seal-glow-ram', keyShortcut: '8' },
  DOG: { type: 'DOG', name: 'Dog', kanji: '戌', symbol: '🐕', color: '#4A4E69', glowClass: 'seal-glow-boar', keyShortcut: '9' },
  HORSE: { type: 'HORSE', name: 'Horse', kanji: '午', symbol: '🐎', color: '#FB8500', glowClass: 'seal-glow-bird', keyShortcut: 'Q' },
  HARE: { type: 'HARE', name: 'Hare', kanji: '卯', symbol: '🐇', color: '#00B4D8', glowClass: 'seal-glow-dragon', keyShortcut: 'W' },
  RAT: { type: 'RAT', name: 'Rat', kanji: '子', symbol: '🐀', color: '#6C757D', glowClass: 'seal-glow-serpent', keyShortcut: 'E' },
};

// Master Database of Ninjutsu Sequences
export const JUTSU_LIBRARY: Jutsu[] = [
  {
    id: 'jutsu-fireball',
    name: 'Fire Style: Fireball Jutsu',
    japaneseName: 'Katon: Gōkakyū no Jutsu',
    element: 'Fire',
    sequence: ['SERPENT', 'RAM', 'MONKEY', 'BOAR', 'HORSE', 'TIGER'],
    damage: 40,
    chakraCost: 35,
    description: 'Generates a massive orb of blazing fire from the mouth, incinerating all foes ahead.',
    icon: '🔥',
    color: '#FF2E63',
    soundType: 'fire',
  },
  {
    id: 'jutsu-chidori',
    name: 'Lightning Blade: Chidori',
    japaneseName: 'Raikiri / Chidori',
    element: 'Lightning',
    sequence: ['OX', 'HARE', 'MONKEY'],
    damage: 50,
    chakraCost: 45,
    description: 'Concentrates electric lightning chakra into the hand like the sound of a thousand chirping birds.',
    icon: '⚡',
    color: '#9D4EDD',
    soundType: 'lightning',
  },
  {
    id: 'jutsu-water-dragon',
    name: 'Water Style: Water Dragon Jutsu',
    japaneseName: 'Suiton: Suiryūdan no Jutsu',
    element: 'Water',
    sequence: ['TIGER', 'OX', 'MONKEY', 'HARE', 'RAT', 'BOAR', 'BIRD'],
    damage: 60,
    chakraCost: 50,
    description: 'Shapes surrounding water into a gigantic roaring serpent dragon that strikes the target.',
    icon: '🌊',
    color: '#00B4D8',
    soundType: 'water',
  },
  {
    id: 'jutsu-shadow-clone',
    name: 'Shadow Clone Jutsu',
    japaneseName: 'Kage Bunshin no Jutsu',
    element: 'Secret',
    sequence: ['RAM'],
    damage: 20,
    chakraCost: 15,
    description: 'Creates tangible physical duplicates that distract and strike the enemy.',
    icon: '👥',
    color: '#FFB703',
    soundType: 'clone',
  },
  {
    id: 'jutsu-phoenix-flower',
    name: 'Fire Style: Phoenix Flower',
    japaneseName: 'Katon: Hōsenka no Jutsu',
    element: 'Fire',
    sequence: ['SERPENT', 'TIGER', 'DOG', 'OX', 'HARE', 'TIGER'],
    damage: 35,
    chakraCost: 30,
    description: 'Unleashes a volley of small fiery projectiles containing hidden shuriken.',
    icon: '☄️',
    color: '#FB8500',
    soundType: 'fire',
  },
];

export function useHandSignSequence(onJutsuTrigger?: (jutsu: Jutsu) => void) {
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [matchedJutsu, setMatchedJutsu] = useState<Jutsu | null>(null);

  const onJutsuTriggerRef = useRef(onJutsuTrigger);
  useEffect(() => {
    onJutsuTriggerRef.current = onJutsuTrigger;
  }, [onJutsuTrigger]);

  const sequenceLengthRef = useRef(0);
  sequenceLengthRef.current = sequence.length;

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear sequence queue
  const clearSequence = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setSequence([]);
    setMatchedJutsu(null);
  }, []);

  // Add seal to queue
  const addSeal = useCallback(
    (sealType: SealType, confidence: number = 0.95) => {
      soundFx.playSealSound(sequenceLengthRef.current % 7);

      const newItem: SequenceItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: sealType,
        timestamp: Date.now(),
        accuracy: confidence,
      };

      setSequence((prev) => {
        const nextSequence = [...prev, newItem];
        if (nextSequence.length > 8) {
          return nextSequence.slice(nextSequence.length - 8);
        }
        return nextSequence;
      });
    },
    []
  );

  // Check sequence against Jutsu database
  useEffect(() => {
    if (sequence.length === 0) {
      setMatchedJutsu(null);
      return;
    }

    const currentSealTypes = sequence.map((s) => s.type);

    // Find matching jutsu
    for (const jutsu of JUTSU_LIBRARY) {
      const reqSeq = jutsu.sequence;
      if (reqSeq.length <= currentSealTypes.length) {
        // Check if ending of current sequence matches jutsu requirement
        const endSegment = currentSealTypes.slice(currentSealTypes.length - reqSeq.length);
        const isMatch = reqSeq.every((type, idx) => type === endSegment[idx]);

        if (isMatch) {
          setMatchedJutsu(jutsu);

          if (onJutsuTriggerRef.current) {
            onJutsuTriggerRef.current(jutsu);
          }

          // Clear any existing reset timer
          if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
          }

          // Reset sequence after 1.2s post-trigger
          resetTimerRef.current = setTimeout(() => {
            clearSequence();
          }, 1200);

          return () => {
            if (resetTimerRef.current) {
              clearTimeout(resetTimerRef.current);
              resetTimerRef.current = null;
            }
          };
        }
      }
    }
  }, [sequence, clearSequence]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return {
    sequence,
    matchedJutsu,
    addSeal,
    clearSequence,
    HAND_SEALS,
    JUTSU_LIBRARY,
  };
}
