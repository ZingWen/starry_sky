attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uPulse; // 整體亮度隨音樂起伏（不改變大小，畫面才不會像在晃）
uniform float uTreble;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);

  // 每顆星有自己的閃爍節奏，高音時其中一部分星星會特別亮
  float twinkle = 0.05 + 0.35 * sin(uTime * (0.56 + aPhase * 1.75) + aPhase * 40.0);
  float sparkle = step(0.7, fract(aPhase * 13.7)) * uTreble * 1.2;

  vColor = aColor;
  vAlpha = (twinkle + sparkle) * (1.0 + uPulse);
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
