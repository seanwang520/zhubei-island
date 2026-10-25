// 竹北政策島 — 環境音效（Web Audio 即時合成，不載入音檔）
// 海浪聲一直都在；白天、清晨有鳥叫，黃昏、夜晚換成蟲鳴。
// export createAmbience() → { setOn(on), setTime(t) }

export function createAmbience() {
  let ctx = null;
  let master = null;
  let on = false;
  let time = "day";
  let timer = null;

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // 海浪：低通白噪音，音量隨慢速 LFO 起伏
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const wave = ctx.createGain();
    wave.gain.value = 0.16;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.11;
    lfo.connect(lfoGain).connect(wave.gain);
    noise.connect(lp).connect(wave).connect(master);
    noise.start();
    lfo.start();
    return true;
  }

  // 一聲鳥叫：兩三個快速上滑的音
  function chirp() {
    const t0 = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 2);
    const base = 2600 + Math.random() * 1200;
    for (let i = 0; i < notes; i++) {
      const t = t0 + i * 0.13;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.08);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.1);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.12);
    }
  }

  // 一串蟲鳴：高頻短脈衝
  function cricket() {
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 4300 + Math.random() * 500;
    g.gain.value = 0;
    for (let i = 0; i < 6; i++) {
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(0.025, t);
      g.gain.setValueAtTime(0, t + 0.035);
    }
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + 0.5);
  }

  function schedule() {
    clearTimeout(timer);
    if (!on) return;
    const night = time === "night" || time === "dusk";
    timer = setTimeout(() => {
      if (!on) return;
      if (night) cricket(); else chirp();
      schedule();
    }, night ? 600 + Math.random() * 1400 : 2500 + Math.random() * 5000);
  }

  function setOn(v) {
    on = !!v;
    if (on && !ctx && !init()) { on = false; return false; }
    if (!ctx) return on;
    if (on) ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.4);
    schedule();
    return on;
  }

  function setTime(t) {
    time = t;
    schedule();
  }

  return { setOn, setTime };
}
