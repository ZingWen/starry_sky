// 音源擷取：每個函式都回傳 { node, label, stop(), onEnded(cb) }

const RAW_AUDIO = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

function fromStream(ctx, stream, label) {
  const node = ctx.createMediaStreamSource(stream);
  return {
    node,
    label,
    stop() {
      stream.getTracks().forEach((t) => t.stop());
      node.disconnect();
    },
    onEnded(cb) {
      // 使用者按下瀏覽器的「停止共用」時，任何一條軌道結束都算音源結束
      stream.getTracks().forEach((t) => t.addEventListener('ended', cb, { once: true }));
    },
  };
}

/**
 * 透過螢幕分享取得音訊。
 * kind = 'tab'：分享瀏覽器分頁的聲音
 * kind = 'system'：分享整個螢幕的系統聲音（Windows 上的 Chrome / Edge）
 */
export async function captureDisplayAudio(ctx, kind) {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('這個瀏覽器不支援分享畫面音訊，請改用 Chrome 或 Edge。');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    // Chrome 要求一定要有 video，畫面本身不會被使用
    video: { displaySurface: kind === 'tab' ? 'browser' : 'monitor' },
    audio: RAW_AUDIO,
    systemAudio: 'include',
    selfBrowserSurface: 'exclude',
    surfaceSwitching: 'include',
  });

  if (stream.getAudioTracks().length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error(
      kind === 'tab'
        ? '沒有取得音訊：請在分享視窗中選擇分頁，並勾選「同時分享分頁音訊」。'
        : '沒有取得音訊：請在分享視窗中選擇整個螢幕，並勾選「同時分享系統音訊」。',
    );
  }

  return fromStream(ctx, stream, kind === 'tab' ? '分頁音訊' : '系統音訊');
}

export async function captureMicrophone(ctx) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('這個瀏覽器不支援麥克風擷取。');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO });
  return fromStream(ctx, stream, '麥克風');
}

export async function playAudioFile(ctx, file) {
  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  audio.loop = true;

  // MediaElementSource 每個 <audio> 只能建立一次，所以每次都用新的元素
  const node = ctx.createMediaElementSource(audio);
  node.connect(ctx.destination);

  try {
    await audio.play();
  } catch (err) {
    node.disconnect();
    URL.revokeObjectURL(url);
    throw err;
  }

  return {
    node,
    label: file.name,
    stop() {
      audio.pause();
      node.disconnect();
      URL.revokeObjectURL(url);
    },
    onEnded(cb) {
      audio.addEventListener('ended', cb, { once: true });
    },
  };
}
