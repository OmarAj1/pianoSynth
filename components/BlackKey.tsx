import React from 'react';
import { BLACK_KEY_HEIGHT_RATIO, ORIGINAL_WHITE_KEY_HEIGHT } from '../utils/constants';

interface BlackKeyProps {
  midi: number;
  x: number;
  w: number;
  height: number; // This is now a relative height from SVG_VIEWBOX_HEIGHT_UNIT * BLACK_KEY_HEIGHT_RATIO
  yOffset: number; // Added for vertical positioning
  isActive: boolean;
  keyLabel: string | null;
  volume: number;
  playNote: (midi: number, vol?: number) => void;
  stopNote: (midi: number) => void;
  viewboxHeight: number; // The total height of the SVG viewbox
}

const BlackKey: React.FC<BlackKeyProps> = React.memo(({
  midi, x, w, height, yOffset, isActive, keyLabel, volume, playNote, stopNote, viewboxHeight
}) => {
  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    playNote(midi, volume / 10);
  };

  const handleUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopNote(midi);
  };

  // Calculate scaled font size and Y position based on the current key height relative to original black key height
  const originalBlackKeyHeight = ORIGINAL_WHITE_KEY_HEIGHT * BLACK_KEY_HEIGHT_RATIO;
  const scaleFactor = height / originalBlackKeyHeight;

  const keyLabelFontSize = 13 * scaleFactor;
  const keyLabelY = yOffset + height - (12 * scaleFactor);

  return (
    <g
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp} // End note on mouse out
      style={{ touchAction: 'none' }}
    >
      {/* Shadow */}
      <rect x={x + 4} y={yOffset} width={w} height={height + (4 * scaleFactor)} rx={3} ry={3} fill="rgba(0,0,0,0.3)" />
      {/* Main Key Body */}
      <rect
        x={x}
        y={yOffset}
        width={w}
        height={height}
        rx={3} ry={3}
        fill={isActive ? "url(#blackKeyActive)" : "url(#blackKey)"}
        stroke="#111"
        strokeWidth={1}
        className="cursor-pointer transition-transform duration-75 ease-out origin-top"
        style={{ transform: isActive ? 'rotateX(-3deg) translateY(1px)' : 'none' }}
      />
      {/* Top Highlight/Reflection */}
      <rect x={x + w*0.15} y={yOffset + (5 * scaleFactor)} width={w*0.7} height={height * 0.85} rx={2} ry={2} fill="url(#blackKeyShine)" opacity={isActive ? 0.2 : 0.5} className="pointer-events-none" />
      
      {/* Key Label on Black Key */}
      {keyLabel && (
        <text x={x + w / 2} y={keyLabelY} textAnchor="middle" fontSize={keyLabelFontSize} fontWeight="bold" fill="white" className="pointer-events-none select-none uppercase font-sans opacity-90">
          {keyLabel}
        </text>
      )}
    </g>
  );
});

export default BlackKey;