uniform vec3 uColor;

varying float vT;
varying float vAlpha;

void main() {
  // 跟星座連線一樣，兩端留空隙
  float fade = smoothstep(0.0, 0.2, vT) * smoothstep(1.0, 0.8, vT);
  gl_FragColor = vec4(uColor * vAlpha * fade, 1.0);
}
