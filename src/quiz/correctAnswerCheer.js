/**
 * Quiz answer feedback audio — Mixkit SFX with quiet Web Audio fallbacks.
 * @see public/sounds/SOURCE.txt — Mixkit Sound Effects Free License
 */

const CORRECT_MP3 = `${import.meta.env.BASE_URL}sounds/correct-answer.mp3`;
const WRONG_MP3 = `${import.meta.env.BASE_URL}sounds/wrong-answer.mp3`;

let sharedCtx = null;
/** @type {HTMLAudioElement | null} */
let correctAudio = null;
/** @type {HTMLAudioElement | null} */
let wrongAudio = null;

function wantsReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function playCorrectSynthFallback() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sharedCtx) sharedCtx = new AC();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.09, t0 + 0.015);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    master.connect(ctx.destination);

    const notes = [
      { freq: 523.25, at: 0, dur: 0.11 },
      { freq: 659.25, at: 0.07, dur: 0.14 },
    ];

    for (const { freq, at, dur } of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0 + at);
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t0 + at);
      osc.stop(t0 + at + dur + 0.02);
    }
  } catch {
    /* ignore */
  }
}

/** Soft descending tone — quieter than the correct ding. */
function playWrongSynthFallback() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sharedCtx) sharedCtx = new AC();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.055, t0 + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(415.3, t0);
    osc.frequency.exponentialRampToValueAtTime(311.13, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.24);
  } catch {
    /* ignore */
  }
}

export function playCorrectCheer() {
  if (wantsReducedMotion()) return;

  try {
    if (!correctAudio) {
      correctAudio = new Audio(CORRECT_MP3);
      correctAudio.preload = "auto";
    }
    correctAudio.volume = 0.42;
    correctAudio.currentTime = 0;
    const p = correctAudio.play();
    if (p !== undefined) {
      p.catch(() => {
        playCorrectSynthFallback();
      });
    }
  } catch {
    playCorrectSynthFallback();
  }
}

export function playWrongHint() {
  if (wantsReducedMotion()) return;

  try {
    if (!wrongAudio) {
      wrongAudio = new Audio(WRONG_MP3);
      wrongAudio.preload = "auto";
    }
    wrongAudio.volume = 0.28;
    wrongAudio.currentTime = 0;
    const p = wrongAudio.play();
    if (p !== undefined) {
      p.catch(() => {
        playWrongSynthFallback();
      });
    }
  } catch {
    playWrongSynthFallback();
  }
}
