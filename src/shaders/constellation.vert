attribute float aT; // 0 = 起點星, 1 = 終點星

varying float vT;

void main() {
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
