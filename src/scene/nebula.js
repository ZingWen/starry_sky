import * as THREE from 'three';
import noise from '../shaders/noise.glsl?raw';
import vertexShader from '../shaders/nebula.vert?raw';
import nebulaFrag from '../shaders/nebula.frag?raw';

// 包住整個場景的天球，用 shader 畫出流動的星雲
export class Nebula {
  constructor({ radius = 2000 } = {}) {
    this.uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uHue: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader: `${noise}\n${nebulaFrag}`,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.object = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), material);
    this.object.renderOrder = -1;
  }

  update(time, dt, audio, hue, camera) {
    this.uniforms.uTime.value = time;
    this.uniforms.uBass.value = audio.bass;
    this.uniforms.uHue.value = hue;
    // 天球跟著鏡頭移動，看起來就是無限遠的背景
    this.object.position.copy(camera.position);
  }
}
