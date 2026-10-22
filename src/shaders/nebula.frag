// 需要先接上 noise.glsl（snoise）
uniform float uTime;
uniform float uBass;
uniform float uHue;

varying vec3 vDir;

// 只用 3 層、高頻衰減快，雲霧比較柔、沒有銳利的細節
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 1.9 + vec3(1.7, 9.2, 3.1);
    a *= 0.4;
  }
  return v;
}

vec3 palette(float t) {
  // 以深藍、靛藍為主，只帶一點點紫
  vec3 indigo = vec3(0.06, 0.05, 0.28);
  vec3 blue = vec3(0.02, 0.10, 0.34);
  vec3 violet = vec3(0.16, 0.05, 0.26);
  float s = 0.5 + 0.5 * sin(6.2831 * t);
  float c = 0.5 + 0.5 * sin(6.2831 * (t + 0.33));
  return mix(mix(indigo, blue, s), violet, c * 0.2);
}

void main() {
  vec3 d = normalize(vDir);
  float t = uTime * 0.01;
  vec3 p = d * 1.1;

  // 輕微的 domain warping：緩慢流動，但不扭成明顯的絲狀
  vec2 q = vec2(fbm(p + vec3(0.0, t, 0.0)), fbm(p + vec3(5.2, 1.3, t)));
  float n = fbm(p + vec3(q, q.x) * 0.6);

  // 很寬的漸層邊緣，雲霧自然淡出到背景
  float clouds = smoothstep(-0.35, 0.9, n);
  clouds *= clouds;

  // 星雲集中在一條橫跨天空的帶狀區域，往上下慢慢消失
  float band = exp(-d.y * d.y * 3.0);

  vec3 base = vec3(0.0015, 0.0025, 0.009); // 藍黑色的底
  vec3 tint = palette(n * 0.5 + q.x * 0.3 + uHue);
  float strength = clouds * (0.0165 + 0.066 * band) * (0.85 + 0.3 * uBass);
  vec3 col = base + tint * strength;

  gl_FragColor = vec4(col, 1.0);
}
