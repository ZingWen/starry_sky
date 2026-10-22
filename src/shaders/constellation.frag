uniform vec3 uColor;
uniform float uOpacity;

varying float vT;

void main() {
  // 像星圖一樣，線條兩端留一點空隙，不直接碰到星星
  float fade = smoothstep(0.06, 0.22, vT) * smoothstep(0.94, 0.78, vT);
  gl_FragColor = vec4(uColor * uOpacity * fade, 1.0);
}
