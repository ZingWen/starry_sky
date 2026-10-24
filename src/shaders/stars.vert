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
  // 在 0.08 ~ 0.40 之間來回，最暗時仍留一點光，不會整顆消失
  float twinkle = 0.08 + 0.32 * (0.5 + 0.5 * sin(uTime * (0.56 + aPhase * 1.75) + aPhase * 40.0));
  float sparkle = step(0.7, fract(aPhase * 13.7)) * uTreble * 1.2;

  vColor = aColor;
  // 截在 0 以上：負值在 HalfFloat + 加法混合下會扣掉背景亮度，變成黑點
  vAlpha = max(twinkle + sparkle, 0.0) * (1.0 + uPulse);
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
