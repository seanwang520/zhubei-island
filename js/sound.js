// 竹北政策島 — 環境音效（Web Audio 即時合成，不載入音檔）
// 海浪一道一道湧上岸；白天、清晨有鳥叫，黃昏、夜晚換成蟲鳴。
// export createAmbience() → { setOn(on), setTime(t) }

export function createAmbience() {
  let ctx = null;
  let master = null;
  let on = false;
  let time = "day";
  let timer = null;
  let waveTimer = null;
  let white = null;

  // 噪音緩衝：白噪音，或積分成棕噪音（聽起來比較厚、比較遠）
  function noiseBuffer(brown) {
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return buf;
  }

  // 一道浪：湧起（濾波器漸開、音量漸強）→ 拍岸 → 泡沫退去（高頻沙沙聲慢慢消失）
  function wave() {
    const t = ctx.currentTime + 0.05;
    const rise = 1.6 + Math.random() * 1.2;
    const fall = 3.5 + Math.random() * 2.5;
    const peak = 0.45 + Math.random() * 0.3;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = (Math.random() - 0.5) * 0.8; pan.connect(master); }
    const out = pan || master;

    // 主體：低通噪音，截止頻率隨浪湧起而打開、退去時關上
    const body = ctx.createBufferSource();
    body.buffer = white;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(250, t);
    lp.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 900, t + rise);
    lp.frequency.exponentialRampToValueAtTime(350, t + rise + fall);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(peak, t + rise);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + rise + fall);
    body.connect(lp).connect(bg).connect(out);

    // 泡沫：高通的沙沙聲，拍岸後才出現、退得比較慢
    const foam = ctx.createBufferSource();
    foam.buffer = white;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2500;
    const fg = ctx.createGain();
    fg.gain.setValueAtTime(0.0001, t);
    fg.gain.setValueAtTime(0.0001, t + rise * 0.8);
    fg.gain.exponentialRampToValueAtTime(peak * 0.22, t + rise + 0.25);
    fg.gain.exponentialRampToValueAtTime(0.0001, t + rise + fall * 1.2);
    foam.connect(hp).connect(fg).connect(out);

    const end = t + rise + fall * 1.2 + 0.1;
    [body, foam].forEach((src) => { src.start(t, Math.random() * 3); src.stop(end); });
  }

  function scheduleWaves() {
    clearTimeout(waveTimer);
    if (!on) return;
    wave();
    waveTimer = setTimeout(scheduleWaves, 4500 + Math.random() * 4000);
  }

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // 遠方浪底：棕噪音（低頻多）過低通，持續的隆隆聲
    white = noiseBuffer(false);
    const brown = noiseBuffer(true);
    const bed = ctx.createBufferSource();
    bed.buffer = brown;
    bed.loop = true;
    const bedLp = ctx.createBiquadFilter();
    bedLp.type = "lowpass";
    bedLp.frequency.value = 380;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.22;
    bed.connect(bedLp).connect(bedGain).connect(master);
    bed.start();
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
    scheduleWaves();
    return on;
  }

  function setTime(t) {
    time = t;
    schedule();
  }

  return { setOn, setTime };
}
