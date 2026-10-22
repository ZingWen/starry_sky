// 所有粒子共用：柔和的圓形光點
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(max(1.0 - d * 2.0, 0.0), 2.2);
  gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
}
