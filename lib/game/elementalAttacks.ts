import { SealType, ElementalAffinity } from '@/types/shinobi';

export interface ElementalAttackDefinition {
  id: string;
  attackType: string;
  name: string;
  japaneseName: string;
  element: ElementalAffinity;
  sequence: SealType[];
  damage: number;
  chakraCost: number;
  description: string;
  icon: string;
  color: string;
  soundType: 'fire' | 'lightning' | 'water' | 'wind' | 'earth' | 'clone';
}

/**
 * Predefined Dictionary of Elemental Attacks
 */
export const ELEMENTAL_ATTACK_DICTIONARY: Record<string, ElementalAttackDefinition> = {
  FIRE_STYLE_FIREBALL: {
    id: 'jutsu-fireball',
    attackType: 'FIRE_STYLE_FIREBALL',
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
  LIGHTNING_STYLE_CHIDORI: {
    id: 'jutsu-chidori',
    attackType: 'LIGHTNING_STYLE_CHIDORI',
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
  WATER_STYLE_WATER_DRAGON: {
    id: 'jutsu-water-dragon',
    attackType: 'WATER_STYLE_WATER_DRAGON',
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
  FIRE_STYLE_PHOENIX_FLOWER: {
    id: 'jutsu-phoenix-flower',
    attackType: 'FIRE_STYLE_PHOENIX_FLOWER',
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
  WIND_STYLE_GALE_PALM: {
    id: 'jutsu-gale-palm',
    attackType: 'WIND_STYLE_GALE_PALM',
    name: 'Wind Style: Gale Palm',
    japaneseName: 'Fūton: Reppūshō',
    element: 'Wind',
    sequence: ['HORSE', 'TIGER', 'DOG'],
    damage: 30,
    chakraCost: 25,
    description: 'Compresses wind chakra into a dense gale gust, blasting enemies backwards.',
    icon: '🌪️',
    color: '#2EC4B6',
    soundType: 'wind',
  },
  EARTH_STYLE_MUD_WALL: {
    id: 'jutsu-mud-wall',
    attackType: 'EARTH_STYLE_MUD_WALL',
    name: 'Earth Style: Mud Wall',
    japaneseName: 'Doton: Doryūheki',
    element: 'Earth',
    sequence: ['BOAR', 'DOG', 'RAM'],
    damage: 25,
    chakraCost: 20,
    description: 'Erects a fortified earthen bulwark to block incoming attacks.',
    icon: '🧱',
    color: '#8D99AE',
    soundType: 'earth',
  },
  SECRET_STYLE_SHADOW_CLONE: {
    id: 'jutsu-shadow-clone',
    attackType: 'SECRET_STYLE_SHADOW_CLONE',
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
};

/**
 * Utility to match a sequence of registered hand sign strings against the attack dictionary.
 * Checks if the tail of registered sequence matches any predefined attack sequence.
 */
export function matchElementalAttack(registeredSigns: SealType[]): ElementalAttackDefinition | null {
  if (!registeredSigns || registeredSigns.length === 0) return null;

  for (const attackKey of Object.keys(ELEMENTAL_ATTACK_DICTIONARY)) {
    const attack = ELEMENTAL_ATTACK_DICTIONARY[attackKey];
    const reqSeq = attack.sequence;

    if (reqSeq.length <= registeredSigns.length) {
      // Check if the end segment matches the attack sequence
      const tailSegment = registeredSigns.slice(registeredSigns.length - reqSeq.length);
      const isMatch = reqSeq.every((type, idx) => type === tailSegment[idx]);

      if (isMatch) {
        return attack;
      }
    }
  }

  return null;
}
