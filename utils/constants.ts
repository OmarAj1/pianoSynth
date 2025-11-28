import { KeyGeometryMap, KeyOffsetMap } from '../types';

// Standard piano geometry: 7 white keys per octave
// We define x and w as fractions of a single octave width (0 to 1)

export const WHITE_KEY_WIDTH = 1 / 7;
export const BLACK_KEY_WIDTH = 0.09; // Slightly narrower than standard for visual separation
export const BLACK_KEY_HEIGHT_RATIO = 0.65;
export const BLACK_KEY_Y_OFFSET = 0; // Black keys start at the same Y as white keys, but are shorter

// Arbitrary unit for SVG viewBox height to enable relative scaling
export const SVG_VIEWBOX_HEIGHT_UNIT = 1000;
// Original fixed height of white keys, used as a reference for proportional scaling
export const ORIGINAL_WHITE_KEY_HEIGHT = 300;

export const KEY_GEOMETRY: KeyGeometryMap = {
  // --- White Keys ---
  0: { w: WHITE_KEY_WIDTH, x: 0, isWhite: true }, // C
  2: { w: WHITE_KEY_WIDTH, x: 1/7, isWhite: true }, // D
  4: { w: WHITE_KEY_WIDTH, x: 2/7, isWhite: true }, // E
  5: { w: WHITE_KEY_WIDTH, x: 3/7, isWhite: true }, // F
  7: { w: WHITE_KEY_WIDTH, x: 4/7, isWhite: true }, // G
  9: { w: WHITE_KEY_WIDTH, x: 5/7, isWhite: true }, // A
  11: { w: WHITE_KEY_WIDTH, x: 6/7, isWhite: true }, // B

  // --- Black Keys ---
  // Positioned on the cracks between white keys
  // C# (between C 0/7 and D 1/7) -> center at 1/7
  1: { w: BLACK_KEY_WIDTH, x: (1/7) - (BLACK_KEY_WIDTH / 2), isWhite: false },
  // D# (between D 1/7 and E 2/7) -> center at 2/7
  3: { w: BLACK_KEY_WIDTH, x: (2/7) - (BLACK_KEY_WIDTH / 2), isWhite: false },
  
  // F# (between F 3/7 and G 4/7) -> center at 4/7
  6: { w: BLACK_KEY_WIDTH, x: (4/7) - (BLACK_KEY_WIDTH / 2), isWhite: false },
  // G# (between G 4/7 and A 5/7) -> center at 5/7
  8: { w: BLACK_KEY_WIDTH, x: (5/7) - (BLACK_KEY_WIDTH / 2), isWhite: false },
  // A# (between A 5/7 and B 6/7) -> center at 6/7
  10: { w: BLACK_KEY_WIDTH, x: (6/7) - (BLACK_KEY_WIDTH / 2), isWhite: false },
};

// Default PC Keyboard mapping
export const KEY_TO_OFFSET: KeyOffsetMap = {
  // Bottom row (C3 to C5 approx)
  'KeyZ': -9, 'KeyS': -8, 'KeyX': -7, 'KeyD': -5, 'KeyC': -6, 'KeyF': -5, 
  'KeyV': -4, 'KeyG': -3, 'KeyB': -2, 'KeyH': -1, 'KeyN': 0, 'KeyJ': 2, 
  'KeyM': 1, 'Comma': 3, 'KeyL': 4, 'Period': 5,
  
  // Top row (C4 to C6 approx)
  'KeyQ': 3, 'Digit2': 4, 'KeyW': 5, 'Digit3': 6, 'KeyE': 7, 'Digit4': 8, 
  'KeyR': 9, 'Digit5': 10, 'KeyT': 11, 'Digit6': 12, 'KeyY': 13, 'Digit7': 14, 
  'KeyU': 15, 'Digit8': 16, 'KeyI': 17, 'Digit9': 18, 'KeyO': 19, 'Digit0': 20, 
  'KeyP': 21, 'Minus': 22,

  // Control Keys
  'ArrowLeft': 'OCTAVE_DOWN',
  'ArrowRight': 'OCTAVE_UP',
  'CapsLock': 'SUSTAIN_TOGGLE', // Changed to TOGGLE for clarity
  'Space': 'SILENCE',
};

// Generate reverse map for labels
export const OFFSET_TO_LABEL: {[key: number]: string} = {};
Object.entries(KEY_TO_OFFSET).forEach(([code, offset]) => {
  if (typeof offset === 'number') {
    let label = code.replace('Key', '').replace('Digit', '');
    if (code === 'Comma') label = ',';
    if (code === 'Period') label = '.';
    if (code === 'Minus') label = '-';
    OFFSET_TO_LABEL[offset] = label;
  }
});

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];