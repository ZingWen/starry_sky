import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { AudioAnalyser } from './audio/analyser.js';
import { Stars } from './scene/stars.js';
import { Nebula } from './scene/nebula.js';
import { Galaxy } from './scene/galaxy.js';
import { Constellations } from './scene/constellations.js';
import { Meteors, Burst } from './scene/meteors.js';
import { SoundWave } from './scene/soundwave.js';
import { Aurora } from './scene/aurora.js';
import { setupControls } from './ui/controls.js';
import './style.css';

// ---------- 渲染器與場景 ----------
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const pixelRatio = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 暫時關閉星雲，改成純藍黑色的天空；設為 true 可以恢復
const SHOW_NEBULA = true;
// 暫時關閉中央的旋臂星系（連同節拍時從星系中心噴出的粒子）；設為 true 可以恢復
const SHOW_GALAXY = false;
// 背景的真實星座（獵戶座、北斗七星…）；設為 true 可以恢復
const SHOW_CONSTELLATIONS = true;
// 畫面下方用星星連成的音波（目前改用極光）；設為 true 可以恢復
const SHOW_SOUNDWAVE = false;
// 畫面下方的極光音波
const SHOW_AURORA = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color().setRGB(0.0015, 0.0025, 0.009); // 藍黑色（linear）
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);

const nebula = new Nebula();
const stars = new Stars({ pixelRatio });
const galaxy = new Galaxy({ pixelRatio });
const constellations = new Constellations({ pixelRatio });
if (SHOW_CONSTELLATIONS) stars.object.add(constellations.object); // 跟著星空一起緩慢旋轉
const meteors = new Meteors({ pixelRatio });
const burst = new Burst({ pixelRatio });
scene.add(stars.object, meteors.object);
if (SHOW_NEBULA) scene.add(nebula.object);
if (SHOW_GALAXY) scene.add(galaxy.object, burst.object);

// 音波星座掛在鏡頭底下，永遠固定在畫面上
const WAVE_BANDS = 15;
const soundWave = new SoundWave({ count: WAVE_BANDS, pixelRatio });
const spectrum = new Float32Array(WAVE_BANDS);
scene.add(camera);
if (SHOW_SOUNDWAVE) camera.add(soundWave.object);

const AURORA_BANDS = 32;
const aurora = new Aurora({ bands: AURORA_BANDS });
const auroraSpectrum = new Float32Array(AURORA_BANDS);
if (SHOW_AURORA) camera.add(aurora.object);

// ---------- 後製光暈 ----------
const composer = new EffectComposer(renderer);
// 多重取樣抗鋸齒，讓星座線與流星的邊緣更平滑
composer.renderTarget1.samples = 4;
composer.renderTarget2.samples = 4;
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.15, 0.7);
composer.addPass(bloom);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// ---------- 音訊 ----------
const analyser = new AudioAnalyser();
const controls = setupControls(analyser);

// 網址加上 ?demo 可以用模擬的音樂數值預覽效果
const demo = new URLSearchParams(location.search).has('demo');
let demoNextBeat = 0;
function simulateLevels(levels, t) {
  levels.beatTriggered = false;
  if (t >= demoNextBeat) {
    levels.beat = 1;
    levels.beatTriggered = true;
    demoNextBeat = t + 0.5;
  } else {
    levels.beat *= 0.9;
  }
  levels.bass = 0.3 + levels.beat * 0.6;
  levels.mid = 0.5 + 0.4 * Math.sin(t * 0.7);
  levels.treble = 0.4 + 0.4 * Math.sin(t * 2.3);
  levels.volume = (levels.bass + levels.mid + levels.treble) / 3;
  return levels;
}

function simulateSpectrum(out, t, levels) {
  for (let i = 0; i < out.length; i++) {
    const x = i / out.length;
    const wave = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.45) * Math.sin(t * 0.7 + i * 0.13);
    const kick = levels.beat * Math.max(0, 1 - x * 4); // 節拍時低頻跳起來
    out[i] = Math.min(1, wave * (0.6 - x * 0.3) + kick * 0.7);
  }
  return out;
}

// ---------- 動畫主迴圈 ----------
const clock = new THREE.Clock();
let orbit = 0;
const CAM_DIST = 140;
let hue = 0.7;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  const a = demo && !analyser.active ? simulateLevels(analyser.levels, t) : analyser.update(dt);

  // 色調慢慢流轉，中音越強變化越快
  hue = (hue + dt * (0.005 + a.mid * 0.05) + (a.beatTriggered ? 0.02 : 0)) % 1;

  // 鏡頭緩慢繞著星系公轉，低音把鏡頭往前推
  orbit += dt * 0.012;
  camera.position.set(Math.cos(orbit) * CAM_DIST, 35 + Math.sin(t * 0.03) * 25, Math.sin(orbit) * CAM_DIST);
  camera.lookAt(0, 0, 0);

  if (SHOW_NEBULA) nebula.update(t, dt, a, hue, camera);
  stars.update(t, dt, a);
  if (SHOW_CONSTELLATIONS) constellations.update(t, dt, a);
  meteors.update(t, dt, a, camera);
  if (SHOW_SOUNDWAVE) {
    const spec = demo && !analyser.active
      ? simulateSpectrum(spectrum, t, a)
      : analyser.getSpectrum(WAVE_BANDS, spectrum);
    soundWave.update(t, dt, spec, camera, hue);
  }
  if (SHOW_AURORA) {
    const spec = demo && !analyser.active
      ? simulateSpectrum(auroraSpectrum, t, a)
      : analyser.getSpectrum(AURORA_BANDS, auroraSpectrum);
    aurora.update(t, dt, spec, a, camera, hue);
  }
  if (SHOW_GALAXY) {
    galaxy.update(t, dt, a, hue);
    if (a.beatTriggered) burst.emit(Math.round(150 + a.bass * 250), a.bass, hue);
    burst.update(dt);
  }

  bloom.strength = 0.3 + a.bass * 0.15 + a.beat * 0.25;

  composer.render();
  controls.update(a, dt);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
