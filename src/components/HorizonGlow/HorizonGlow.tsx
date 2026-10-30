import { useEffect, useRef } from 'react';
import { useSettings } from '../../settings/SettingsContext.tsx';
import styles from './HorizonGlow.module.css';

// Свечение «горизонт» в духе Gradient ASCII из React Bits, но без символов:
// только само поле. Над экраном висит почти белое «солнце», под ним яркая
// дуга-горизонт, ниже свет уходит в тёмно-синий и гаснет. Шумовое течение
// медленно колышет форму, поверх — плёночное зерно.
//
// Интро: свет проявляется от горизонта вверх, один раз за сессию.

/** Опорные цвета, смешиваются в OKLab: тёмно-синий → белый → голубой → небесный. */
const RAMP = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'];
const INTRO_SECONDS = 2.4;
/** Поле поднято вверх: белый источник остаётся у кромки экрана, а сумма
 *  ложится на насыщенный синий — иначе белый текст на белом не читается. */
const FIELD_SHIFT = 0.12;
/** Зерно должно быть мельче пикселя экрана, поэтому рендер почти в полном разрешении. */
const MAX_DPR = 2;
/** Зерно обновляется с частотой плёнки, а не каждый кадр. */
const GRAIN_FPS = 24;

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_intro;
uniform float u_frame;
uniform float u_light;
uniform vec3 u_ramp[4];

float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

// Градиентный шум: плавнее value-noise, без «квадратов».
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 labToRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

// Кусочно-линейная шкала по четырём опорным цветам, x в [0, 3].
vec3 ramp(float x) {
  vec3 c = mix(u_ramp[0], u_ramp[1], clamp(x, 0.0, 1.0));
  c = mix(c, u_ramp[2], clamp(x - 1.0, 0.0, 1.0));
  return mix(c, u_ramp[3], clamp(x - 2.0, 0.0, 1.0));
}

vec4 tone(float t) {
  return vec4(ramp(smoothstep(0.3, 1.0, t) * 3.0), smoothstep(0.0, 0.38, t));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  p.y -= ${FIELD_SHIFT.toFixed(2)};
  float t = u_time;

  // Течение: координаты слегка уводит шумом, форма «дышит».
  vec2 warp = vec2(
    noise(p * 1.6 + vec2(0.0, t * 0.3)),
    noise(p * 1.6 + vec2(4.3, 1.7 - t * 0.24))
  ) - 0.5;
  vec2 q = p + warp * 0.09;

  float span = 0.5 * max(aspect, 1.0);
  float x = q.x / span;
  float arch = -0.17 - 0.2 * x * x + 0.02 * sin(t * 0.6);
  float edge = q.y - arch;
  float rim = 0.38 * smoothstep(-0.135, 0.42, edge);
  vec2 sun = vec2(0.08 * sin(t * 0.31) * span, 0.58);
  float spread = length((q - sun) / vec2(0.95 * span, 0.75));
  float sky = mix(0.55, 1.0, smoothstep(0.2, 0.95, spread));

  float reveal = clamp((u_intro * 1.45 - clamp(edge * 1.3, 0.0, 1.0)) / 0.45, 0.0, 1.0);
  reveal = reveal * reveal * (3.0 - 2.0 * reveal);

  vec4 mixed = mix(tone(rim * mix(0.7, 1.0, reveal)), tone(sky * mix(0.7, 1.0, reveal)), smoothstep(0.18, 0.62, edge));
  vec3 color = encode(labToRgb(mixed.rgb));
  float alpha = mixed.a * reveal * mix(0.9, 0.75, u_light);

  float grain = (hash12(gl_FragCoord.xy + u_frame * vec2(17.0, 59.0))
              + hash12(gl_FragCoord.xy * 1.31 + u_frame * 7.0) - 1.0) * 0.08;
  vec3 rgb = color * alpha + grain * (0.25 + alpha) * 0.5;
  gl_FragColor = vec4(clamp(rgb, 0.0, alpha), alpha);
}
`;

// Интро играет один раз за сессию. Отметку ставим на старте, а не на финише:
// так повторный монтаж (StrictMode, возврат на вкладку посреди интро)
// продолжает ту же анимацию, а после неё сразу показывает покой.
let introStartedAt: number | null = null;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function hexToOklab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = toLinear(((n >> 16) & 255) / 255);
  const g = toLinear(((n >> 8) & 255) / 255);
  const b = toLinear((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export default function HorizonGlow() {
  const { theme } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef(theme === 'light' ? 1 : 0);

  useEffect(() => {
    lightRef.current = theme === 'light' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: true });
    if (!canvas || !gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uIntro = gl.getUniformLocation(program, 'u_intro');
    const uFrame = gl.getUniformLocation(program, 'u_frame');
    const uLight = gl.getUniformLocation(program, 'u_light');
    gl.uniform3fv(gl.getUniformLocation(program, 'u_ramp'), RAMP.flatMap(hexToOklab));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = (seconds: number, intro: number, grainFrame: number) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, seconds);
      gl.uniform1f(uIntro, intro);
      gl.uniform1f(uFrame, grainFrame);
      gl.uniform1f(uLight, lightRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    if (reduceMotion) {
      draw(0, 1, 0);
    } else {
      introStartedAt ??= performance.now();
      const introStart = introStartedAt;
      const start = performance.now();
      const tick = (now: number) => {
        const seconds = (now - start) / 1000;
        draw(
          seconds * 0.5,
          Math.min((now - introStart) / 1000 / INTRO_SECONDS, 1),
          Math.floor(seconds * GRAIN_FPS) % 97,
        );
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    // Контекст не «теряем» принудительно: StrictMode монтирует эффект дважды
    // на том же canvas, и второй запуск получил бы мёртвый контекст.
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.glow} aria-hidden />;
}
