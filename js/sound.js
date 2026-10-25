// 竹北政策島 — 環境音效（Web Audio 即時合成，不載入音檔）
// 海浪一道一道湧上岸；清晨、白天有五色鳥，蟲鳴是草蟬，從早到晚都有。
// export createAmbience() → { setOn(on), setTime(t) }

export function createAmbience() {
  let ctx = null;
  let master = null;
  let on = false;
  let time = "day";
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

  // 五色鳥：低沉、空心的「嘓、嘓、嘓」，像敲木魚，一串十幾聲、節奏單調
  function barbet() {
    const t0 = ctx.currentTime + 0.05;
    const n = 10 + Math.floor(Math.random() * 14);
    const f = 560 + Math.random() * 120;
    const gap = 0.3 + Math.random() * 0.08;
    const pan = panner((Math.random() - 0.5) * 1.2);
    for (let i = 0; i < n; i++) {
      // 偶爾連敲兩下（嘓嘓）
      const t = t0 + i * gap + (i % 5 === 4 ? -gap * 0.45 : 0);
      [1, 2.02].forEach((h, k) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f * h * 1.06, t);
        o.frequency.exponentialRampToValueAtTime(f * h, t + 0.05);
        const v = (k ? 0.03 : 0.16) * (0.85 + Math.random() * 0.3);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g).connect(pan);
        o.start(t);
        o.stop(t + 0.18);
      });
    }
    return n * gap;
  }

  // 蟬：帶通噪音再用快速脈衝調變，做出「沙沙的嗡鳴」
  function cicada({ freq, q, pulse, vol, rise, hold, fade, wobble }) {
    const t = ctx.currentTime + 0.05;
    const end = t + rise + hold + fade;
    const src = ctx.createBufferSource();
    src.buffer = white;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    // 脈衝調變：振幅在 0 和 1 之間以 pulse Hz 快速開合
    const am = ctx.createGain();
    am.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = pulse;
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(am.gain);
    // 音高與音量緩慢起伏
    const wob = ctx.createOscillator();
    wob.frequency.value = 0.3 + Math.random() * 0.4;
    const wobDepth = ctx.createGain();
    wobDepth.gain.value = freq * wobble;
    wob.connect(wobDepth).connect(bp.frequency);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + rise);
    env.gain.setValueAtTime(vol, t + rise + hold);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(bp).connect(am).connect(env).connect(panner((Math.random() - 0.5) * 1.4));
    [src, lfo, wob].forEach((n) => { n.start(t); n.stop(end + 0.05); });
    return rise + hold + fade;
  }
  // 草蟬：小型蟬，躲在草叢裡發出細細高高、綿長不斷的「滋——」
  const grassCicada = () => cicada({
    freq: 7200 + Math.random() * 900, q: 10, pulse: 210 + Math.random() * 40, vol: 0.09,
    rise: 0.8, hold: 10 + Math.random() * 15, fade: 1.0, wobble: 0.015,
  });

  function panner(v) {
    if (!ctx.createStereoPanner) return master;
    const p = ctx.createStereoPanner();
    p.pan.value = v;
    p.connect(master);
    return p;
  }

  // 依時段排程：清晨、白天五色鳥；蟲鳴只有草蟬，白天到夜晚都有，夜晚較疏
  const VOICES = [
    { play: barbet, when: ["dawn", "day"], rest: [3, 9] },
    { play: grassCicada, when: ["dawn", "day", "dusk", "night"], rest: [2, 6], nightRest: [8, 20] },
  ];
  const voiceTimers = [];
  function schedule() {
    voiceTimers.forEach(clearTimeout);
    if (!on) return;
    VOICES.forEach((v, i) => {
      const loop = (first) => {
        if (!on) return;
        const active = v.when.includes(time);
        const dur = active && !first ? v.play() : 0;
        const [a, b] = time === "night" && v.nightRest ? v.nightRest : v.rest;
        voiceTimers[i] = setTimeout(() => loop(false), (dur + a + Math.random() * (b - a)) * 1000 * (first ? 0.3 : 1));
      };
      loop(true);
    });
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
