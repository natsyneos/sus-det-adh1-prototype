import { useEffect, useRef } from 'react';

interface FogOverlayProps {
  /** 0 = no fog, 1 = maximum fog */
  density: number;
  /**
   * The CSS scale factor currently applied to the design canvas.
   * Required to correctly map pointer coordinates from viewport space
   * into the design canvas space (bypassing getBoundingClientRect which
   * doesn't reliably account for ancestor CSS transforms in all browsers).
   */
  scale: number;
}

// ─── Vertex shader ──────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ─── Fragment shader ─────────────────────────────────────────────────────────
// Domain-warped FBM fog with organic touch-clearing displacement.
const FRAG = `
precision highp float;

uniform float u_time;       // seconds since mount
uniform vec2  u_res;        // canvas resolution (748, 1330)
uniform vec2  u_touch;      // normalized (0-1) touch pos, y-up
uniform float u_touchTime;  // u_time value at last touch (-999 if never)
uniform float u_density;    // 0-1, pre-lerped on JS side

// ── Noise primitives ─────────────────────────────────────────────────────────
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.13);
  p3 += dot(p3, p3.yzx + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
  return mix(
    mix(hash(i),              hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

// 5-octave FBM — deliberately non-power-of-2 lacunarity for aperiodic look
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(1.6,  1.2, -1.2, 1.6); // rotation + scale between octaves
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = rot * p + vec2(5.1731, 1.9873);
    a *= 0.5;
  }
  return v;
}

// ── Main ─────────────────────────────────────────────────────────────────────
void main() {
  // Flip y so y=0 is top (matches DOM convention for touch coords)
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;

  // Aspect-correct space so the fog looks the same horizontally and vertically
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // ── Domain-warped FBM ─────────────────────────────────────────────────────
  // Slow drift speeds for large-scale fog banks
  float t = u_time * 0.028;

  // First warp pass: large, slow billows
  vec2 q = vec2(
    fbm(p * 1.4 + vec2( t,       t * 0.6)),
    fbm(p * 1.4 + vec2(-t * 0.5, t      ) + 4.7)
  );

  // Second warp pass: mid-scale tendrils layered over the first
  vec2 r = vec2(
    fbm(p * 2.8 + 2.3 * q + vec2( t * 0.7, -t * 0.4)),
    fbm(p * 2.8 + 2.3 * q + vec2(-t * 0.3,  t * 0.8) + 2.1)
  );

  // Final fog value: combine both warp layers
  float fog = fbm(p * 2.0 + 2.8 * r + vec2(t * 0.4, -t * 0.25));

  // Remap: emphasise the mid-to-high density regions to create heavy, patchy fog
  fog = pow(smoothstep(0.22, 0.72, fog), 0.85);

  // ── Global density ────────────────────────────────────────────────────────
  float alpha = fog * u_density * 0.70;

  // ── Touch / tap clearing ─────────────────────────────────────────────────
  float age   = clamp(u_time - u_touchTime, 0.0, 10.0);
  float decay = exp(-age * 1.3);  // half-life ≈ 0.53 s; effectively gone by ~2.5 s

  // Touch coordinates in the same aspect-corrected space
  vec2 touchP = vec2(u_touch.x * aspect, u_touch.y);

  // Slightly noise-perturbed edge so the clearing looks organic, not perfectly circular
  float edgeN = (noise(p * 7.0 + u_time * 0.15) - 0.5) * 0.045;
  float dist  = length(p - touchP) + edgeN;

  // Inner radius that expands slightly on first contact then shrinks as fog returns
  float innerR = 0.032 + decay * 0.018;
  float outerR = 0.19  + decay * 0.06;
  float clear  = smoothstep(outerR, innerR, dist) * decay;

  alpha = max(0.0, alpha - clear * u_density * 0.72);

  // ── Fog colour ────────────────────────────────────────────────────────────
  // Pale cool blue-white, slightly denser regions tinted warmer
  vec3 colour = mix(
    vec3(0.78, 0.81, 0.87),   // thin tendrils — cool steel
    vec3(0.93, 0.94, 0.97),   // dense billows — near-white
    fog
  );

  gl_FragColor = vec4(colour, clamp(alpha, 0.0, 0.70));
}
`;

// ─── WebGL helpers ────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[FogOverlay] shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FogOverlay({ density, scale }: FogOverlayProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const densityRef = useRef(density);
  const scaleRef   = useRef(scale);

  useEffect(() => { densityRef.current = density; }, [density]);
  useEffect(() => { scaleRef.current   = scale;   }, [scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fix the WebGL drawing buffer to the design-canvas size regardless of
    // CSS scaling.  Lower resolution is intentional — fog doesn't need to be
    // sharp, and halving the fragment count keeps the shader affordable.
    const W = 748, H = 1330;
    canvas.width  = W;
    canvas.height = H;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.warn('[FogOverlay] WebGL not available');
      return;
    }

    // ── Program ─────────────────────────────────────────────────────────────
    const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[FogOverlay] program link error:', gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    // ── Full-screen triangle strip (2 triangles = quad) ─────────────────────
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // ── Uniform locations ────────────────────────────────────────────────────
    const uTime      = gl.getUniformLocation(prog, 'u_time');
    const uRes       = gl.getUniformLocation(prog, 'u_res');
    const uTouch     = gl.getUniformLocation(prog, 'u_touch');
    const uTouchTime = gl.getUniformLocation(prog, 'u_touchTime');
    const uDensity   = gl.getUniformLocation(prog, 'u_density');

    gl.uniform2f(uRes, W, H);

    // ── Blending ─────────────────────────────────────────────────────────────
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── State ────────────────────────────────────────────────────────────────
    const start        = performance.now();
    let  currentDensity = densityRef.current;
    // Touch state — initial touchTime far in the past so no clearing on load
    let touchNorm  = [0.5, -2.0]; // y=-2 puts it well off-screen
    let touchTime  = -999.0;

    // ── Pointer handler ──────────────────────────────────────────────────────
    // We compute touch coordinates mathematically rather than via
    // getBoundingClientRect because ancestor CSS transforms (translate + scale)
    // can produce incorrect rects in some browser/OS combinations.
    // The design canvas is always centered in the viewport and scaled uniformly.
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

      const s       = scaleRef.current;
      const visualW = W * s;
      const visualH = H * s;
      // Design canvas top-left corner in viewport coordinates
      const originX = (window.innerWidth  - visualW) / 2;
      const originY = (window.innerHeight - visualH) / 2;

      const nx = (clientX - originX) / visualW;
      const ny = (clientY - originY) / visualH;

      touchNorm = [
        Math.max(0, Math.min(1, nx)),
        Math.max(0, Math.min(1, 1 - ny)), // flip Y — GL y=0 is at bottom
      ];
      touchTime = (performance.now() - start) / 1000;
    };
    window.addEventListener('mousedown',  onPointer);
    window.addEventListener('touchstart', onPointer, { passive: true });

    // ── Render loop ──────────────────────────────────────────────────────────
    let rafId: number;
    const draw = () => {
      const t = (performance.now() - start) / 1000;

      // Smoothly lerp density — gives an animated dissipation between screens
      currentDensity += (densityRef.current - currentDensity) * 0.035;

      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime,      t);
      gl.uniform2f(uTouch,     touchNorm[0], touchNorm[1]);
      gl.uniform1f(uTouchTime, touchTime);
      gl.uniform1f(uDensity,   currentDensity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(draw);
    };
    draw();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousedown',  onPointer);
      window.removeEventListener('touchstart', onPointer);
      gl.deleteBuffer(buf);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteProgram(prog);
    };
  }, []); // intentionally empty — density is handled via ref

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[50] pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
