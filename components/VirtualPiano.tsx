import React, { useState, useEffect, useCallback } from 'react';
import { useSynth } from '../hooks/useSynth';
import PianoKeys from './PianoKeys';
import { KEY_TO_OFFSET } from '../utils/constants';

const VirtualPiano: React.FC = () => {
  // State
  const [octaves] = useState({ start: 2, end: 6 }); // Standard 5 Octaves
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [volume, setVolume] = useState(7); // 0-10
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [isSustainActive, setIsSustainActive] = useState(false);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);

  // Audio Hook
  const { playNote, stopNote, enforceSilence, audioContext, setMasterVolume, releaseGlobalSustain } = useSynth();

  // Update master volume when volume state changes
  useEffect(() => {
    setMasterVolume(volume);
  }, [volume, setMasterVolume]);

  // Helper to calculate MIDI from key press
  const getMidiFromKey = useCallback((code: string, currentOctaveOffset: number) => {
    const baseMidi = 60; // Middle C (C4)
    const offset = KEY_TO_OFFSET[code];
    
    if (typeof offset === 'number') {
      return baseMidi + offset + currentOctaveOffset;
    }
    return null;
  }, []);

  // Keyboard Event Handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Resume audio context on first interaction
    if (!isAudioContextReady && audioContext.current?.state === 'suspended') {
      audioContext.current.resume().then(() => setIsAudioContextReady(true));
    }

    if (e.repeat) return;
    const action = KEY_TO_OFFSET[e.code];

    if (action === 'OCTAVE_DOWN') {
      e.preventDefault();
      setOctaveOffset(prev => Math.max(-24, prev - 12));
      return;
    }
    if (action === 'OCTAVE_UP') {
      e.preventDefault();
      setOctaveOffset(prev => Math.min(24, prev + 12));
      return;
    }
    if (action === 'SUSTAIN_TOGGLE') {
      e.preventDefault(); // Prevent page scroll on space for example if it were bound
      if (!isSustainActive) { // Only activate once
          setIsSustainActive(true);
      }
      return;
    }
    if (action === 'SILENCE') {
      e.preventDefault();
      enforceSilence();
      setActiveKeys(new Set());
      setIsSustainActive(false); // Also reset sustain
      return;
    }

    const midi = getMidiFromKey(e.code, octaveOffset);
    if (midi && midi >= 24 && midi <= 108) {
      if (!activeKeys.has(midi)) {
        setActiveKeys(prev => {
           const next = new Set(prev);
           next.add(midi);
           return next;
        });
        playNote(midi, volume / 10);
      }
    }
  }, [octaveOffset, activeKeys, playNote, volume, isSustainActive, enforceSilence, getMidiFromKey, audioContext, isAudioContextReady]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const action = KEY_TO_OFFSET[e.code];
    
    if (action === 'SUSTAIN_TOGGLE') {
      setIsSustainActive(false);
      releaseGlobalSustain(); // Release all currently sustained notes
      return;
    }

    const midi = getMidiFromKey(e.code, octaveOffset);
    if (midi && activeKeys.has(midi)) {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
      // Pass the current sustain state to stopNote
      stopNote(midi, isSustainActive);
    }
  }, [octaveOffset, activeKeys, stopNote, isSustainActive, getMidiFromKey, releaseGlobalSustain]);

  // Mouse/Touch interaction for keys directly
  const handleMousePlay = useCallback((midi: number, vol?: number) => {
    if (!isAudioContextReady && audioContext.current?.state === 'suspended') {
      audioContext.current.resume().then(() => setIsAudioContextReady(true));
    }
    setActiveKeys(prev => new Set(prev).add(midi));
    playNote(midi, vol);
  }, [playNote, audioContext, isAudioContextReady]);

  const handleMouseStop = useCallback((midi: number) => {
    setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
    });
    // For mouse/touch, assume sustain is off unless CapsLock is held (which isn't captured by mouse events)
    // or if we were to implement a dedicated UI sustain button.
    stopNote(midi, false); 
  }, [stopNote]);


  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Effect to manage audio context state for first user interaction
  const globalInteractionHandler = useCallback(() => {
    if (!isAudioContextReady && audioContext.current?.state === 'suspended') {
      audioContext.current.resume().then(() => {
        setIsAudioContextReady(true);
        window.removeEventListener('click', globalInteractionHandler);
        window.removeEventListener('keydown', globalInteractionHandler);
      });
    }
  }, [isAudioContextReady, audioContext]);

  useEffect(() => {
    if (audioContext.current?.state === 'suspended') {
      window.addEventListener('click', globalInteractionHandler);
      window.addEventListener('keydown', globalInteractionHandler);
    }
    return () => {
      window.removeEventListener('click', globalInteractionHandler);
      window.removeEventListener('keydown', globalInteractionHandler);
    };
  }, [globalInteractionHandler, audioContext]);


  return (
    <div 
        className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8"
    >
        {/* Main Card Container */}
        <div className="w-full max-w-[90%] lg:max-w-[70%] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col">
            
            {/* Header / Control Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/40">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight leading-none">Piano Pro</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Virtual Synthesizer</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex-wrap justify-center">
                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vol</span>
                        <input 
                            type="range" 
                            min="0" max="10" 
                            value={volume} 
                            onChange={(e) => setVolume(parseInt(e.target.value))}
                            aria-label="Volume control"
                            className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

                    {/* Transpose */}
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Octave</span>
                         <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                             <button 
                                onClick={() => setOctaveOffset(prev => Math.max(-24, prev - 12))}
                                className="px-2 py-1 text-gray-600 hover:text-blue-600 font-medium transition active:scale-95"
                                aria-label="Decrease octave shift"
                             >-</button>
                             <span className="w-6 text-center text-sm font-semibold text-gray-800">{octaveOffset/12}</span>
                             <button 
                                onClick={() => setOctaveOffset(prev => Math.min(24, prev + 12))}
                                className="px-2 py-1 text-gray-600 hover:text-blue-600 font-medium transition active:scale-95"
                                aria-label="Increase octave shift"
                             >+</button>
                         </div>
                    </div>

                    <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

                    {/* Sustain Toggle */}
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sustain</span>
                         <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${isSustainActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                              onClick={() => { setIsSustainActive(prev => !prev); if (isSustainActive) releaseGlobalSustain(); }}
                              role="switch"
                              aria-checked={isSustainActive}
                              aria-label="Toggle sustain pedal"
                         >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isSustainActive ? 'translate-x-4' : ''}`}></div>
                         </div>
                    </div>
                    
                    {/* Reset / Panic */}
                    <button 
                        onClick={() => { enforceSilence(); setActiveKeys(new Set()); setIsSustainActive(false); }}
                        className="ml-2 p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                        title="Panic / Silence All"
                        aria-label="Silence all notes"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Piano Container */}
            <div className="p-1 md:p-8 bg-gradient-to-b from-gray-50 to-gray-100 flex-grow min-h-[25vh] max-h-[50vh]">
                <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-[#050505] h-full">
                    {/* Top Fallboard Detail */}
                    <div className="h-[1.5vh] bg-gradient-to-b from-[#1a1a1a] to-black border-b border-gray-800"></div>
                    
                    {/* Keys */}
                    <PianoKeys
                        octaves={octaves}
                        playNote={handleMousePlay}
                        stopNote={handleMouseStop}
                        activeKeys={activeKeys}
                        volume={volume}
                        octaveOffset={octaveOffset}
                    />
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
                        Mapped to QWERTY Keyboard • Caps Lock for Sustain • Space to Stop
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default VirtualPiano;