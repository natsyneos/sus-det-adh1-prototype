import { useEffect, useRef } from 'react';

// ─── Public config type ────────────────────────────────────────────────────────
export interface FogConfig {
  speed:        number;  // animation drift speed       default 0.028
  maxAlpha:     number;  // maximum fog opacity          default 0.70
  touchRadius:  number;  // clearing circle outer radius default 0.14
  touchDecay:   number;  // fog-return speed (1/τ)       default 1.3
  fogScale:     number;  // fog texture zoom             default 1.0
  warpStrength: number;  // domain warp magnitude        default 2.8
  fogLo:        number;  // smoothstep low threshold     default 0.22
  fogHi:        number;  // smoothstep high threshold    default 0.72
}

export const DEFAULT_FOG_CONFIG: FogConfig = {
  speed:        0.028,
  maxAlpha:     0.70,
  touchRadius:  0.14,
  touchDecay:   1.3,
  fogScale:     1.0,
  warpStrength: 2.8,
  fogLo:        0.22,
  fogHi:        0.72,
};

interface FogOverlayProps {
  density: number;
  scale:   number;
  config?: FogConfig;
}

// ─── Vertex shader ────────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// ─── Fragment shader ──────────────────────────────────────────────────────────
const FRAG = `
precision highp float;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_touch;
uniform float u_touchTime;
uniform float u_density;
// tunable parameters
uniform float u_speed;
uniform float u_maxAlpha;
uniform float u_touchRadius;
uniform float u_touchDecay;
uniform float u_fogScale;
uniform float u_warpStrength;
uniform float u_fogLo;
uniform float u_fogHi;

// ── Noise ─────────────────────────────────────────────────────────────────────
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.13);
  p3 += dot(p3, p3.yzx + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),              hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  // Rotation matrix — keeps successive octaves from aligning
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = rot * p + vec2(5.1731, 1.9873);
    a *= 0.5;
  }
  return v;
}

// ── Main ──────────────────────────────────────────────────────────────────────
void main() {
  // uv: (0,0) = top-left, (1,1) = bottom-right  (DOM convention)
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;

  // Aspect-correct so fog tiles look circular, not stretched
  float aspect = u_res.x / u_res.y;          // ≈ 0.562 for 748×1330
  vec2 p = vec2(uv.x * aspect, uv.y) * u_fogScale;

  float t = u_time * u_speed;

  // ── Two-pass domain warping ───────────────────────────────────────────────
  vec2 q = vec2(
    fbm(p + vec2( t,       t * 0.6)),
    fbm(p + vec2(-t * 0.5, t      ) + 4.7)
  );
  vec2 r = vec2(
    fbm(p + u_warpStrength * q + vec2( t * 0.7, -t * 0.4)),
    fbm(p + u_warpStrength * q + vec2(-t * 0.3,  t * 0.8) + 2.1)
  );
  float fog = fbm(p + u_warpStrength * r + vec2(t * 0.4, -t * 0.25));

  // Remap to emphasise mid-high density bands → heavy, patchy clouds
  fog = pow(smoothstep(u_fogLo, u_fogHi, fog), 0.85);

  // ── Global density ────────────────────────────────────────────────────────
  float alpha = fog * u_density * u_maxAlpha;

  // ── Touch clearing ────────────────────────────────────────────────────────
  float age   = clamp(u_time - u_touchTime, 0.0, 10.0);
  float decay = exp(-age * u_touchDecay);

  // Convert touch (0-1 in DOM space) to same aspect-corrected space as p
  vec2 touchP = vec2(u_touch.x * aspect, u_touch.y) * u_fogScale;

  // Organically noisy edge (so the circle isn't geometrically perfect)
  float edgeN = (noise(p * 7.0 + u_time * 0.15) - 0.5) * 0.045;
  float dist  = length(p - touchP) + edgeN;

  // Radius expands slightly at moment of contact, shrinks back as fog returns
  float outerR = u_touchRadius * u_fogScale * (1.0 + decay * 0.35);
  float innerR = outerR * 0.2;
  float clear  = smoothstep(outerR, innerR, dist) * decay;

  alpha = max(0.0, alpha - clear * u_density * u_maxAlpha);

  // ── Colour ────────────────────────────────────────────────────────────────
  vec3 colour = mix(
    vec3(0.78, 0.81, 0.87),  // thin tendrils — cool steel-blue
    vec3(0.93, 0.94, 0.97),  // dense billows — near-white
    fog
  );

  gl_FragColor = vec4(colour, clamp(alpha, 0.0, u_maxAlpha));
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error('[FogOverlay] shader error:', gl.getShaderInfoLog(s));
  return s;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FogOverlay({ density, scale, config = DEFAULT_FOG_CONFIG }: FogOverlayProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const densityRef = useRef(density);
  const scaleRef   = useRef(scale);
  const configRef  = useRef(config);

  useEffect(() => { densityRef.current = density; }, [density]);
  useEffect(() => { scaleRef.current   = scale;   }, [scale]);
  useEffect(() => { configRef.current  = config;  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 748, H = 1330;
    canvas.width  = W;
    canvas.height = H;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) { console.warn('[FogOverlay] WebGL unavailable'); return; }

    // ── Shader program ───────────────────────────────────────────────────────
    const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert); gl.attachShader(prog, frag); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error('[FogOverlay] link error:', gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const U = {
      time:         gl.getUniformLocation(prog, 'u_time'),
      res:          gl.getUniformLocation(prog, 'u_res'),
      touch:        gl.getUniformLocation(prog, 'u_touch'),
      touchTime:    gl.getUniformLocation(prog, 'u_touchTime'),
      density:      gl.getUniformLocation(prog, 'u_density'),
      speed:        gl.getUniformLocation(prog, 'u_speed'),
      maxAlpha:     gl.getUniformLocation(prog, 'u_maxAlpha'),
      touchRadius:  gl.getUniformLocation(prog, 'u_touchRadius'),
      touchDecay:   gl.getUniformLocation(prog, 'u_touchDecay'),
      fogScale:     gl.getUniformLocation(prog, 'u_fogScale'),
      warpStrength: gl.getUniformLocation(prog, 'u_warpStrength'),
      fogLo:        gl.getUniformLocation(prog, 'u_fogLo'),
      fogHi:        gl.getUniformLocation(prog, 'u_fogHi'),
    };
    gl.uniform2f(U.res, W, H);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── State ────────────────────────────────────────────────────────────────
    const start = performance.now();
    let currentDensity = densityRef.current;
    let touchNorm  = [0.5, -2.0]; // off-screen initially
    let touchTime  = -999.0;

    // ── Pointer handler ──────────────────────────────────────────────────────
    // Uses the design-canvas layout equations rather than getBoundingClientRect
    // to avoid CSS-transform ambiguity. The canvas is always centered in the
    // viewport and scaled uniformly by `scale`.
    //
    // IMPORTANT: no Y-flip here.
    // The shader flips its own uv.y (gl convention → DOM convention).
    // Touch ny=0 means "top of screen" and maps to shader uv.y=0 after the
    // shader's flip — they agree. A second flip here would invert the axis.
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

      const s       = scaleRef.current;
      const visualW = W * s;
      const visualH = H * s;
      const originX = (window.innerWidth  - visualW) / 2;
      const originY = (window.innerHeight - visualH) / 2;

      const nx = (clientX - originX) / visualW;
      const ny = (clientY - originY) / visualH;

      // No Y flip — shader and DOM share the same y=0-at-top convention here
      touchNorm = [
        Math.max(0, Math.min(1, nx)),
        Math.max(0, Math.min(1, ny)),
      ];
      touchTime = (performance.now() - start) / 1000;
    };
    window.addEventListener('mousedown',  onPointer);
    window.addEventListener('touchstart', onPointer, { passive: true });

    // ── Render loop ──────────────────────────────────────────────────────────
    let rafId: number;
    const draw = () => {
      const t   = (performance.now() - start) / 1000;
      const cfg = configRef.current;

      currentDensity += (densityRef.current - currentDensity) * 0.035;

      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(U.time,         t);
      gl.uniform2f(U.touch,        touchNorm[0], touchNorm[1]);
      gl.uniform1f(U.touchTime,    touchTime);
      gl.uniform1f(U.density,      currentDensity);
      gl.uniform1f(U.speed,        cfg.speed);
      gl.uniform1f(U.maxAlpha,     cfg.maxAlpha);
      gl.uniform1f(U.touchRadius,  cfg.touchRadius);
      gl.uniform1f(U.touchDecay,   cfg.touchDecay);
      gl.uniform1f(U.fogScale,     cfg.fogScale);
      gl.uniform1f(U.warpStrength, cfg.warpStrength);
      gl.uniform1f(U.fogLo,        cfg.fogLo);
      gl.uniform1f(U.fogHi,        cfg.fogHi);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousedown',  onPointer);
      window.removeEventListener('touchstart', onPointer);
      gl.deleteBuffer(buf);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[50] pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
