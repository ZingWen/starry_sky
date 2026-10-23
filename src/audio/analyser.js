// 頻譜分析：把 FFT 結果整理成 bass / mid / treble / beat 等 0~1 的數值

const BANDS = {
  bass: [20, 250],
  mid: [250, 2000],
  treble: [2000, 12000],
};

const BEAT_COOLDOWN = 0.28; // 秒，避免同一拍被重複觸發
const HISTORY_SIZE = 60; // 約 1 秒的低音歷史，用來判斷節拍

export class AudioAnalyser {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.freq = null;

    // loudness 是沒經過自動增益的實際音量，用來判斷「現在到底有沒有聲音」
    this.levels = { bass: 0, mid: 0, treble: 0, volume: 0, loudness: 0, beat: 0, beatTriggered: false };
    this.peaks = { bass: 0.2, mid: 0.2, treble: 0.2 };
    this.bassHistory = [];
    this.lastBeat = 0;
    this.time = 0;
  }

  /** 必須在使用者點擊的事件中呼叫，瀏覽器才允許播放聲音 */
  ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.6;
      this.analyser.minDecibels = -85;
      this.analyser.maxDecibels = -20;
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  get active() {
    return this.source !== null;
  }

  connect(node) {
    this.disconnect();
    node.connect(this.analyser);
    this.source = node;
  }

  disconnect() {
    if (!this.source) return;
    try {
      this.source.disconnect(this.analyser);
    } catch {
      // 音源已經被斷開
    }
    this.source = null;
  }

  bandEnergy(lo, hi) {
    const nyquist = this.ctx.sampleRate / 2;
    const n = this.freq.length;
    const a = Math.max(1, Math.floor((lo / nyquist) * n));
    const b = Math.min(n - 1, Math.ceil((hi / nyquist) * n));
    let sum = 0;
    for (let i = a; i <= b; i++) sum += this.freq[i];
    return sum / ((b - a + 1) * 255);
  }

  /**
   * 以對數間距切出 count 個頻段（40Hz ~ 12kHz），回傳 0~1 的能量。
   * 高頻本來就比較弱，所以越右邊的頻段補償越多。
   */
  getSpectrum(count, out = new Float32Array(count)) {
    if (!this.source) return out.fill(0);
    const nyquist = this.ctx.sampleRate / 2;
    const n = this.freq.length;
    for (let i = 0; i < count; i++) {
      const lo = 40 * Math.pow(300, i / count);
      const hi = 40 * Math.pow(300, (i + 1) / count);
      const a = Math.max(1, Math.floor((lo / nyquist) * n));
      const b = Math.max(a, Math.min(n - 1, Math.floor((hi / nyquist) * n)));
      let sum = 0;
      for (let k = a; k <= b; k++) sum += this.freq[k];
      const avg = sum / ((b - a + 1) * 255);
      const tilt = 1 + (i / count) * 0.8;
      out[i] = Math.min(1, Math.pow(avg, 1.4) * tilt * 1.3);
    }
    return out;
  }

  update(dt) {
    this.time += dt;
    const L = this.levels;
    L.beatTriggered = false;

    const raw = { bass: 0, mid: 0, treble: 0 };
    if (this.source) {
      this.analyser.getByteFrequencyData(this.freq);
      for (const k in BANDS) raw[k] = this.bandEnergy(...BANDS[k]);
    }

    for (const k in BANDS) {
      // 自動增益：跟著最近的峰值做正規化，小聲的音樂也能有明顯律動
      this.peaks[k] = Math.max(raw[k], this.peaks[k] * Math.exp(-dt * 0.15), 0.15);
      const target = Math.pow(Math.min(1, raw[k] / this.peaks[k]), 1.5);
      // 上升快、下降慢，畫面比較有彈性
      const rate = target > L[k] ? 18 : 4;
      L[k] += (target - L[k]) * (1 - Math.exp(-dt * rate));
    }
    L.volume = (L.bass + L.mid + L.treble) / 3;
    const loud = (raw.bass + raw.mid + raw.treble) / 3;
    L.loudness += (loud - L.loudness) * (1 - Math.exp(-dt * 3));

    this.bassHistory.push(raw.bass);
    if (this.bassHistory.length > HISTORY_SIZE) this.bassHistory.shift();
    const avg = this.bassHistory.reduce((s, v) => s + v, 0) / this.bassHistory.length;

    if (
      this.source &&
      raw.bass > avg * 1.25 + 0.02 &&
      raw.bass > 0.2 &&
      this.time - this.lastBeat > BEAT_COOLDOWN
    ) {
      L.beat = 1;
      L.beatTriggered = true;
      this.lastBeat = this.time;
    } else {
      L.beat *= Math.exp(-dt * 5);
    }

    return L;
  }
}
