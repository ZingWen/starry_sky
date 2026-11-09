// 用程式產生的無線電雜訊：白噪音 + 忽大忽小的音量 + 隨機爆裂聲

const VOLUME = 0.17; // 雜訊音量，0~1
const LOOP_SECONDS = 4;
const FADE_IN = 1.2; // 秒

function createStaticBuffer(ctx) {
  const length = Math.floor(ctx.sampleRate * LOOP_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let gate = 1;
  let nextGate = 0;
  let crackle = 0;

  for (let i = 0; i < length; i++) {
    if (i >= nextGate) {
      gate = 0.35 + Math.random() * 0.65;
      nextGate = i + Math.floor(ctx.sampleRate * (0.02 + Math.random() * 0.1));
    }
    if (Math.random() < 0.0004) crackle = 1;
    crackle *= 0.985;
    data[i] = (Math.random() * 2 - 1) * Math.min(1, gate * 0.7 + crackle);
  }
  return buffer;
}

/**
 * 開始播放雜訊，直接送到喇叭、不經過頻譜分析。
 * 回傳 stop(fadeSeconds)。
 */
export function startStatic(ctx) {
  const source = ctx.createBufferSource();
  source.buffer = createStaticBuffer(ctx);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.6;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FADE_IN);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.addEventListener('ended', () => gain.disconnect(), { once: true });
  source.start();

  let stopped = false;
  return {
    stop(fadeSeconds = 0.3) {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
      source.stop(now + fadeSeconds);
    },
  };
}
