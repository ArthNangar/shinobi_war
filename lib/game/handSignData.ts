import { SealType, HandSealReferenceDetail } from '@/types/shinobi';

export const HAND_SEALS_REFERENCE_DATA: Record<SealType, HandSealReferenceDetail> = {
  TIGER: {
    type: 'TIGER',
    name: 'Tiger',
    englishName: 'Tiger (Tora)',
    kanji: '',
    symbol: '🐅',
    color: '#FF5252',
    glowClass: 'seal-glow-tiger',
    keyShortcut: '1',
    elementAffinity: 'Fire',
    difficulty: 'Beginner',
    primaryFingers: 'Index & Middle Fingers Extended',
    description: 'The Tiger seal is the fundamental seal for Fire Style Ninjutsu. It concentrates thermal chakra directly at the solar plexus.',
    executionSteps: [
      'Press your left and right palms firmly together.',
      'Extend both index and middle fingers straight upward.',
      'Interlock your ring fingers and pinky fingers inward against the palms.',
      'Cross your thumbs tightly over the folded knuckles.'
    ],
    featuredInJutsus: ['Fireball Jutsu', 'Phoenix Flower Jutsu', 'Water Dragon Jutsu']
  },
  BIRD: {
    type: 'BIRD',
    name: 'Bird',
    englishName: 'Bird (Tori)',
    kanji: '',
    symbol: '🦅',
    color: '#FF9F1C',
    glowClass: 'seal-glow-bird',
    keyShortcut: '2',
    elementAffinity: 'Wind',
    difficulty: 'Intermediate',
    primaryFingers: 'Index Fingers & Thumbs Interlocked',
    description: 'Associated with Wind Style and high-velocity aerial maneuvers. Requires quick finger agility.',
    executionSteps: [
      'Touch the tips of both middle fingers together facing upward.',
      'Cross both index fingers over the middle fingers forming an arch.',
      'Form a triangle ring using the thumb tips and pinkies.',
      'Hold palms slightly arched like a bird in flight.'
    ],
    featuredInJutsus: ['Water Dragon Jutsu', 'Wind Blade Jutsu']
  },
  BOAR: {
    type: 'BOAR',
    name: 'Boar',
    englishName: 'Boar (I)',
    kanji: '',
    symbol: '🐗',
    color: '#E71D36',
    glowClass: 'seal-glow-boar',
    keyShortcut: '3',
    elementAffinity: 'Earth',
    difficulty: 'Beginner',
    primaryFingers: 'Palms Facing Downward',
    description: 'Forms the foundational anchor for Earth style jutsus and summonings. Emphasizes heavy downward chakra grounding.',
    executionSteps: [
      'Bend both elbows outward at 90-degree angles.',
      'Place wrists together with palms facing down toward the ground.',
      'Overlap your fingers horizontally with knuckles bent flat.',
      'Keep thumbs tucked securely along the bottom edge.'
    ],
    featuredInJutsus: ['Fireball Jutsu', 'Water Dragon Jutsu', 'Summoning Jutsu']
  },
  DRAGON: {
    type: 'DRAGON',
    name: 'Dragon',
    englishName: 'Dragon (Tatsu)',
    kanji: '',
    symbol: '🐉',
    color: '#00F2FE',
    glowClass: 'seal-glow-dragon',
    keyShortcut: '4',
    elementAffinity: 'Water',
    difficulty: 'Advanced',
    primaryFingers: 'Stacked Thumbs & Overlapped Pinkies',
    description: 'A powerful, intricate seal used to mold aquatic and elemental dragon shapes. Highly potent.',
    executionSteps: [
      'Stack your left hand on top of your right hand with knuckles aligned.',
      'Cross both thumbs vertically pointing up towards the ceiling.',
      'Interlock pinky finger tips firmly at the lower base.',
      'Keep index and middle fingers flat against the back of opposite hand.'
    ],
    featuredInJutsus: ['Water Dragon Jutsu', 'Dragon Flame Jutsu']
  },
  RAM: {
    type: 'RAM',
    name: 'Ram',
    englishName: 'Ram (Hitsuji)',
    kanji: '',
    symbol: '🐏',
    color: '#9D4EDD',
    glowClass: 'seal-glow-ram',
    keyShortcut: '5',
    elementAffinity: 'Secret',
    difficulty: 'Beginner',
    primaryFingers: 'Vertical Left Fingers Clamped',
    description: 'The primary seal for focus, chakra control, and Shadow Clones. Critical for gathering inner energy.',
    executionSteps: [
      'Raise left index and middle fingers vertically.',
      'Wrap your right hand horizontally around the base of the left hand.',
      'Cross your left thumb over the right hand knuckles.',
      'Keep your right fingers wrapped tightly in a grip.'
    ],
    featuredInJutsus: ['Shadow Clone Jutsu', 'Fireball Jutsu', 'Chakra Focus']
  },
  SERPENT: {
    type: 'SERPENT',
    name: 'Serpent',
    englishName: 'Serpent (Mi)',
    kanji: '',
    symbol: '🐍',
    color: '#2EC4B6',
    glowClass: 'seal-glow-serpent',
    keyShortcut: '6',
    elementAffinity: 'Earth',
    difficulty: 'Beginner',
    primaryFingers: 'Ten Interwoven Fingers',
    description: 'Associated with Earth, Wood, and Lightning transformations. Excellent for grounding and binding.',
    executionSteps: [
      'Interlace all ten fingers tightly together.',
      'Press your palms together flat without gaps.',
      'Ensure left thumb crosses over right thumb at the top.',
      'Focus chakra into the palms.'
    ],
    featuredInJutsus: ['Fireball Jutsu', 'Phoenix Flower Jutsu', 'Earth Wall']
  },
  MONKEY: {
    type: 'MONKEY',
    name: 'Monkey',
    englishName: 'Monkey (Saru)',
    kanji: '',
    symbol: '🐒',
    color: '#FFB703',
    glowClass: 'seal-glow-tiger',
    keyShortcut: '7',
    elementAffinity: 'Lightning',
    difficulty: 'Intermediate',
    primaryFingers: 'Palms Flat & Thumbs Horizontal',
    description: 'A swift, electric seal essential for Lightning Blade and high-frequency strikes.',
    executionSteps: [
      'Place both palms together flat in front of your chest.',
      'Slide your right hand slightly forward so knuckles align with fingers.',
      'Lay both thumbs horizontally across the back of opposite hands.',
      'Keep wrists firm and elbows level.'
    ],
    featuredInJutsus: ['Chidori Lightning Blade', 'Fireball Jutsu', 'Water Dragon Jutsu']
  },
  OX: {
    type: 'OX',
    name: 'Ox',
    englishName: 'Ox (Ushi)',
    kanji: '',
    symbol: '🐂',
    color: '#8D99AE',
    glowClass: 'seal-glow-ram',
    keyShortcut: '8',
    elementAffinity: 'Fire',
    difficulty: 'Intermediate',
    primaryFingers: 'Horizontal Fist & Overlapped Fingers',
    description: 'A heavy, defensive hand seal used to compress raw chakra before release.',
    executionSteps: [
      'Form a horizontal fist with your right hand.',
      'Place your left palm flat over the top of the right fist.',
      'Extend left index and middle fingers horizontally across.',
      'Press thumbs firmly together along the side.'
    ],
    featuredInJutsus: ['Chidori Lightning Blade', 'Water Dragon Jutsu', 'Phoenix Flower Jutsu']
  },
  DOG: {
    type: 'DOG',
    name: 'Dog',
    englishName: 'Dog (Inu)',
    kanji: '',
    symbol: '🐕',
    color: '#4A4E69',
    glowClass: 'seal-glow-boar',
    keyShortcut: '9',
    elementAffinity: 'Water',
    difficulty: 'Beginner',
    primaryFingers: 'Flat Left Hand Supporting Right Fist',
    description: 'A cornerstone seal for Water Style techniques, shielding, and ice transformations.',
    executionSteps: [
      'Form a firm fist with your left hand.',
      'Place your flat open right hand directly underneath supporting the fist.',
      'Keep left thumb resting along top knuckles.',
      'Hold position firm at chest level.'
    ],
    featuredInJutsus: ['Phoenix Flower Jutsu', 'Water Wall Jutsu']
  },
  HORSE: {
    type: 'HORSE',
    name: 'Horse',
    englishName: 'Horse (Uma)',
    kanji: '',
    symbol: '🐎',
    color: '#FB8500',
    glowClass: 'seal-glow-bird',
    keyShortcut: 'Q',
    elementAffinity: 'Fire',
    difficulty: 'Intermediate',
    primaryFingers: 'Peak Index Fingers & Knuckles Pressed',
    description: 'Forms the energetic crest in major Fire and Flame jutsu sequences.',
    executionSteps: [
      'Bring knuckles of both middle and ring fingers pressed together.',
      'Form a peak with both index finger tips touching facing upward.',
      'Extend thumbs inward toward the chest.',
      'Spread pinky fingers outward like wings.'
    ],
    featuredInJutsus: ['Fireball Jutsu', 'Flame Dispersal']
  },
  HARE: {
    type: 'HARE',
    name: 'Hare / Rabbit',
    englishName: 'Hare (U)',
    kanji: '',
    symbol: '🐇',
    color: '#00B4D8',
    glowClass: 'seal-glow-dragon',
    keyShortcut: 'W',
    elementAffinity: 'Wind',
    difficulty: 'Intermediate',
    primaryFingers: 'Hooked Index & Wrapped Thumb',
    description: 'A nimble, high-speed seal used in lightning and wind speed boosts.',
    executionSteps: [
      'Form a loose fist with left hand with pinky extended.',
      'Wrap left thumb over right knuckles.',
      'Hook right index finger over left index finger.',
      'Keep fingers flexible for rapid transition.'
    ],
    featuredInJutsus: ['Chidori Lightning Blade', 'Water Dragon Jutsu', 'Phoenix Flower Jutsu']
  },
  RAT: {
    type: 'RAT',
    name: 'Rat',
    englishName: 'Rat (Ne)',
    kanji: '',
    symbol: '🐀',
    color: '#6C757D',
    glowClass: 'seal-glow-serpent',
    keyShortcut: 'E',
    elementAffinity: 'Secret',
    difficulty: 'Beginner',
    primaryFingers: 'Clasp Around Vertical Index',
    description: 'Famous for Shadow Possession and secret clan jutsu manipulation.',
    executionSteps: [
      'Raise left index and middle fingers straight up.',
      'Clasp all fingers of your right hand around the raised left fingers.',
      'Rest right thumb over the right index knuckle.',
      'Maintain tight chakra grip.'
    ],
    featuredInJutsus: ['Water Dragon Jutsu', 'Shadow Stitching Jutsu']
  }
};
