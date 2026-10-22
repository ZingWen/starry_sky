attribute float aT;     // 0 = 起點星, 1 = 終點星
attribute float aAlpha; // 這段線的亮度

varying float vT;
varying float vAlpha;

void main() {
  vT = aT;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
