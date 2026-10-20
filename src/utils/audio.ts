// Melodic Boutique Audio Chime for Amika Café (Web Audio API)

export function playMelodicChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // G5 (783.99 Hz) -> C6 (1046.50 Hz) -> E6 (1318.51 Hz)
    // Harmonie major triad, typical of luxury boutique hotel / specialty cafe chimes
    const notes = [
      { freq: 783.99, time: 0.0, duration: 1.0, gain: 0.22 },
      { freq: 1046.5, time: 0.16, duration: 1.2, gain: 0.24 },
      { freq: 1318.51, time: 0.32, duration: 1.6, gain: 0.2 },
    ];

    notes.forEach((n) => {
      // Main fundamental tone (pure crystal bell)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(n.gain, ctx.currentTime + n.time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.duration);

      // Subtle warm second harmonic for acoustic depth
      const harmonic = ctx.createOscillator();
      const hGain = ctx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(n.freq * 2, ctx.currentTime + n.time);

      hGain.gain.setValueAtTime(0.0001, ctx.currentTime + n.time);
      hGain.gain.exponentialRampToValueAtTime(n.gain * 0.22, ctx.currentTime + n.time + 0.015);
      hGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.time + n.duration * 0.5);

      harmonic.connect(hGain);
      hGain.connect(ctx.destination);

      harmonic.start(ctx.currentTime + n.time);
      harmonic.stop(ctx.currentTime + n.time + n.duration * 0.5);
    });
  } catch {
    // Autoplay policy restriction before user gesture
  }
}
