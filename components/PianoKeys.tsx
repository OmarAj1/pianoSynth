import React, { useCallback, useEffect } from 'react';
import { OctaveRange } from '../types';
import { KEY_GEOMETRY, NOTE_NAMES, OFFSET_TO_LABEL, BLACK_KEY_HEIGHT_RATIO, BLACK_KEY_Y_OFFSET, SVG_VIEWBOX_HEIGHT_UNIT, ORIGINAL_WHITE_KEY_HEIGHT } from '../utils/constants';
import WhiteKey from './WhiteKey';
import BlackKey from './BlackKey';

interface PianoKeysProps {
  activeKeys: Set<number>;
  playNote: (midi: number, vol?: number) => void;
  stopNote: (midi: number, isGlobalSustainActive: boolean) => void;
  octaves: OctaveRange;
  octaveOffset: number; // needed for label mapping
  volume: number;
}

const PianoKeys: React.FC<PianoKeysProps> = React.memo(({ activeKeys, playNote, stopNote, octaves, octaveOffset, volume }) => {
  const { start: firstOctave, end: lastOctave } = octaves;
  
  // Layout Metrics
  const viewboxHeight = SVG_VIEWBOX_HEIGHT_UNIT; // Use the defined unit for SVG height
  const whiteKeyHeight = viewboxHeight; // White keys fill the SVG height
  const blackKeyHeight = viewboxHeight * BLACK_KEY_HEIGHT_RATIO;
  
  // We'll treat width as percentage or relative units (0 to totalOctaves)
  // To allow SVG to scale, we set viewBox width = totalOctaves * 1000 (arbitrary large unit)
  const UNIT_WIDTH = 1000;
  const totalWhiteKeys = (lastOctave - firstOctave + 1) * 7 + 1; // 7 white keys per octave + final C
  const svgWidth = totalWhiteKeys * (UNIT_WIDTH / 7); // total width based on number of white keys

  const getKeyLabel = useCallback((midi: number) => {
    const baseMidi = 60; // C4
    const offset = midi - baseMidi - octaveOffset;
    return OFFSET_TO_LABEL[offset] || null;
  }, [octaveOffset]);

  const renderKeyComponents = useCallback((isWhiteKeyLayer: boolean) => {
    const keyComponents: React.ReactNode[] = [];
    
    // Iterate octaves
    for (let octave = firstOctave; octave <= lastOctave + 1; octave++) {
      // Iterate 12 semitones
      for (let pc = 0; pc < 12; pc++) {
        const midi = octave * 12 + pc + 12;
        
        // Safety bounds
        if (midi < 24 || midi > 108) continue;
        
        // Stop after the last C of the last octave
        if (octave > lastOctave && pc > 0) break;
        if (octave > lastOctave && pc === 0) {
            // This is the trailing C
        } else if (octave > lastOctave) {
            continue;
        }

        const keyInfo = KEY_GEOMETRY[pc];
        if (!keyInfo || keyInfo.isWhite !== isWhiteKeyLayer) continue;

        // Calculate X Position
        const octaveStart = (octave - firstOctave) * (UNIT_WIDTH / 7 * 7); // Full octave width
        const x = octaveStart + (keyInfo.x * UNIT_WIDTH); // Use UNIT_WIDTH here for scaling consistency
        const w = keyInfo.w * UNIT_WIDTH;

        const isActive = activeKeys.has(midi);
        const keyLabel = getKeyLabel(midi);
        
        if (isWhiteKeyLayer) {
            keyComponents.push(
                <WhiteKey
                    key={midi}
                    midi={midi}
                    x={x}
                    w={w}
                    height={whiteKeyHeight}
                    isActive={isActive}
                    keyLabel={keyLabel}
                    octave={octave}
                    volume={volume}
                    playNote={playNote}
                    stopNote={stopNote as any} // Cast as stopNote now expects isGlobalSustainActive
                    viewboxHeight={viewboxHeight}
                />
            );
        } else {
            keyComponents.push(
                <BlackKey
                    key={midi}
                    midi={midi}
                    x={x}
                    w={w}
                    height={blackKeyHeight}
                    yOffset={BLACK_KEY_Y_OFFSET}
                    isActive={isActive}
                    keyLabel={keyLabel}
                    volume={volume}
                    playNote={playNote}
                    stopNote={stopNote as any} // Cast as stopNote now expects isGlobalSustainActive
                    viewboxHeight={viewboxHeight}
                />
            );
        }
      }
    }
    return keyComponents;
  }, [firstOctave, lastOctave, activeKeys, playNote, stopNote, volume, svgWidth, getKeyLabel, viewboxHeight, whiteKeyHeight, blackKeyHeight]);


  return (
    <div className="w-full relative select-none bg-[#111] rounded-b-xl overflow-hidden shadow-inner">
        {/* SVG Defs for Gradients */}
        <svg width="0" height="0" className="absolute">
            <defs>
                <linearGradient id="whiteKey" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="80%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id="whiteKeyActive" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e0f2fe" /> 
                    <stop offset="100%" stopColor="#bfdbfe" />
                </linearGradient>
                <linearGradient id="blackKey" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#333" />
                    <stop offset="20%" stopColor="#1a1a1a" />
                    <stop offset="80%" stopColor="#000000" />
                    <stop offset="100%" stopColor="#222" />
                </linearGradient>
                <linearGradient id="blackKeyActive" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="blackKeyShine" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
            </defs>
        </svg>

      {/* Red Felt Strip */}
      <div className="h-4 w-full bg-[#6a040f] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border-b border-[#370617] relative z-0"></div>
      
      <svg
        viewBox={`0 0 ${svgWidth} ${viewboxHeight}`}
        className="w-full h-full block touch-none"
        preserveAspectRatio="xMinYMin meet"
      >
        <rect width="100%" height="100%" fill="#0a0a0a" />
        {renderKeyComponents(true)}
        {renderKeyComponents(false)}
      </svg>
    </div>
  );
});

export default PianoKeys;