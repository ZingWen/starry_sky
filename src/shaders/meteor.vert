attribute vec3 aColor;
attribute vec2 aUv; // x：0 = 尾端, 1 = 頭部；y：-1 ~ 1 橫跨光帶寬度

varying vec3 vColor;
varying vec2 vUv;

void main() {
  vColor = aColor;
  vUv = aUv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
