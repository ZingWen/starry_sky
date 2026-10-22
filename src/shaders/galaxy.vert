attribute float aSize;
attribute float aRadius; // 0 = 中心, 1 = 最外圍
attribute vec3 aColor;

uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uBeat;
uniform float uPixelRatio;
uniform vec3 uTint;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // 節拍時整個星系向外擴張一下，低音推出一圈圈向外的波紋
  vec3 p = position * (1.0 + uBeat * 0.06 * (1.0 - aRadius * 0.5));
  p.y += sin(aRadius * 18.0 - uTime * 3.0) * uBass * 1.5 * aRadius;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);

  // 中音把外圍旋臂染成目前的主題色
  vColor = mix(aColor, uTint * length(aColor), uMid * 0.6 * aRadius);
  // 中心粒子最密集，壓低亮度避免過曝
  vAlpha = (0.12 + uBass * 0.08) * (0.35 + 0.65 * smoothstep(0.0, 0.3, aRadius));
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z) * (1.0 + uBass * 0.4 + uBeat * 0.2);
  gl_Position = projectionMatrix * mv;
}
