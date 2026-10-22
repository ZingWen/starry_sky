varying vec3 vColor;
varying vec2 vUv;

void main() {
  // 抗鋸齒取樣時 vUv 可能略超出 0~1，負數做 pow 會變成 NaN，
  // NaN 經過光暈模糊後會讓整個畫面閃黑，所以一定要先 clamp
  float x = clamp(vUv.x, 0.0, 1.0);
  float y = clamp(vUv.y, -1.0, 1.0);

  // 尾巴越往後越淡，中線最亮、兩側柔和
  float along = pow(x, 1.8);
  float across = 1.0 - y * y;
  across *= across;
  gl_FragColor = vec4(vColor * along * across, 1.0);
}
