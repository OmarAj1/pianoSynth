import { useEffect, useRef, useCallback } from 'react';
import { ActiveNoteData } from '../types';

export const useSynth = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const masterGainNode = useRef<GainNode | null>(null);
  const activeOscillators = useRef<Map<number, ActiveNoteData>>(new Map()); // Notes currently held down
  const sustainedOscillators = useRef<Map<number, ActiveNoteData>>(new Map()); // Notes released but sustaining

  // Initialize AudioContext and Master Gain Node
  useEffect(() => {
    if (!audioContext.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContext.current = new AudioCtx();
        masterGainNode.current = audioContext.current.createGain();
        masterGainNode.current.connect(audioContext.current.destination);
      }
    }
    
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Set Master Volume
  const setMasterVolume = useCallback((volume: number) => {
    if (masterGainNode.current && audioContext.current) {
      // Scale volume from 0-10 to 0-1
      const gainValue = Math.min(1, Math.max(0, volume / 10));
      masterGainNode.current.gain.setValueAtTime(gainValue, audioContext.current.currentTime);
    }
  }, []);

  const playNote = useCallback((midiNote: number, volume: number = 0.5) => {
    if (!audioContext.current || !masterGainNode.current) {
      return; 
    }
    
    const ctx = audioContext.current;
    
    // If this note was previously sustaining, remove it from sustained list
    // as it's now being actively played again.
    if (sustainedOscillators.current.has(midiNote)) {
        const { oscillator, gainNode } = sustainedOscillators.current.get(midiNote)!;
        gainNode.gain.cancelScheduledValues(ctx.currentTime); // Cancel previous release
        sustainedOscillators.current.delete(midiNote);
        activeOscillators.current.set(midiNote, { oscillator, gainNode }); // Add to active
        return;
    }

    if (activeOscillators.current.has(midiNote)) {
      return; // Already playing
    }

    // Frequency calculation
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle'; // Triangle provides a slightly warmer, piano-like tone than sine
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Envelope for attack
    const t = ctx.currentTime;
    const attackTime = 0.015;

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(volume, t + attackTime);

    osc.connect(gainNode);
    gainNode.connect(masterGainNode.current); // Connect to master gain
    
    osc.start();

    activeOscillators.current.set(midiNote, { oscillator: osc, gainNode });
  }, []);

  const stopNote = useCallback((midiNote: number, isGlobalSustainActive: boolean) => {
    const noteData = activeOscillators.current.get(midiNote);
    if (!audioContext.current || !noteData) {
      return;
    }

    const ctx = audioContext.current;
    const { oscillator: osc, gainNode } = noteData;
    const releaseTime = 0.15;
    const sustainDecayTime = 0.8; // Decay time if sustaining

    // Remove from active list
    activeOscillators.current.delete(midiNote);

    if (isGlobalSustainActive) {
      // Move to sustained list and apply sustain decay
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(gainNode.gain.value * 0.4, ctx.currentTime + sustainDecayTime); // Slower decay
      sustainedOscillators.current.set(midiNote, { oscillator: osc, gainNode });
    } else {
      // Normal release
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + releaseTime);

      osc.stop(ctx.currentTime + releaseTime + 0.05); // Stop after release
      setTimeout(() => {
          osc.disconnect();
          gainNode.disconnect();
      }, (releaseTime + 0.1) * 1000);
    }
  }, []);

  const releaseGlobalSustain = useCallback(() => {
    if (!audioContext.current) return;
    const ctx = audioContext.current;
    const releaseTime = 0.2; // Faster release for global sustain off

    sustainedOscillators.current.forEach(({ oscillator: osc, gainNode }) => {
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + releaseTime);

      osc.stop(ctx.currentTime + releaseTime + 0.05);
      setTimeout(() => {
          osc.disconnect();
          gainNode.disconnect();
      }, (releaseTime + 0.1) * 1000);
    });
    sustainedOscillators.current.clear();
  }, []);

  const enforceSilence = useCallback(() => {
    if (!audioContext.current) return;
    const ctx = audioContext.current;

    // Stop all active oscillators
    activeOscillators.current.forEach(({ oscillator, gainNode }) => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (e) {
        console.warn("Error stopping active oscillator:", e);
      }
    });
    activeOscillators.current.clear();

    // Stop all sustained oscillators
    sustainedOscillators.current.forEach(({ oscillator, gainNode }) => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (e) {
        console.warn("Error stopping sustained oscillator:", e);
      }
    });
    sustainedOscillators.current.clear();
  }, []);

  return { playNote, stopNote, enforceSilence, audioContext, setMasterVolume, releaseGlobalSustain };
};