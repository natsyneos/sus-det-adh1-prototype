import { useEffect, useRef } from 'react';

// ─── Public config type ───────────────────────────────────────────────────────
export interface FogConfig {
  speed:        number;  // animation drift speed         default 0.028
  maxAlpha:     number;  // maximum fog opacity            default 0.75
  touchRadius:  number;  // brush clearing radius          default 0.14
  touchDecay:   number;  // trail fade speed (1/τ seconds) default 0.6
  fogScale:     number;  // fog texture zoom               default 1.0
  warpStrength: number;  // domain warp magnitude          default 1.8
  fogLo:        number;  // smoothstep low threshold       default 0.22
  fogHi:        number;  // smoothstep high threshold      default 0.72
}

export const DEFAULT_FOG_CONFIG: FogConfig = {
  speed:        0.028,
  maxAlpha:     0.70,
  touchRadius:  0.14,
  touchDecay:   1.4,
  fogScale:     1.0,
  warpStrength: 1.8,
  fogLo:        0.22,
  fogHi:        0.72,
};

interface FogOverlayProps {
  density: number;
  scale:   number;
  config?: FogConfig;
}

// ─── Shared vertex shader (full-screen quad for both passes) ──────────────────
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// ─── Pass 1: Trail update ─────────────────────────────────────────────────────
// Reads the previous trail texture, decays it, and paints the brush at the
// current touch position. Output becomes the new trail texture.
// All coordinates use GL convention: uv(0,0) = bottom-left.
const TRAIL_FRAG = `
precision highp float;

uniform sampler2D u_prevTrail;
uniform vec2  u_res;         // trail texture resolution
uniform float u_touchX;      // DOM-space x, 0=left  1=right
uniform float u_touchY;      // DOM-space y, 0=top   1=bottom
uniform float u_touching;    // 1.0 while pointer is held, else 0.0
uniform float u_brushRadius; // outer radius (aspect-corrected space)
uniform float u_decay;       // per-frame decay factor = exp(-touchDecay * dt)

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

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;  // GL: (0,0) = bottom-left

  // Decay previous trail
  float prev  = texture2D(u_prevTrail, uv).r;
  float trail = prev * u_decay;

  if (u_touching > 0.5) {
    float aspect = u_res.x / u_res.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    // Convert DOM touch (y=0 at top) → GL (y=0 at bottom)
    vec2 touch = vec2(u_touchX * aspect, 1.0 - u_touchY);

    // Two-octave noise warp — wispy, irregular edge (no perfect circle)
    float n1 = noise(p * 6.0);
    float n2 = noise(p * 13.0 + vec2(4.1, 2.7));
    float warp = (n1 * 0.65 + n2 * 0.35 - 0.5) * 0.10;
    float dist = length(p - touch) + warp;

    // Gaussian falloff — soft fade with no hard border
    float sigma = u_brushRadius * 0.55;
    float brush = exp(-dist * dist / (2.0 * sigma * sigma));

    // Cap below 1.0 so fog is never fully punched out — just thinned
    trail = max(trail, brush * 0.80);
  }

  gl_FragColor = vec4(trail, 0.0, 0.0, 1.0);
}
`;

// ─── Pass 2: Fog render ───────────────────────────────────────────────────────
// Renders the animated fog noise and subtracts the trail texture to reveal
// the layer below wherever the user has drawn.
const FOG_FRAG = `
precision highp float;

uniform float u_time;
uniform vec2  u_res;          // canvas resolution (748, 1330)
uniform float u_density;
uniform float u_speed;
uniform float u_maxAlpha;
uniform float u_fogScale;
uniform float u_warpStrength;
uniform float u_fogLo;
uniform float u_fogHi;
uniform sampler2D u_trailTex; // cleared-path mask

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
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = rot * p + vec2(5.1731, 1.9873);
    a *= 0.5;
  }
  return v;
}

void main() {
  // uv: (0,0) = top-left (DOM convention)
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;

  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * u_fogScale;

  float t = u_time * u_speed;

  // Two-pass domain warping for organic, non-repeating clouds
  vec2 q = vec2(
    fbm(p + vec2( t,       t * 0.6)),
    fbm(p + vec2(-t * 0.5, t      ) + 4.7)
  );
  vec2 r = vec2(
    fbm(p + u_warpStrength * q + vec2( t * 0.7, -t * 0.4)),
    fbm(p + u_warpStrength * q + vec2(-t * 0.3,  t * 0.8) + 2.1)
  );
  float fog = fbm(p + u_warpStrength * r + vec2(t * 0.4, -t * 0.25));

  fog = pow(smoothstep(u_fogLo, u_fogHi, fog), 0.85);

  float alpha = fog * u_density * u_maxAlpha;

  // Multiplicative thinning: fog thins rather than disappearing — no punched-hole look
  float trailClear = texture2D(u_trailTex, gl_FragCoord.xy / u_res).r;
  alpha = alpha * (1.0 - trailClear * 0.88);

  vec3 colour = mix(
    vec3(0.78, 0.81, 0.87),
    vec3(0.93, 0.94, 0.97),
    fog
  );
  gl_FragColor = vec4(colour, clamp(alpha, 0.0, u_maxAlpha));
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error('[FogOverlay] shader error:', gl.getShaderInfoLog(s));
  return s;
}

function linkProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string) {
  const vert = compileShader(gl, gl.VERTEX_SHADER,   vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    console.error('[FogOverlay] link error:', gl.getProgramInfoLog(prog));
  return { prog, vert, frag };
}

/** Create an RGBA texture + FBO at the given size. */
function createFBO(gl: WebGLRenderingContext, w: number, h: number) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { tex, fbo };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FogOverlay({ density, scale, config = DEFAULT_FOG_CONFIG }: FogOverlayProps) {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const densityRef      = useRef(density);
  const scaleRef        = useRef(scale);
  const configRef       = useRef(config);
  const isPointerDownRef = useRef(false);

  useEffect(() => { densityRef.current  = density; }, [density]);
  useEffect(() => { scaleRef.current    = scale;   }, [scale]);
  useEffect(() => { configRef.current   = config;  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fog canvas — full design-canvas resolution
    const W = 748, H = 1330;
    canvas.width  = W;
    canvas.height = H;

    // Trail texture — half resolution (still sharp enough for a soft brush)
    const TW = 374, TH = 665;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) { console.warn('[FogOverlay] WebGL unavailable'); return; }

    // ── Shader programs ──────────────────────────────────────────────────────
    const trail = linkProgram(gl, VERT, TRAIL_FRAG);
    const fog   = linkProgram(gl, VERT, FOG_FRAG);

    // ── Shared full-screen quad ──────────────────────────────────────────────
    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    function bindQuad(prog: WebGLProgram) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuf);
      const loc = gl!.getAttribLocation(prog, 'a_pos');
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
    }

    // ── Trail ping-pong FBOs ─────────────────────────────────────────────────
    const fbos = [createFBO(gl, TW, TH), createFBO(gl, TW, TH)];
    let read = 0, write = 1;

    // ── Trail uniform locations ──────────────────────────────────────────────
    gl.useProgram(trail.prog);
    const tU = {
      prevTrail:   gl.getUniformLocation(trail.prog, 'u_prevTrail'),
      res:         gl.getUniformLocation(trail.prog, 'u_res'),
      touchX:      gl.getUniformLocation(trail.prog, 'u_touchX'),
      touchY:      gl.getUniformLocation(trail.prog, 'u_touchY'),
      touching:    gl.getUniformLocation(trail.prog, 'u_touching'),
      brushRadius: gl.getUniformLocation(trail.prog, 'u_brushRadius'),
      decay:       gl.getUniformLocation(trail.prog, 'u_decay'),
    };
    gl.uniform2f(tU.res, TW, TH);

    // ── Fog uniform locations ────────────────────────────────────────────────
    gl.useProgram(fog.prog);
    const fU = {
      time:         gl.getUniformLocation(fog.prog, 'u_time'),
      res:          gl.getUniformLocation(fog.prog, 'u_res'),
      density:      gl.getUniformLocation(fog.prog, 'u_density'),
      speed:        gl.getUniformLocation(fog.prog, 'u_speed'),
      maxAlpha:     gl.getUniformLocation(fog.prog, 'u_maxAlpha'),
      fogScale:     gl.getUniformLocation(fog.prog, 'u_fogScale'),
      warpStrength: gl.getUniformLocation(fog.prog, 'u_warpStrength'),
      fogLo:        gl.getUniformLocation(fog.prog, 'u_fogLo'),
      fogHi:        gl.getUniformLocation(fog.prog, 'u_fogHi'),
      trailTex:     gl.getUniformLocation(fog.prog, 'u_trailTex'),
    };
    gl.uniform2f(fU.res, W, H);
    gl.uniform1i(fU.trailTex, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── Pointer state ────────────────────────────────────────────────────────
    const start = performance.now();
    let currentDensity = densityRef.current;
    let touchNorm = [0.5, -2.0]; // off-screen initially

    const computeNorm = (clientX: number, clientY: number) => {
      const s = scaleRef.current;
      const vW = W * s, vH = H * s;
      return [
        Math.max(0, Math.min(1, (clientX - (window.innerWidth  - vW) / 2) / vW)),
        Math.max(0, Math.min(1, (clientY - (window.innerHeight - vH) / 2) / vH)),
      ];
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      isPointerDownRef.current = true;
      const cx = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      touchNorm = computeNorm(cx, cy);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        touchNorm = computeNorm(e.touches[0]?.clientX ?? 0, e.touches[0]?.clientY ?? 0);
      } else if (isPointerDownRef.current) {
        touchNorm = computeNorm(e.clientX, e.clientY);
      }
    };
    const onUp = () => { isPointerDownRef.current = false; };

    window.addEventListener('mousedown',  onDown);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseup',    onUp);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove',  onMove, { passive: true });
    window.addEventListener('touchend',   onUp);

    // ── Render loop ──────────────────────────────────────────────────────────
    let rafId: number;
    let lastT = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt  = Math.min((now - lastT) / 1000, 0.1); // cap at 100ms
      lastT = now;
      const t   = (now - start) / 1000;
      const cfg = configRef.current;

      currentDensity += (densityRef.current - currentDensity) * 0.035;

      const perFrameDecay = Math.exp(-cfg.touchDecay * dt);

      // ── Pass 1: Update trail texture ──────────────────────────────────────
      gl.useProgram(trail.prog);
      bindQuad(trail.prog);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[write].fbo);
      gl.viewport(0, 0, TW, TH);
      gl.disable(gl.BLEND); // trail pass: no blending, pure overwrite

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbos[read].tex);
      gl.uniform1i(tU.prevTrail, 0);
      gl.uniform1f(tU.touchX,      touchNorm[0]);
      gl.uniform1f(tU.touchY,      touchNorm[1]);
      gl.uniform1f(tU.touching,    isPointerDownRef.current ? 1.0 : 0.0);
      gl.uniform1f(tU.brushRadius, cfg.touchRadius);
      gl.uniform1f(tU.decay,       perFrameDecay);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Swap ping-pong buffers
      const tmp = read; read = write; write = tmp;

      // ── Pass 2: Render fog to canvas ──────────────────────────────────────
      gl.useProgram(fog.prog);
      bindQuad(fog.prog);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null); // render to canvas
      gl.viewport(0, 0, W, H);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbos[read].tex); // current trail
      gl.uniform1i(fU.trailTex, 0);

      gl.uniform1f(fU.time,         t);
      gl.uniform1f(fU.density,      currentDensity);
      gl.uniform1f(fU.speed,        cfg.speed);
      gl.uniform1f(fU.maxAlpha,     cfg.maxAlpha);
      gl.uniform1f(fU.fogScale,     cfg.fogScale);
      gl.uniform1f(fU.warpStrength, cfg.warpStrength);
      gl.uniform1f(fU.fogLo,        cfg.fogLo);
      gl.uniform1f(fU.fogHi,        cfg.fogHi);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(draw);
    };
    draw();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousedown',  onDown);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseup',    onUp);
      window.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onUp);
      gl.deleteBuffer(quadBuf);
      fbos.forEach(({ tex, fbo }) => { gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); });
      gl.deleteShader(trail.vert); gl.deleteShader(trail.frag); gl.deleteProgram(trail.prog);
      gl.deleteShader(fog.vert);   gl.deleteShader(fog.frag);   gl.deleteProgram(fog.prog);
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
