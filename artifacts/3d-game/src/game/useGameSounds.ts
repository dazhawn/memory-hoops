import { useRef, useCallback, useState } from 'react';

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

function resume(ctx: AudioContext) {
  if (ctx.state === 'suspended') ctx.resume();
}

const CELL_FREQUENCIES = [
  261.63, 293.66, 329.63, 349.23,
  392.0,  440.0,  493.88, 523.25,
  587.33, 659.25, 698.46, 783.99,
  880.0,  987.77, 1046.5, 1174.66,
];

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.5,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function useGameSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = getAudioContext();
    }
    resume(ctxRef.current);
    return ctxRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      mutedRef.current = !prev;
      return !prev;
    });
  }, []);

  const playCellTone = useCallback(
    (cellIndex: number) => {
      if (mutedRef.current) return;
      const ctx = getCtx();
      const freq = CELL_FREQUENCIES[cellIndex % CELL_FREQUENCIES.length];
      const now = ctx.currentTime;
      playTone(ctx, freq, now, 0.45, 'sine', 0.4);
      playTone(ctx, freq * 2, now, 0.2, 'sine', 0.08);
    },
    [getCtx],
  );

  const playCorrectTap = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.12, 'sine', 0.35);
    playTone(ctx, 1320, now + 0.06, 0.12, 'sine', 0.2);
  }, [getCtx]);

  const playWrongTap = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.4);
  }, [getCtx]);

  const playSuccess = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      playTone(ctx, freq, now + i * 0.13, 0.28, 'sine', 0.4);
    });
    playTone(ctx, 1046.5, now + notes.length * 0.13, 0.5, 'sine', 0.45);
  }, [getCtx]);

  const playFail = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const pairs: [number, number][] = [
      [440, 0],
      [349.23, 0.22],
      [293.66, 0.44],
      [220, 0.66],
    ];
    pairs.forEach(([freq, offset]) => {
      playTone(ctx, freq, now + offset, 0.25, 'sawtooth', 0.3);
    });
  }, [getCtx]);

  // Basket: warm rolling C-major arpeggio — satisfying "score" moment
  const playBasket = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    playTone(ctx, 130.81, now,         0.20, 'sine',     0.22); // C3 thud
    playTone(ctx, 523.25, now,         0.55, 'sine',     0.30); // C5
    playTone(ctx, 659.25, now + 0.05,  0.50, 'sine',     0.26); // E5
    playTone(ctx, 783.99, now + 0.10,  0.45, 'sine',     0.22); // G5
    playTone(ctx, 1046.5, now + 0.15,  0.38, 'sine',     0.16); // C6 sparkle
  }, [getCtx]);

  // Game over fanfare: ascending 4-note run then a held chord swell
  const playGameOver = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const s = 0.2;
    playTone(ctx, 523.25, now,           0.28, 'triangle', 0.38); // C5
    playTone(ctx, 659.25, now + s,       0.28, 'triangle', 0.38); // E5
    playTone(ctx, 783.99, now + s * 2,   0.28, 'triangle', 0.38); // G5
    playTone(ctx, 1046.5, now + s * 3,   0.55, 'triangle', 0.48); // C6 held
    playTone(ctx, 523.25, now + s * 3.6, 0.85, 'sine',     0.22); // chord swell
    playTone(ctx, 659.25, now + s * 3.6, 0.85, 'sine',     0.20);
    playTone(ctx, 783.99, now + s * 3.6, 0.85, 'sine',     0.18);
  }, [getCtx]);

  const resumeContext = useCallback(() => {
    getCtx();
  }, [getCtx]);

  return {
    playCellTone,
    playCorrectTap,
    playWrongTap,
    playSuccess,
    playFail,
    playBasket,
    playGameOver,
    isMuted,
    toggleMute,
    resumeContext,
  };
}
