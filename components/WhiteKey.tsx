import React, { useCallback } from 'react';
import { NOTE_NAMES, ORIGINAL_WHITE_KEY_HEIGHT } from '../utils/constants';

interface WhiteKeyProps {
  midi: number;
  x: number;
  w: number;
  height: number; // This is now a relative height from SVG_VIEWBOX_HEIGHT_UNIT
  isActive: boolean;
  keyLabel: string | null;
  octave: number;
  volume: number;
  playNote: (midi: number, vol?: number) => void;
  stopNote: (midi: number) => void;
  viewboxHeight: number; // The total height of the SVG viewbox
}

const WhiteKey: React.FC<WhiteKeyProps> = React.memo(({
  midi, x, w, height, isActive, keyLabel, octave, volume, playNote, stopNote, viewboxHeight
}) => {
  const getNoteName = useCallback((m: number) => {
    return NOTE_NAMES[m % 12];
  }, []);

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    playNote(midi, volume / 10);
  };

  const handleUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopNote(midi);
  };

  // Calculate scaled font sizes and Y positions based on the current key height relative to original fixed height
  const scaleFactor = height / ORIGINAL_WHITE_KEY_HEIGHT;

  const keyLabelFontSize = 16 * scaleFactor;
  const keyLabelY = height - (24 * scaleFactor);

  const noteNameFontSize = 10 * scaleFactor;
  const noteNameY = height - (8 * scaleFactor);


  return (
    <g
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp} // End note on mouse out
      style={{ touchAction: 'none' }}
    >
      {/* Shadow for depth */}
      <rect x={x + 2} y={2} width={w - 2} height={height} rx={4} ry={4} fill="rgba(0,0,0,0.15)" />
      {/* Main Key Body */}
      <rect
        x={x}
        y={0}
        width={w - 1} 
        height={height}
        rx={4} ry={4}
        fill={isActive ? "url(#whiteKeyActive)" : "url(#whiteKey)"}
        stroke="#b0b0b0"
        strokeWidth={1}
        className="cursor-pointer transition-transform duration-75 ease-out origin-top"
        style={{ transform: isActive ? 'rotateX(2deg) translateY(2px)' : 'none' }}
      />
      {/* Front Lip Highlight */}
      <rect x={x} y={height - (5 * scaleFactor)} width={w - 1} height={5 * scaleFactor} rx={4} ry={4} fill="rgba(0,0,0,0.05)" className="pointer-events-none" />

      {/* Key Label (Q, W, E...) */}
      {keyLabel && (
        <text x={x + w / 2} y={keyLabelY} textAnchor="middle" fontSize={keyLabelFontSize} fontWeight="bold" fill={isActive ? "#3b82f6" : "#94a3b8"} className="pointer-events-none select-none uppercase font-sans">
          {keyLabel}
        </text>
      )}
      {/* Note Name (C4, D4...) */}
      <text x={x + w / 2} y={noteNameY} textAnchor="middle" fontSize={noteNameFontSize} fontWeight="500" fill={isActive ? "#1d4ed8" : "#cbd5e1"} className="pointer-events-none select-none">
        {getNoteName(midi)}{octave}
      </text>
    </g>
  );
});

export default WhiteKey;