import { SURPRISES } from '../stories/index.js';
import { SPEECH } from '../stories/_settings.js';
import { startStatic } from '../audio/static.js';

const STATE_KEY = 'starry-sky-surprise';
const VOICE_KEY = 'starry-sky-surprise-voice';

const MIN_WAIT = 3; // 分鐘，當天第一次進站後最快多久出現
const MAX_WAIT = 15; // 分鐘，當天第一次進站後最慢多久出現
const MIN_DELAY = 5000; // 預定時間已過時，符合條件後再等多久出現
const NOTICE_DURATION = 600000; // 雜訊提示沒人回應時，響多久後淡出
const NOTICE_FADE = 3; // 秒，雜訊沒人回應時的淡出時間
const SILENCE_HOLD = 6; // 秒，必須連續無聲這麼久才算關掉聲音，音樂的短暫斷句不算
const FADE_MS = 450; // 換句時淡出的時間，要跟 style.css 的 #radio-line 一致
const SPEECH_TIMEOUT = 15000; // 瀏覽器語音沒回報結束時，最多鎖定下一句多久

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * 每天最多出現一次的驚喜。
 * 只在進站、切回頁面、音樂開始、切到 Whisper、計時器到期時讀取狀態，不做輪詢。
 */
export function setupSurprise({ getContext, canStart, onActiveChange }) {
  const root = document.querySelector('#radio');
  const lineEl = document.querySelector('#radio-line');
  const choicesEl = document.querySelector('#radio-choices');
  const tools = document.querySelector('#radio-tools');
  const voiceBtn = document.querySelector('#radio-voice');
  const closeBtn = document.querySelector('#radio-close');

  const params = new URLSearchParams(location.search);
  const testMode = params.has('surprise');
  const speechSupported = 'speechSynthesis' in window;

  let memory = null; // 無痕或停用儲存時的備援
  let timer = 0;
  let noticeTimer = 0;
  let fadeTimer = 0;

  let active = false;
  let inDialogue = false;
  let busy = false; // 淡出換句中，暫時不接受點擊
  let waiting = false; // 正在等使用者關掉聲音
  let silentFor = 0;

  let staticSound = null;
  let voice = null;
  let voiceOn = true;
  let script = null;
  let stack = []; // 目前播放位置：[{ steps, index }]，進入選項分支時往上疊一層

  try {
    voiceOn = localStorage.getItem(VOICE_KEY) !== 'off';
  } catch {}
  updateVoiceButton();

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY)) ?? memory;
    } catch {
      return memory;
    }
  }

  function write(state) {
    memory = state;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }

  function schedule() {
    clearTimeout(timer);
    if (active || testMode) return;

    let state = read();
    if (state?.date !== today()) {
      const wait = (MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT)) * 60000;
      const endOfDay = new Date().setHours(23, 59, 0, 0);
      state = {
        date: today(),
        fireAt: Math.min(Date.now() + wait, endOfDay),
        shown: false,
        lastId: state?.lastId ?? null,
      };
      write(state);
    }
    if (state.shown) return;
    timer = setTimeout(fire, Math.max(state.fireAt - Date.now(), MIN_DELAY));
  }

  function pickScript(lastId) {
    const others = SURPRISES.filter((s) => s.id !== lastId);
    const list = others.length ? others : SURPRISES;
    return list[Math.floor(Math.random() * list.length)];
  }

  function fire() {
    // 不符合條件就先不播，切回頁面、音樂開始或切到 Whisper 時會重新排程
    if (active || document.hidden || !canStart()) return;
    const state = read();
    if (state?.date !== today()) {
      schedule();
      return;
    }
    if (state.shown) return;

    const picked = pickScript(state.lastId);
    if (!picked) return;
    write({ ...state, shown: true, lastId: picked.id });
    begin(picked);
  }

  function begin(picked) {
    script = picked;
    active = true;
    silentFor = 0;
    onActiveChange();

    staticSound = startStatic(getContext());
    root.classList.add('on');
    render('宇宙傳來雜訊...', {
      clickable: false,
      choices: [
        { label: '嘗試聽見', onChoose: listen },
        { label: '充耳不聞', onChoose: () => finish() },
      ],
    });
    noticeTimer = setTimeout(() => finish(NOTICE_FADE), NOTICE_DURATION);
  }

  function listen() {
    clearTimeout(noticeTimer);
    staticSound?.stop();
    staticSound = null;
    inDialogue = true;
    tools.classList.add('on');
    stack = [{ steps: script.script, index: 0 }];
    runStep();
  }

  function finish(staticFade) {
    if (!active) return;
    active = false;
    inDialogue = false;
    waiting = false;
    busy = false;
    clearTimeout(noticeTimer);
    clearTimeout(fadeTimer);
    stopVoice();
    staticSound?.stop(staticFade);
    staticSound = null;
    lineEl.disabled = true;
    lineEl.classList.remove('show');
    choicesEl.classList.remove('show');
    tools.classList.remove('on');
    root.classList.remove('on');
    onActiveChange();
    schedule();
  }

  function render(text, { clickable, choices = [] }, onShown) {
    clearTimeout(fadeTimer);
    busy = true;
    lineEl.classList.remove('show');
    choicesEl.classList.remove('show');

    fadeTimer = setTimeout(() => {
      lineEl.textContent = text;
      lineEl.disabled = !clickable;
      choicesEl.replaceChildren(
        ...choices.map((choice) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = choice.label;
          button.addEventListener('click', () => {
            if (!busy && !voice) choice.onChoose();
          });
          return button;
        }),
      );
      lineEl.classList.add('show');
      choicesEl.classList.toggle('show', choices.length > 0);
      busy = false;
      if (clickable) lineEl.focus({ preventScroll: true });
      onShown?.();
    }, FADE_MS);
  }

  function showLine(line, options) {
    render(line.text, options, () => playVoice(line));
  }

  function runStep() {
    const frame = stack.at(-1);
    const step = frame.steps[frame.index];

    if (step.type === 'say') {
      const next = frame.steps[frame.index + 1];
      const options = next?.type === 'ask' ? next.options : [];
      showLine(step, {
        clickable: options.length === 0,
        choices: options.map((o) => ({ label: o.label, onChoose: () => choose(o) })),
      });
    } else if (step.type === 'waitForSilence') {
      if (silentFor >= SILENCE_HOLD) {
        goNext();
      } else {
        waiting = true;
        showLine(step.line, { clickable: false });
      }
    } else {
      goNext(); // 沒有接在 say 後面的 ask：開發時會有檢查訊息，這裡略過避免卡住
    }
  }

  function choose(option) {
    stack.at(-1).index++; // 移到 ask，分支播完後從 ask 的下一步繼續
    if (option.steps.length) {
      stack.push({ steps: option.steps, index: 0 });
      runStep();
    } else {
      goNext();
    }
  }

  function goNext() {
    waiting = false;
    while (stack.length) {
      const frame = stack.at(-1);
      frame.index++;
      if (frame.index < frame.steps.length) {
        runStep();
        return;
      }
      stack.pop();
    }
    finish();
  }

  function advance() {
    if (busy || waiting || voice || !inDialogue) return; // 該句唸完才能換下一句
    goNext();
  }

  function setVoice(next) {
    voice = next;
    root.classList.toggle('speaking', Boolean(next));
  }

  function stopVoice() {
    const playing = voice;
    setVoice(null);
    playing?.stop();
  }

  function playVoice(line) {
    stopVoice();
    if (!voiceOn) return;
    if (line.voice) playFile(line.voice);
    else speak(line.speak ?? line.text);
  }

  function playFile(path) {
    const audio = new Audio(`voices/${path}`);
    const handle = { stop: () => audio.pause() };
    const release = () => {
      if (voice === handle) setVoice(null);
    };
    audio.addEventListener('ended', release, { once: true });
    audio.addEventListener('error', release, { once: true });
    setVoice(handle);
    audio.play().catch(release);
  }

  function findSpeechVoice(language) {
    const prefix = language === 'zh' ? 'zh' : 'en';
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(prefix));
    for (const name of SPEECH.voices[language] ?? []) {
      const found = voices.find((v) => v.name.includes(name));
      if (found) return found;
    }
    return null;
  }

  function speak(text) {
    // 空字串或只有刪節號的句子保持安靜
    if (!speechSupported || !text || /^[.。…\s]+$/.test(text)) return;

    const language = /[㐀-鿿]/.test(text) ? 'zh' : 'en';
    const utterance = new SpeechSynthesisUtterance(text);
    const speechVoice = findSpeechVoice(language);
    utterance.voice = speechVoice;
    utterance.lang = speechVoice?.lang ?? (language === 'zh' ? 'zh-TW' : 'en-US');
    utterance.rate = SPEECH.rate;
    utterance.pitch = SPEECH.pitch;

    const handle = {
      utterance, // 保留參照，避免 Chrome 回收後收不到結束事件
      stop: () => speechSynthesis.cancel(),
    };
    const release = () => {
      clearTimeout(watchdog);
      if (voice === handle) setVoice(null);
    };
    // 瀏覽器偶爾不回報結束，不能讓無聲判斷永遠卡住
    const watchdog = setTimeout(release, SPEECH_TIMEOUT);
    utterance.addEventListener('end', release, { once: true });
    utterance.addEventListener('error', release, { once: true });

    setVoice(handle);
    speechSynthesis.speak(utterance);
  }

  function updateVoiceButton() {
    voiceBtn.textContent = voiceOn ? '語音：開' : '語音：關';
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
  }

  if (speechSupported) speechSynthesis.getVoices(); // 語音清單是非同步載入，先觸發一次
  window.addEventListener('pagehide', stopVoice); // 重新整理或離開時，不讓瀏覽器繼續唸

  lineEl.addEventListener('click', advance);
  closeBtn.addEventListener('click', () => finish());
  voiceBtn.addEventListener('click', () => {
    voiceOn = !voiceOn;
    if (!voiceOn) stopVoice();
    updateVoiceButton();
    try {
      localStorage.setItem(VOICE_KEY, voiceOn ? 'on' : 'off');
    } catch {}
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });

  if (testMode) {
    window.addEventListener(
      'pointerdown',
      () => {
        const id = params.get('surprise');
        const picked = SURPRISES.find((s) => s.id === id) ?? pickScript(null);
        if (picked) begin(picked);
      },
      { once: true },
    );
  } else {
    schedule();
  }

  return {
    get active() {
      return active;
    },

    conditionsChanged() {
      schedule();
    },

    /** 對話進行中才會計算；角色語音播放時不算無聲，避免系統音訊把語音算進去 */
    observe(silent, dt) {
      if (!inDialogue) return;
      silentFor = silent && !voice ? silentFor + dt : 0;
      if (waiting && silentFor >= SILENCE_HOLD) {
        goNext();
      }
    },
  };
}
