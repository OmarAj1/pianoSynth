export interface OctaveRange {
  start: number;
  end: number;
}

export interface KeyGeometry {
  w: number;
  x: number;
  isWhite: boolean;
}

export interface KeyGeometryMap {
  [key: number]: KeyGeometry;
}

export interface KeyOffsetMap {
  [code: string]: number | string;
}

export interface ActiveNoteData {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}