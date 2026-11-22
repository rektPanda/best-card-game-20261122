// BRANKAS — Deck Heist. Sound: tiny synthesized blips from WebAudio, no audio
// files and no network. Everything is guarded: a browser without audio just
// plays silent.
export function createSound() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = AC ? new AC() : null;
    } catch {
      ctx = null;
    }
    return ctx;
  }
  function tone(freq, dur, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainValue, audio.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + dur);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(audio.currentTime + when);
      osc.stop(audio.currentTime + when + dur);
    } catch {
      // Audio is decoration, never a crash.
    }
  }
  return {
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    click() { tone(660, 0.06, 'sine', 0.08); },
    play() { tone(520, 0.09, 'triangle', 0.12); tone(780, 0.09, 'triangle', 0.1, 0.07); },
    hit() { tone(180, 0.12, 'sawtooth', 0.12); },
    coin() { tone(990, 0.08, 'sine', 0.1); tone(1320, 0.12, 'sine', 0.1, 0.06); },
    turn() { tone(440, 0.08, 'sine', 0.07); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.12, i * 0.12)); },
    lose() { [400, 350, 300, 220].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.09, i * 0.14)); },
  };
}
