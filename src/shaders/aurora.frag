// 需要先接上 noise.glsl（snoise），以及 #define BANDS
uniform float uTime;
uniform float uSpec[BANDS];
uniform float uHue;
uniform float uVolume;
uniform float uBeat;

varying vec2 vUv;

// 在頻段之間做線性內插，讓簾幕高度平滑連續
float spectrumAt(float x) {
  float fx = clamp(x, 0.0, 1.0) * float(BANDS - 1);
  int i0 = int(floor(fx));
  int i1 = min(i0 + 1, BANDS - 1);
  return mix(uSpec[i0], uSpec[i1], fract(fx));
}

// 繞著灰階軸旋轉色相（Rodrigues 旋轉）
vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

float curtain(vec2 uv, float k, float t) {
  float x = uv.x;

  // 簾幕的底邊：一條緩慢起伏、飄動的曲線
  float base = 0.05 + 0.04 * k
    + 0.04 * sin(x * 2.5 + t * 0.25 + k * 2.1)
    + 0.035 * snoise(vec3(x * 1.8 + k * 5.0, t * 0.08, k));

  // 這段的音量決定簾幕往上延伸多高
  float level = spectrumAt(x + 0.03 * snoise(vec3(x * 3.0, t * 0.2, k + 7.0)));
  float height = 0.1 + level * 0.6 + uVolume * 0.05;

  float y = uv.y - base;
  float bottom = smoothstep(-0.015, 0.0, y);
  float body = exp(-max(y, 0.0) / height * 2.2);
  float rim = exp(-abs(y) * 60.0) * 0.6; // 底邊比較亮的一道光

  // 極光特有的垂直光束：x 方向細碎、y 方向拉長
  float rays = 0.55 + 0.45 * snoise(vec3(x * 38.0 + k * 13.0, uv.y * 1.2 - t * 0.15, t * 0.25 + k));
  // 整片簾幕緩慢地明暗流動
  float flow = 0.6 + 0.4 * snoise(vec3(x * 4.0 - t * 0.15, k * 3.0, t * 0.1));

  return (body * rays + rim) * bottom * flow * (0.35 + level * 1.1);
}

void main() {
  float t = uTime;
  vec3 green = vec3(0.15, 0.95, 0.55);
  vec3 teal = vec3(0.1, 0.7, 0.9);
  vec3 violet = vec3(0.55, 0.3, 0.95);

  vec3 col = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float c = curtain(vUv, fk, t);

    // 由下往上：綠 → 青 → 紫，整體色相跟著音樂流轉
    vec3 g = mix(green, teal, smoothstep(0.1, 0.45, vUv.y));
    g = mix(g, violet, smoothstep(0.35, 0.8, vUv.y));
    g = hueShift(g, (uHue - 0.7) * 6.2831 + fk * 0.3);

    col += g * c * (k == 0 ? 1.0 : 0.6);
  }

  // 上緣淡出，不留下明顯的邊界
  col *= smoothstep(1.0, 0.6, vUv.y);
  col *= 0.55 + uBeat * 0.25;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
