<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/* The hero's ambient heat: one WebGL shader, slow warm haze rising from the lower left.
   - Renders at half resolution and ~30fps (it is soft, so nobody sees the difference).
   - Pauses when off-screen or the tab is hidden.
   - prefers-reduced-motion: draws one still frame, no loop.
   - No WebGL / context lost: the canvas hides and the section background remains. */
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;          /* (0,0) = bottom left */
  vec2 p = vec2(uv.x * (u_res.x / u_res.y), uv.y);
  float t = u_time * 0.06;

  float warp = fbm(p * 1.3 - vec2(t, 0.0));
  float n = fbm(p * 2.2 + vec2(0.0, -t * 3.0) + warp * 0.8);

  float rise = smoothstep(1.0, 0.0, uv.y);                       /* 1 at the bottom */
  float pool = smoothstep(1.1, 0.0, distance(uv, vec2(0.18, -0.05)));
  float heat = rise * rise * 0.55 + pool * 0.6;

  float a = clamp(heat * (0.35 + 0.65 * n), 0.0, 1.0) * 0.5;
  vec3 chili = vec3(0.62, 0.19, 0.17);
  vec3 ember = vec3(0.78, 0.36, 0.16);
  vec3 col = mix(chili, ember, smoothstep(0.45, 0.85, n) * rise);

  gl_FragColor = vec4(col * a, a);                                 /* premultiplied */
}
`

const SCALE = 0.5
const FPS = 30
const STILL_TIME = 12

const el = ref(null)
let cleanup = null

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const canvas = el.value;
  if (!canvas) return;

  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (vs && fs) {
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
  }
  if (!vs || !fs || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');

  let raf = 0;
  let last = 0;
  let onScreen = true;
  let lost = false;
  const start = performance.now();

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
    const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const draw = (seconds) => {
    if (lost) return;
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, seconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS) return;
    last = now;
    draw((now - start) / 1000);
  };
  const running = () => !reduced && !lost && onScreen && document.visibilityState === 'visible';
  const sync = () => {
    if (running()) {
      if (!raf) raf = requestAnimationFrame(frame);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  draw(reduced ? STILL_TIME : 0);

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  });
  io.observe(canvas);

  const ro = new ResizeObserver(() => {
    if (!running()) draw(reduced ? STILL_TIME : (performance.now() - start) / 1000);
  });
  ro.observe(canvas);

  const onVisibility = () => sync();
  document.addEventListener('visibilitychange', onVisibility);

  const onLost = (e) => {
    e.preventDefault();
    lost = true;
    canvas.style.display = 'none';
    sync();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  sync();

  cleanup = () => {
    if (raf) cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onLost);
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };

})

onBeforeUnmount(() => {
  if (cleanup) cleanup()
  cleanup = null
})
</script>

<template>
  <canvas ref="el" aria-hidden="true" />
</template>
