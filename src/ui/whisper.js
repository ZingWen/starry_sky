import { WHISPERS } from '../whispers.js';

const STEP = 10000; // 每句話停留的時間
const GAP = 2500; // 組別之間淡出後的空檔
const PAIRS_PER_CENTER = 3; // 每幾組問答之後安排一組中間的獨白

export function setupWhisper() {
  const left = document.querySelector('#whisper-left');
  const right = document.querySelector('#whisper-right');
  const center = document.querySelector('#whisper-center');

  const pairs = WHISPERS.filter((g) => !g.center);
  const singles = WHISPERS.filter((g) => g.center);
  const main = WHISPERS.find((g) => g.main && !g.center);

  let timers = [];
  let lastPair = null;
  let lastSingle = null;
  let pairsSinceCenter = 0;
  let running = false;

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function show(el, text) {
    el.textContent = text;
    el.classList.add('show');
  }

  function hideAll() {
    [left, right, center].forEach((el) => el.classList.remove('show'));
  }

  // 從清單隨機挑一組，但不會跟同類型的上一組相同
  function randomFrom(list, prev) {
    if (list.length < 2) return list[0];
    let g;
    do g = list[Math.floor(Math.random() * list.length)];
    while (g === prev);
    return g;
  }

  // 每 PAIRS_PER_CENTER 組問答之後輪到一組獨白
  function pick() {
    const wantCenter = singles.length && (pairsSinceCenter >= PAIRS_PER_CENTER || !pairs.length);
    if (wantCenter) {
      pairsSinceCenter = 0;
      return (lastSingle = randomFrom(singles, lastSingle));
    }
    pairsSinceCenter++;
    return (lastPair = randomFrom(pairs, lastPair));
  }

  function next(first) {
    timers = [];
    if (!WHISPERS.length) return;
    let group;
    if (first && main) {
      // 每次開始都先播主軸那一組
      pairsSinceCenter = 1;
      group = lastPair = main;
    } else {
      group = pick();
    }
    let duration = STEP;

    if (group.center) {
      show(center, group.center);
    } else {
      show(left, group.left);
      later(() => show(right, group.right), STEP);
      duration = STEP * 2;
    }

    later(() => {
      hideAll();
      later(next, GAP);
    }, duration);
  }

  return {
    start() {
      if (running) return;
      running = true;
      this.caption(false);
      next(true);
    },
    // Quiet 模式：左上固定顯示主軸那句（沒有回答）
    caption(on) {
      if (on && main) {
        left.textContent = main.left;
        left.classList.add('show', 'caption');
      } else if (left.classList.contains('caption')) {
        left.classList.remove('show', 'caption');
      }
    },
    stop() {
      running = false;
      timers.forEach(clearTimeout);
      timers = [];
      hideAll();
    },
  };
}
