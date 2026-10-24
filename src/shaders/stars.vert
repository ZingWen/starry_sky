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
  // 週期約 4.5 ~ 16 秒
  float twinkle = 0.08 + 0.32 * (0.5 + 0.5 * sin(uTime * (0.5 + aPhase * 1.0) + aPhase * 40.0));
  float sparkle = step(0.7, fract(aPhase * 13.7)) * uTreble * 1.2;

  // 不到 2px 的星星在鏡頭移動時跨過像素格會一直跳動，看起來像在快速閃爍；
  // 所以最小畫成 2px，再依面積比例調暗，維持原本的亮度
  float size = aSize * uPixelRatio * (300.0 / -mv.z);
  float minSize = 2.0 * uPixelRatio;
  float energy = size < minSize ? (size * size) / (minSize * minSize) : 1.0;

  vColor = aColor;
  // 截在 0 以上：負值在 HalfFloat + 加法混合下會扣掉背景亮度，變成黑點
  vAlpha = max(twinkle + sparkle, 0.0) * (1.0 + uPulse) * energy;
  gl_PointSize = max(size, minSize);
  gl_Position = projectionMatrix * mv;
}
