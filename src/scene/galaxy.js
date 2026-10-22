import * as THREE from 'three';
import vertexShader from '../shaders/galaxy.vert?raw';
import fragmentShader from '../shaders/point.frag?raw';

export class Galaxy {
  constructor({
    count = 50000,
    coreCount = 4000,
    radius = 60,
    branches = 4,
    spin = 0.045,
    pixelRatio = 1,
  } = {}) {
    const total = count + coreCount;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const radii = new Float32Array(total);

    const inside = new THREE.Color('#ffcf8a');
    const outside = new THREE.Color('#5b6cff');
    const color = new THREE.Color();

    // 旋臂
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.8) * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const angle = branchAngle + r * spin;

      // 越靠近旋臂中線越密集
      const scatter = (axisScale) =>
        Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (4 + r * 0.25) * axisScale;

      positions[i * 3] = Math.cos(angle) * r + scatter(1);
      positions[i * 3 + 1] = scatter(0.3);
      positions[i * 3 + 2] = Math.sin(angle) * r + scatter(1);

      const t = r / radius;
      color.copy(inside).lerp(outside, t);
      if (Math.random() < 0.08) color.set('#ff8ad8'); // 零星的粉紅色恆星形成區
      color.multiplyScalar(0.6 + Math.random() * 0.4);
      color.toArray(colors, i * 3);

      sizes[i] = 0.5 + Math.random() * 1.5;
      radii[i] = t;
    }

    // 中心核球
    for (let i = count; i < total; i++) {
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
      const x = g() * 4;
      const y = g() * 2;
      const z = g() * 4;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      color.set('#ffe2b0').multiplyScalar(0.1 + Math.random() * 0.06);
      color.toArray(colors, i * 3);

      sizes[i] = 0.6 + Math.random() * 1.2;
      radii[i] = Math.min(1, Math.hypot(x, z) / radius);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uBeat: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uTint: { value: new THREE.Color() },
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

  update(time, dt, audio, hue) {
    const u = this.uniforms;
    u.uTime.value = time;
    u.uBass.value = audio.bass;
    u.uMid.value = audio.mid;
    u.uBeat.value = audio.beat;
    u.uTint.value.setHSL(hue, 0.6, 0.55);
    // 中音越強轉得越快
    this.object.rotation.y += dt * (0.015 + audio.mid * 0.05);
  }
}
