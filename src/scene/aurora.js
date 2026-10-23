import * as THREE from 'three';
import noise from '../shaders/noise.glsl?raw';
import fragShader from '../shaders/aurora.frag?raw';

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * 極光音波：掛在鏡頭底下、貼齊畫面底部的一片極光簾幕。
 * 由左（低音）到右（高音），各頻段越響，那一段的簾幕就升得越高、越亮。
 */
export class Aurora {
  constructor({ bands = 32, distance = 100, coverage = 0.506 } = {}) {
    this.bands = bands;
    this.distance = distance;
    this.coverage = coverage; // 佔畫面高度的比例
    this.levels = new Float32Array(bands);
    this.smoothed = new Float32Array(bands);

    this.uniforms = {
      uTime: { value: 0 },
      uSpec: { value: this.smoothed },
      uHue: { value: 0 },
      uVolume: { value: 0 },
      uBeat: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader: `#define BANDS ${bands}\n${noise}\n${fragShader}`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.object.frustumCulled = false;
  }

  update(time, dt, spectrum, audio, camera, hue) {
    const n = this.bands;

    // 極光比星星音波更慢、更柔：上升與下降都放緩
    for (let i = 0; i < n; i++) {
      const target = spectrum[i] ?? 0;
      const rate = target > this.levels[i] ? 6 : 1.8;
      this.levels[i] += (target - this.levels[i]) * (1 - Math.exp(-dt * rate));
    }
    // 跟左右鄰居做平均，簾幕的高低變化才不會一格一格的
    for (let i = 0; i < n; i++) {
      const l = this.levels[Math.max(0, i - 1)];
      const r = this.levels[Math.min(n - 1, i + 1)];
      this.smoothed[i] = (l + this.levels[i] * 2 + r) / 4;
    }

    const u = this.uniforms;
    u.uTime.value = time;
    u.uHue.value = hue;
    u.uVolume.value = audio.volume;
    u.uBeat.value = audio.beat;

    // 鋪滿畫面寬度，底部貼齊畫面下緣
    const halfH = this.distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = halfH * camera.aspect;
    const h = halfH * 2 * this.coverage;
    this.object.scale.set(halfW * 2, h, 1);
    this.object.position.set(0, -halfH + h / 2, -this.distance);
  }
}
