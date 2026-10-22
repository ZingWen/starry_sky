attribute float aSize;
attribute float aLife; // 1 = 剛噴出, 0 = 消失
attribute vec3 aColor;

uniform float uPixelRatio;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = aColor;
  vAlpha = aLife;
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z) * (0.5 + aLife);
  gl_Position = projectionMatrix * mv;
}
