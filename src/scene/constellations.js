import * as THREE from 'three';
import vertexShader from '../shaders/stars.vert?raw';
import fragmentShader from '../shaders/point.frag?raw';
import lineVert from '../shaders/constellation.vert?raw';
import lineFrag from '../shaders/constellation.frag?raw';

// 真實星座資料：[名稱, 赤經(小時), 赤緯(度), 視星等]，lines 是要連線的星星索引
const CONSTELLATIONS = [
  {
    name: '獵戶座',
    stars: [
      ['Betelgeuse', 5.92, 7.4, 0.5],
      ['Bellatrix', 5.42, 6.35, 1.6],
      ['Mintaka', 5.53, -0.3, 2.2],
      ['Alnilam', 5.6, -1.2, 1.7],
      ['Alnitak', 5.68, -1.94, 1.8],
      ['Saiph', 5.8, -9.67, 2.1],
      ['Rigel', 5.24, -8.2, 0.1],
      ['Meissa', 5.59, 9.93, 3.4],
    ],
    lines: [[0, 7], [7, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]],
  },
  {
    name: '北斗七星',
    stars: [
      ['Dubhe', 11.06, 61.75, 1.8],
      ['Merak', 11.03, 56.38, 2.4],
      ['Phecda', 11.9, 53.69, 2.4],
      ['Megrez', 12.26, 57.03, 3.3],
      ['Alioth', 12.9, 55.96, 1.8],
      ['Mizar', 13.4, 54.93, 2.2],
      ['Alkaid', 13.79, 49.31, 1.9],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    name: '仙后座',
    stars: [
      ['Caph', 0.15, 59.15, 2.3],
      ['Schedar', 0.68, 56.54, 2.2],
      ['Gamma Cas', 0.95, 60.72, 2.4],
      ['Ruchbah', 1.43, 60.24, 2.7],
      ['Segin', 1.91, 63.67, 3.4],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: '天蠍座',
    stars: [
      ['Acrab', 16.09, -19.8, 2.6],
      ['Dschubba', 16.01, -22.62, 2.3],
      ['Pi Sco', 15.98, -26.11, 2.9],
      ['Antares', 16.49, -26.43, 1.0],
      ['Tau Sco', 16.6, -28.22, 2.8],
      ['Epsilon Sco', 16.84, -34.29, 2.3],
      ['Mu Sco', 16.86, -38.05, 3.0],
      ['Zeta Sco', 16.9, -42.36, 3.6],
      ['Eta Sco', 17.2, -43.24, 3.3],
      ['Sargas', 17.62, -43.0, 1.9],
      ['Iota Sco', 17.79, -40.13, 3.0],
      ['Kappa Sco', 17.71, -39.03, 2.4],
      ['Shaula', 17.56, -37.1, 1.6],
    ],
    lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12]],
  },
  {
    name: '天鵝座',
    stars: [
      ['Deneb', 20.69, 45.28, 1.3],
      ['Sadr', 20.37, 40.26, 2.2],
      ['Albireo', 19.51, 27.96, 3.1],
      ['Gienah', 20.77, 33.97, 2.5],
      ['Delta Cyg', 19.75, 45.13, 2.9],
    ],
    lines: [[0, 1], [1, 2], [1, 3], [1, 4]],
  },
  {
    name: '獅子座',
    stars: [
      ['Regulus', 10.14, 11.97, 1.4],
      ['Eta Leo', 10.12, 16.76, 3.5],
      ['Algieba', 10.33, 19.84, 2.0],
      ['Adhafera', 10.28, 23.42, 3.4],
      ['Rasalas', 9.88, 26.0, 3.9],
      ['Epsilon Leo', 9.76, 23.77, 3.0],
      ['Zosma', 11.24, 20.52, 2.6],
      ['Denebola', 11.82, 14.57, 2.1],
      ['Chertan', 11.24, 15.43, 3.3],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [8, 0], [8, 6]],
  },
  {
    name: '天琴座',
    stars: [
      ['Vega', 18.62, 38.78, 0.0],
      ['Epsilon Lyr', 18.74, 39.67, 4.7],
      ['Zeta Lyr', 18.75, 37.6, 4.3],
      ['Delta Lyr', 18.91, 36.9, 4.3],
      ['Sulafat', 18.98, 32.69, 3.3],
      ['Sheliak', 18.83, 33.36, 3.5],
    ],
    lines: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 2]],
  },
  {
    name: '南十字座',
    stars: [
      ['Acrux', 12.44, -63.1, 0.8],
      ['Mimosa', 12.8, -59.69, 1.3],
      ['Gacrux', 12.52, -57.11, 1.6],
      ['Delta Cru', 12.25, -58.75, 2.8],
    ],
    lines: [[0, 2], [1, 3]],
  },
];

const DEG = Math.PI / 180;

/**
 * 每個星座保留真實的形狀與大小，但重新擺放在鏡頭繞行時看得到的方位，
 * 讓它們平均分布在星系周圍的天空。
 */
export class Constellations {
  constructor({ radius = 900, pixelRatio = 1 } = {}) {
    this.object = new THREE.Group();
    this.groups = [];
    this.next = 0;

    const pointPositions = [];
    const pointColors = [];
    const pointSizes = [];
    const pointPhases = [];
    const starColor = new THREE.Color('#dfe8ff').multiplyScalar(0.6);

    CONSTELLATIONS.forEach((c, ci) => {
      const azimuth = (ci / CONSTELLATIONS.length) * Math.PI * 2;
      const elevation = (ci % 2 === 0 ? -8 : -22) * DEG;

      const ra0 = c.stars.reduce((s, st) => s + st[1], 0) / c.stars.length;
      const dec0 = c.stars.reduce((s, st) => s + st[2], 0) / c.stars.length;

      const dirs = c.stars.map(([, ra, dec, mag]) => {
        // 以星座中心為原點的角度偏移；赤經往東增加，在天空上是往左
        const dx = -(ra - ra0) * 15 * Math.cos(dec0 * DEG) * DEG;
        const dy = (dec - dec0) * DEG;
        const az = azimuth + dx;
        const el = elevation + dy;
        const p = new THREE.Vector3(
          Math.cos(el) * Math.cos(az),
          Math.sin(el),
          Math.cos(el) * Math.sin(az),
        ).multiplyScalar(radius);

        pointPositions.push(p.x, p.y, p.z);
        starColor.toArray(pointColors, pointColors.length);
        pointSizes.push(Math.max(8, 30 - mag * 5));
        pointPhases.push(Math.random());
        return p;
      });

      const linePositions = [];
      const lineT = [];
      c.lines.forEach(([a, b]) => {
        linePositions.push(dirs[a].x, dirs[a].y, dirs[a].z, dirs[b].x, dirs[b].y, dirs[b].z);
        lineT.push(0, 1);
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      geometry.setAttribute('aT', new THREE.Float32BufferAttribute(lineT, 1));
      const uniforms = {
        uColor: { value: new THREE.Color('#9db8ff') },
        uOpacity: { value: 0.1 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const lines = new THREE.LineSegments(geometry, material);
      this.object.add(lines);
      this.groups.push({ name: c.name, uniforms, glow: 0 });
    });

    this.uniforms = {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uTreble: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    };

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(pointColors, 3));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(pointSizes, 1));
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(pointPhases, 1));

    const points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.object.add(points);
  }

  update(time, dt, audio) {
    this.uniforms.uTime.value = time;
    // 星座的星星跟著音量與節拍淡淡地變亮
    this.uniforms.uPulse.value = audio.volume * 0.15 + audio.beat * 0.08;
    this.uniforms.uTreble.value = audio.treble * 0.3;

    // 每一拍輪流點亮一個星座
    if (audio.beatTriggered) {
      this.groups[this.next].glow = 1;
      this.next = (this.next + 1) % this.groups.length;
    }

    // 連線只做很淡的閃爍：每個星座有自己的微弱起伏，節拍時輪到的星座稍微亮一點再慢慢退回
    const decay = Math.exp(-dt * 1.0);
    this.groups.forEach((g, i) => {
      g.glow *= decay;
      const shimmer = (0.5 + 0.5 * Math.sin(time * 1.3 + i * 1.7)) * audio.volume * 0.02;
      g.uniforms.uOpacity.value = 0.055 + shimmer + g.glow * 0.05;
    });
  }
}
