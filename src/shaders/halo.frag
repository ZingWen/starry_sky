// 柔和的光暈：中心到邊緣以高斯曲線淡出，沒有明顯的邊界
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = exp(-d * d * 18.0) * (1.0 - smoothstep(0.4, 0.5, d));
  gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
}
