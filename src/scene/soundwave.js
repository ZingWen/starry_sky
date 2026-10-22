import * as THREE from 'three';
import burstVert from '../shaders/burst.vert?raw';
import pointFrag from '../shaders/point.frag?raw';
import haloFrag from '../shaders/halo.frag?raw';
import lineVert from '../shaders/waveline.vert?raw';
import lineFrag from '../shaders/waveline.frag?raw';

const dim = new THREE.Color('#6f86d6');
const white = new THREE.Color('#f4f6ff');
const tint = new THREE.Color();

/**
 * 音波星座：一列星星由左（低音）到右（高音）排開，高度跟著各頻段的音量起伏，
 * 用星座般的細線連起來；可選擇在下方加一列較淡、較矮的倒影（reflection）。
 * 掛在鏡頭底下，永遠固定在畫面上，左右滿版；baseline 決定高度（-1 = 畫面底部, 0 = 中間）。
 * 顏色跟著音樂流轉：越響的星越接近目前的主題色，最響時偏白；
 * 每顆星外圍還有一圈會緩緩呼吸的彩色光暈。
 */
export class SoundWave {
  constructor({ count = 15, distance = 100, baseline = -0.72, reflection = false, pixelRatio = 1 } = {}) {
    this.count = count;
    this.distance = distance;
    this.baseline = baseline;
    this.rows = reflection ? 2 : 1;
    this.levels = new Float32Array(count);

    // 每顆星都有一點隨機偏移，看起來像自然的星星，而不是整齊的格線
    // 兩端的星固定貼齊畫面左右邊緣，不做偏移
    this.jitterX = Float32Array.from({ length: count }, (_, i) =>
      i === 0 || i === count - 1 ? 0 : (Math.random() - 0.5) * 0.5,
    );
    this.jitterY = Float32Array.from({ length: count }, () => (Math.random() - 0.5) * 1.2);
    this.sizeBias = Float32Array.from({ length: count }, () => (Math.random() < 0.15 ? 0.5 : 0));

    const nodes = count * this.rows;
    const dyn = (arr, size) => new THREE.BufferAttribute(arr, size).setUsage(THREE.DynamicDrawUsage);

    // 星點：主列 0 ~ count-1，倒影（若有）count ~ 2count-1
    this.nodePositions = new Float32Array(nodes * 3);
    this.nodeColors = new Float32Array(nodes * 3);
    this.nodeSizes = new Float32Array(nodes);
    this.nodeAlpha = new Float32Array(nodes);

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', dyn(this.nodePositions, 3));
    pointGeometry.setAttribute('aColor', dyn(this.nodeColors, 3));
    pointGeometry.setAttribute('aSize', dyn(this.nodeSizes, 1));
    pointGeometry.setAttribute('aLife', dyn(this.nodeAlpha, 1));

    const points = new THREE.Points(
      pointGeometry,
      new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: pixelRatio } },
        vertexShader: burstVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    points.frustumCulled = false;

    // 光暈：只畫在上排的星，尺寸大、亮度低
    this.haloPositions = new Float32Array(count * 3);
    this.haloColors = new Float32Array(count * 3);
    this.haloSizes = new Float32Array(count);
    this.haloAlpha = new Float32Array(count);
    this.breathPhase = Float32Array.from({ length: count }, () => Math.random() * Math.PI * 2);

    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', dyn(this.haloPositions, 3));
    haloGeometry.setAttribute('aColor', dyn(this.haloColors, 3));
    haloGeometry.setAttribute('aSize', dyn(this.haloSizes, 1));
    haloGeometry.setAttribute('aLife', dyn(this.haloAlpha, 1));

    const halos = new THREE.Points(
      haloGeometry,
      new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: pixelRatio } },
        vertexShader: burstVert,
        fragmentShader: haloFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    halos.frustumCulled = false;

    // 連線：每排 count-1 段
    const segments = (count - 1) * this.rows;
    this.linePositions = new Float32Array(segments * 2 * 3);
    this.lineAlpha = new Float32Array(segments * 2);
    const lineT = new Float32Array(segments * 2);
    for (let s = 0; s < segments; s++) lineT[s * 2 + 1] = 1;

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', dyn(this.linePositions, 3));
    lineGeometry.setAttribute('aAlpha', dyn(this.lineAlpha, 1));
    lineGeometry.setAttribute('aT', new THREE.BufferAttribute(lineT, 1));

    const lines = new THREE.LineSegments(
      lineGeometry,
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color('#9db8ff') } },
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    lines.frustumCulled = false;

    this.pointGeometry = pointGeometry;
    this.lineMaterial = lines.material;
    this.lineGeometry = lineGeometry;
    this.color = new THREE.Color();
    this.object = new THREE.Group();
    this.haloGeometry = haloGeometry;
    this.object.add(halos, lines, points);
  }

  update(time, dt, spectrum, camera, hue) {
    const n = this.count;
    const halfH = this.distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = halfH * camera.aspect;
    const width = halfW * 2; // 左右滿版
    const left = -halfW;
    const baseY = halfH * this.baseline;
    const amp = halfH * 0.55;
    const z = -this.distance;

    for (let i = 0; i < n; i++) {
      // 上升快、下降慢，起伏比較柔順
      const target = spectrum[i] ?? 0;
      const rate = target > this.levels[i] ? 14 : 3.5;
      this.levels[i] += (target - this.levels[i]) * (1 - Math.exp(-dt * rate));
      const v = this.levels[i];

      const x = left + ((i + this.jitterX[i]) / (n - 1)) * width;
      // 沒有聲音時也會緩緩起伏，像一條靜靜流動的星河
      const idle = Math.sin(time * 0.6 + i * 0.35) * 0.6 + this.jitterY[i];
      const lift = v * amp + 0.8;
      const yTop = baseY + idle + lift;

      this.nodePositions.set([x, yTop, z], i * 3);

      // 由左到右帶一點色相漸層，整體色調跟著音樂流轉
      tint.setHSL((hue + (i / n) * 0.25) % 1, 0.65, 0.68);
      this.color.copy(dim).lerp(tint, Math.min(1, v * 1.4)).lerp(white, Math.max(0, v - 0.75) * 2);
      const glow = 0.5 + v * 0.8;
      this.color.toArray(this.nodeColors, i * 3);
      this.nodeSizes[i] = 2.2 + v * 1.8 + this.sizeBias[i] * 1.5;
      this.nodeAlpha[i] = glow;

      if (this.rows === 2) {
        const yBottom = baseY + idle * 0.5 - lift * 0.45;
        this.nodePositions.set([x, yBottom, z], (n + i) * 3);
        this.color.toArray(this.nodeColors, (n + i) * 3);
        this.nodeSizes[n + i] = 1.6 + v * 1.0;
        this.nodeAlpha[n + i] = glow * 0.45;
      }

      // 呼吸光暈：每顆星以自己的節奏緩緩明暗，越響光暈越大越亮
      const breath = 0.55 + 0.45 * Math.sin(time * 1.1 + this.breathPhase[i]);
      this.haloPositions.set([x, yTop, z], i * 3);
      tint.toArray(this.haloColors, i * 3);
      this.haloSizes[i] = 9 + v * 10 + breath * 3;
      this.haloAlpha[i] = (0.1 + v * 0.3) * breath;
    }

    // 把相鄰的星星連起來，越響的區段線越亮
    const P = this.linePositions;
    const A = this.lineAlpha;
    let s = 0;
    for (let row = 0; row < this.rows; row++) {
      const offset = row * n;
      const rowAlpha = row === 0 ? 1 : 0.45;
      for (let i = 0; i < n - 1; i++, s++) {
        const a = (offset + i) * 3;
        const b = (offset + i + 1) * 3;
        P.set(this.nodePositions.subarray(a, a + 3), s * 6);
        P.set(this.nodePositions.subarray(b, b + 3), s * 6 + 3);
        const energy = (this.levels[i] + this.levels[i + 1]) / 2;
        A[s * 2] = A[s * 2 + 1] = (0.07 + energy * 0.35) * rowAlpha;
      }
    }

    for (const name of ['position', 'aColor', 'aSize', 'aLife']) {
      this.pointGeometry.attributes[name].needsUpdate = true;
      this.haloGeometry.attributes[name].needsUpdate = true;
    }
    this.lineGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.attributes.aAlpha.needsUpdate = true;
    this.lineMaterial.uniforms.uColor.value.setHSL((hue + 0.1) % 1, 0.45, 0.72);
  }
}
