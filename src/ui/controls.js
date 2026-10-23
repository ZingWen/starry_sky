import { captureDisplayAudio, captureMicrophone, playAudioFile } from '../audio/sources.js';

const IDLE_DELAY = 3000;

function describeError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
      return '已取消或拒絕授權。';
    case 'NotFoundError':
      return '找不到可用的音訊裝置。';
    case 'NotReadableError':
      return '音訊裝置正被其他程式使用中。';
    case 'NotSupportedError':
      return '這個瀏覽器不支援此音源。';
    default:
      return err?.message || '發生未知錯誤。';
  }
}

export function setupControls(analyser) {
  const body = document.body;
  const status = document.querySelector('#status');
  const fileInput = document.querySelector('#file-input');
  const buttons = [...document.querySelectorAll('[data-source]')];
  const stopBtn = document.querySelector('#stop-btn');
  const bars = ['#m-bass', '#m-mid', '#m-treble'].map((s) => document.querySelector(s));
  const beatDot = document.querySelector('#beat-dot');

  let current = null;
  let idleTimer = 0;

  function setStatus(text, isError = false) {
    status.textContent = text;
    status.classList.toggle('error', isError);
  }

  function setActive(kind) {
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.source === kind));
  }

  function stop(message) {
    if (current) {
      analyser.disconnect();
      current.stop();
      current = null;
    }
    setActive(null);
    if (message) setStatus(message);
    wake();
  }

  async function start(kind, file) {
    // 建立 AudioContext 與呼叫 getDisplayMedia 都必須發生在使用者點擊的同一個事件裡
    const ctx = analyser.ensureContext();
    stop();
    setStatus(kind === 'file' ? '載入音檔中…' : '等待授權…');

    try {
      let src;
      if (kind === 'tab' || kind === 'system') src = await captureDisplayAudio(ctx, kind);
      else if (kind === 'mic') src = await captureMicrophone(ctx);
      else src = await playAudioFile(ctx, file);

      current = src;
      analyser.connect(src.node);
      src.onEnded(() => {
        if (current === src) stop('音源已結束，請重新選擇。');
      });
      setActive(kind);
      setStatus(`正在聆聽：${src.label}`);
      wake();
    } catch (err) {
      setActive(null);
      setStatus(describeError(err), true);
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.source;
      if (kind === 'file') {
        analyser.ensureContext();
        fileInput.click();
      } else {
        start(kind);
      }
    });
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) start('file', file);
    fileInput.value = '';
  });

  stopBtn.addEventListener('click', () => stop('已停止。'));

  // 拖放音檔
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    body.classList.add('dragging');
    wake();
  });
  window.addEventListener('dragleave', () => body.classList.remove('dragging'));
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    body.classList.remove('dragging');
    const file = [...(e.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('audio/'));
    if (file) start('file', file);
    else setStatus('請拖入音訊檔案（mp3、wav、flac…）。', true);
  });

  // 有音源或全螢幕時，滑鼠靜止一段時間就隱藏介面（控制面板與左上角文案）
  function wake() {
    body.classList.remove('idle');
    clearTimeout(idleTimer);
    if (current || document.fullscreenElement) {
      idleTimer = setTimeout(() => body.classList.add('idle'), IDLE_DELAY);
    }
  }
  window.addEventListener('pointermove', wake);
  window.addEventListener('pointerdown', wake);

  // 一進入全螢幕就立刻隱藏介面，移動滑鼠會暫時顯示
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      clearTimeout(idleTimer);
      body.classList.add('idle');
    } else {
      wake();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target instanceof HTMLInputElement) return;
    const key = e.key.toLowerCase();
    if (key === 'h') {
      body.classList.toggle('ui-off');
    } else if (key === 'f') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    }
  });

  return {
    updateMeter(levels) {
      bars[0].style.transform = `scaleY(${0.05 + levels.bass * 0.95})`;
      bars[1].style.transform = `scaleY(${0.05 + levels.mid * 0.95})`;
      bars[2].style.transform = `scaleY(${0.05 + levels.treble * 0.95})`;
      beatDot.style.opacity = 0.1 + levels.beat * 0.9;
    },
  };
}
