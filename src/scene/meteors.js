import * as THREE from 'three';
import burstVert from '../shaders/burst.vert?raw';
import pointFrag from '../shaders/point.frag?raw';
import meteorVert from '../shaders/meteor.vert?raw';
import meteorFrag from '../shaders/meteor.frag?raw';

const tmp = new THREE.Vector3();
const camUp = new THREE.Vector3();
const camRight = new THREE.Vector3();
const side = new THREE.Vector3();
const tail = new THREE.Vector3();
const toCam = new THREE.Vector3();

function randomUnitVector(target) {
  const u = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return target.set(s * Math.cos(theta), u, s * Math.sin(theta));
}

// 整場流星雨共同的傾斜方向（往右下落），每顆流星再帶一點隨機偏差
const SLANT = 0.22;

/**
 * 流星雨：流星從畫面正上方整條線的隨機位置出現，朝同一個方向往下劃過。
 * 音量與高音決定流星的密度，節拍時會多落下一兩顆，低音越強流星越亮越長。
 */
export class Meteors {
  constructor({ max = 80, pixelRatio = 1 } = {}) {
    this.max = max;
    this.pool = Array.from({ length: max }, () => ({
      alive: false,
      pos: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      speed: 0,
      length: 0,
      width: 0,
      traveled: 0,
      life: 0,
      maxLife: 1,
      brightness: 1,
      color: new THREE.Color(),
    }));
    this.accumulator = 0;

    // 每顆流星是一條面向鏡頭的光帶：頭粗尾細
    this.positions = new Float32Array(max * 4 * 3);
    this.colors = new Float32Array(max * 4 * 3);
    const uvs = new Float32Array(max * 4 * 2);
    const index = [];
    for (let i = 0; i < max; i++) {
      uvs.set([1, -1, 1, 1, 0, -1, 0, 1], i * 8);
      const b = i * 4;
      index.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }

    const dyn = (arr, size) => new THREE.BufferAttribute(arr, size).setUsage(THREE.DynamicDrawUsage);

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', dyn(this.positions, 3));
    trailGeometry.setAttribute('aColor', dyn(this.colors, 3));
    trailGeometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    trailGeometry.setIndex(index);

    const trails = new THREE.Mesh(
      trailGeometry,
      new THREE.ShaderMaterial({
        vertexShader: meteorVert,
        fragmentShader: meteorFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    trails.frustumCulled = false;

    // 流星頭部的亮點
    this.headPositions = new Float32Array(max * 3);
    this.headColors = new Float32Array(max * 3);
    this.headSizes = new Float32Array(max);
    this.headLife = new Float32Array(max);

    const headGeometry = new THREE.BufferGeometry();
    headGeometry.setAttribute('position', dyn(this.headPositions, 3));
    headGeometry.setAttribute('aColor', dyn(this.headColors, 3));
    headGeometry.setAttribute('aSize', dyn(this.headSizes, 1));
    headGeometry.setAttribute('aLife', dyn(this.headLife, 1));

    const heads = new THREE.Points(
      headGeometry,
      new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: pixelRatio } },
        vertexShader: burstVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    heads.frustumCulled = false;

    this.trailGeometry = trailGeometry;
    this.headGeometry = headGeometry;
    this.object = new THREE.Group();
    this.object.add(trails, heads);
  }

  spawn(camera, audio) {
    const m = this.pool.find((p) => !p.alive);
    if (!m) return;

    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);

    // 在畫面上緣外面一點、整條橫線上隨機挑一個起點；因為往右下落，起點範圍稍微偏左
    const ndcX = -1.25 + Math.random() * 2.3;
    const ndcY = 1.02 + Math.random() * 0.15;
    tmp.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();

    const dist = 350 + Math.random() * 350;
    m.pos.copy(camera.position).addScaledVector(tmp, dist);
    m.dir
      .copy(camUp)
      .negate()
      .addScaledVector(camRight, SLANT + (Math.random() - 0.5) * 0.1)
      .normalize();
    m.traveled = 0;

    const energy = 0.5 + audio.bass * 0.8 + audio.beat * 0.4;
    m.speed = (110 + Math.random() * 100) * (1 + audio.mid * 0.3);
    m.length = (120 + Math.random() * 120) * (0.7 + energy * 0.5);
    m.width = (0.35 + Math.random() * 0.35) * (dist / 500);
    m.maxLife = m.life = 1.8 + Math.random() * 1.2;
    m.brightness = 0.35 + energy * 0.35;

    // 大多是藍白色，偶爾出現金色的流星；高音越多越偏冷色
    const hue = Math.random() < 0.12 ? 0.1 : 0.58 + (audio.treble - 0.5) * 0.08 + Math.random() * 0.06;
    m.color.setHSL(hue, 0.5, 0.75);
    m.alive = true;
  }

  update(time, dt, audio, camera) {
    this.accumulator += dt * (0.1 + audio.volume * 0.6 + audio.treble * 0.4);
    while (this.accumulator >= 1) {
      this.spawn(camera, audio);
      this.accumulator -= 1;
    }
    if (audio.beatTriggered) {
      // 只有部分節拍會帶出一顆流星，重拍的機率比較高
      if (Math.random() < (audio.bass > 0.7 ? 0.6 : 0.3)) this.spawn(camera, audio);
    }

    const P = this.positions;
    const C = this.colors;
    this.pool.forEach((m, i) => {
      const o = i * 12;
      if (m.alive) {
        m.life -= dt;
        if (m.life <= 0) m.alive = false;
      }
      if (!m.alive) {
        C.fill(0, o, o + 12);
        this.headLife[i] = 0;
        return;
      }

      m.pos.addScaledVector(m.dir, m.speed * dt);
      m.traveled += m.speed * dt;
      // 剛出現時又細又短，邊劃過邊把尾巴拉長
      const grow = Math.min(1, m.traveled / m.length);

      // 快速亮起，後半段才慢慢淡出
      const t = m.life / m.maxLife;
      const fade = Math.min(1, (1 - t) * 8) * Math.min(1, t * 1.8);

      tail.copy(m.pos).addScaledVector(m.dir, -m.length * grow);
      toCam.subVectors(camera.position, m.pos);
      side.crossVectors(m.dir, toCam).normalize();

      const w = m.width * (0.4 + 0.6 * grow);
      const wt = w * 0.15;
      P[o] = m.pos.x - side.x * w;
      P[o + 1] = m.pos.y - side.y * w;
      P[o + 2] = m.pos.z - side.z * w;
      P[o + 3] = m.pos.x + side.x * w;
      P[o + 4] = m.pos.y + side.y * w;
      P[o + 5] = m.pos.z + side.z * w;
      P[o + 6] = tail.x - side.x * wt;
      P[o + 7] = tail.y - side.y * wt;
      P[o + 8] = tail.z - side.z * wt;
      P[o + 9] = tail.x + side.x * wt;
      P[o + 10] = tail.y + side.y * wt;
      P[o + 11] = tail.z + side.z * wt;

      const k = m.brightness * fade;
      for (let v = 0; v < 4; v++) {
        C[o + v * 3] = m.color.r * k;
        C[o + v * 3 + 1] = m.color.g * k;
        C[o + v * 3 + 2] = m.color.b * k;
      }

      m.pos.toArray(this.headPositions, i * 3);
      m.color.toArray(this.headColors, i * 3);
      this.headSizes[i] = (1.2 + 1.3 * grow) * m.brightness;
      this.headLife[i] = fade;
    });

    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.aColor.needsUpdate = true;
    for (const name of ['position', 'aColor', 'aSize', 'aLife']) {
      this.headGeometry.attributes[name].needsUpdate = true;
    }
  }
}

/** 節拍時從星系中心噴出的粒子 */
export class Burst {
  constructor({ max = 5000, pixelRatio = 1 } = {}) {
    this.max = max;
    this.cursor = 0;
    this.positions = new Float32Array(max * 3);
    this.velocities = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.sizes = new Float32Array(max);
    this.life = new Float32Array(max);
    this.decay = new Float32Array(max);

    const geometry = new THREE.BufferGeometry();
    const dyn = (arr, size) => new THREE.BufferAttribute(arr, size).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', dyn(this.positions, 3));
    geometry.setAttribute('aColor', dyn(this.colors, 3));
    geometry.setAttribute('aSize', dyn(this.sizes, 1));
    geometry.setAttribute('aLife', dyn(this.life, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: pixelRatio } },
      vertexShader: burstVert,
      fragmentShader: pointFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.Points(geometry, material);
    this.object.frustumCulled = false;
    this.color = new THREE.Color();
  }

  emit(count, strength, hue) {
    for (let k = 0; k < count; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;

      randomUnitVector(tmp);
      tmp.y *= 0.35; // 沿著星系盤面擴散，像一圈衝擊波
      const speed = (15 + Math.random() * 45) * (0.6 + strength);

      this.positions.set([tmp.x * 3, tmp.y * 3, tmp.z * 3], i * 3);
      this.velocities.set([tmp.x * speed, tmp.y * speed, tmp.z * speed], i * 3);

      this.color.setHSL(hue + (Math.random() - 0.5) * 0.15, 0.7, 0.45 + Math.random() * 0.2);
      this.color.toArray(this.colors, i * 3);

      this.sizes[i] = 1.5 + Math.random() * 2.5;
      this.life[i] = 1;
      this.decay[i] = 0.4 + Math.random() * 0.6;
    }
    this.object.geometry.attributes.aColor.needsUpdate = true;
    this.object.geometry.attributes.aSize.needsUpdate = true;
  }

  update(dt) {
    const drag = Math.exp(-dt * 1.2);
    const P = this.positions;
    const V = this.velocities;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      const o = i * 3;
      P[o] += V[o] * dt;
      P[o + 1] += V[o + 1] * dt;
      P[o + 2] += V[o + 2] * dt;
      V[o] *= drag;
      V[o + 1] *= drag;
      V[o + 2] *= drag;
      this.life[i] = Math.max(0, this.life[i] - dt * this.decay[i]);
    }
    this.object.geometry.attributes.position.needsUpdate = true;
    this.object.geometry.attributes.aLife.needsUpdate = true;
  }
}
