import * as THREE from 'three';
import vertexShader from '../shaders/stars.vert?raw';
import fragmentShader from '../shaders/point.frag?raw';

// 依恆星光譜由藍白到橘黃
const STAR_COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f'];

export class Stars {
  constructor({ count = 30000, minRadius = 300, maxRadius = 1200, pixelRatio = 1 } = {}) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // 均勻分布在球殼上
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      positions[i * 3] = s * Math.cos(theta) * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = s * Math.sin(theta) * r;

      color.set(STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]);
      color.multiplyScalar(0.5 + Math.random() * 0.5);
      color.toArray(colors, i * 3);

      // 少數特別亮的大星
      sizes[i] = Math.random() < 0.02 ? 8 + Math.random() * 6 : 2 + Math.random() * Math.random() * 5;
      phases[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uTreble: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.Points(geometry, material);
  }

  update(time, dt, audio) {
    this.uniforms.uTime.value = time;
    this.uniforms.uTreble.value = audio.treble;
    this.object.rotation.y += dt * 0.002;
  }
}
