import { useEffect, useRef } from 'react';
import { useSettings } from '../../settings/SettingsContext.tsx';
import styles from './Aurora.module.css';

// Сияние сверху экрана в духе Gemini. Три полупрозрачные «шторки» разной
// глубины, у каждой нижний край — крупные колышущиеся языки.
//
// Интро: сияние стекает сверху волной слева направо, затем каждая точка
// проходит круг цветов синий → зелёный → жёлтый → оранжевый → пурпурный →
// синий с задержкой по x и y — цвет прокатывается волной. В конце всё
// останавливается на акцентном синем, форма продолжает колыхаться.

/** Длительность круга цветов в одной точке, с. */
const INTRO_CYCLE = 6;
/** Насколько правый край отстаёт от левого, с. */
const INTRO_X_DELAY = 1.8;
/** Насколько низ сияния отстаёт от верха, с. */
const INTRO_Y_DELAY = 0.9;
/** Картинка — мягкие градиенты, поэтому хватает пониженного разрешения. */
const RENDER_SCALE = 0.3;

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
uniform float u_light;
uniform vec3 u_accent;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Опорные цвета круга по видео Gemini: синий → зелёный → жёлтый → оранжевый →
// пурпурный → снова синий. Синий на концах подменяется акцентом в main().
vec3 palette(float p) {
  float s = fract(p) * 5.0;
  vec3 blue = vec3(0.0, 0.45, 1.0);
  vec3 green = vec3(0.15, 0.85, 0.35);
  vec3 yellow = vec3(0.95, 0.85, 0.1);
  vec3 orange = vec3(1.0, 0.5, 0.08);
  vec3 magenta = vec3(0.85, 0.25, 0.9);
  vec3 c = mix(blue, green, smoothstep(0.0, 1.0, s));
  c = mix(c, yellow, smoothstep(1.0, 2.0, s));
  c = mix(c, orange, smoothstep(2.0, 3.0, s));
  c = mix(c, magenta, smoothstep(3.0, 4.0, s));
  return mix(c, blue, smoothstep(4.0, 5.0, s));
}

// Шторка: заливка от верхнего края до волнистой границы.
// base — средняя глубина, amp — размах языков, soft — мягкость края,
// reveal — доля глубины во время появления.
float curtain(float x, float y, float t, float seed, float base, float amp, float soft, float reveal) {
  float n = noise(vec2(x * 2.2 + t * 0.21 + seed, t * 0.13 + seed * 3.1)) * 0.65
          + noise(vec2(x * 4.6 - t * 0.29 + seed * 1.7, t * 0.19 + seed)) * 0.35;
  float edge = (base + (n - 0.5) * amp) * reveal;
  return smoothstep(edge, edge - soft, y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float x = uv.x;
  float y = 1.0 - uv.y;
  float t = u_time;

  // Появление: левый край раньше правого, с плавным торможением.
  float rev = clamp((u_intro - x * 0.9) / 1.4, 0.0, 1.0);
  rev = 1.0 - pow(1.0 - rev, 3.0);

  float deep = curtain(x, y, t, 0.0, 0.68, 0.55, 0.28, rev);
  float mid = curtain(x, y, t * 1.15, 7.3, 0.5, 0.5, 0.24, rev);
  float top = curtain(x, y, t * 0.9, 13.7, 0.28, 0.32, 0.2, rev);

  // Своя фаза круга цветов в каждой точке — отсюда волна.
  float p = clamp((u_intro - x * ${INTRO_X_DELAY.toFixed(2)} - y * ${INTRO_Y_DELAY.toFixed(2)}) / ${INTRO_CYCLE.toFixed(1)}, 0.0, 1.0);
  p = p * p * (3.0 - 2.0 * p);
  float h = p;
  float act = sin(3.14159 * p);
  // У краёв круга (начало и финал) — точный акцент приложения.
  float rest = 1.0 - smoothstep(0.0, 0.15, p) + smoothstep(0.85, 1.0, p);

  vec3 cDeep = mix(palette(h - 0.04 * act), u_accent, rest);
  vec3 cMid = mix(palette(h + 0.03 * act), u_accent, rest);
  vec3 cTop = mix(mix(palette(h + 0.09 * act), u_accent, rest), vec3(1.0), 0.3);

  float fall = mix(1.0, 0.55, smoothstep(0.0, 0.75, y));
  float wDeep = 0.26 * deep * fall;
  float wMid = 0.26 * mid * fall;
  float wTop = 0.24 * top + 0.12 * exp(-y * 14.0) * rev;

  float k = mix(1.0, 0.8, u_light);
  vec3 col = (cDeep * wDeep + cMid * wMid + cTop * wTop) * k;
  float a = clamp((wDeep + wMid + wTop) * k, 0.0, 1.0);
  col = mix(col, vec3(a), u_light * 0.15);

  // Дизеринг против полос на тёмном градиенте.
  float d = (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(max(col + d, 0.0), clamp(a + d, 0.0, 1.0));
}
`;

// Интро играет один раз за сессию. Отметку ставим на старте, а не на
// финише: так повторный монтаж (StrictMode, возврат на вкладку посреди
// интро) продолжает ту же анимацию, а после неё сразу показывает покой.
let introStartedAt: number | null = null;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

function readAccent(): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function Aurora() {
  const { theme } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef(theme === 'light' ? 1 : 0);
  const accentRef = useRef<[number, number, number]>([0, 0.57, 1]);

  // applyTheme выставляет --accent до перерисовки, поэтому здесь он уже новый.
  useEffect(() => {
    lightRef.current = theme === 'light' ? 1 : 0;
    accentRef.current = readAccent();
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
    const uLight = gl.getUniformLocation(program, 'u_light');
    const uAccent = gl.getUniformLocation(program, 'u_accent');

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = (seconds: number, intro: number) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, seconds);
      gl.uniform1f(uIntro, intro);
      gl.uniform1f(uLight, lightRef.current);
      gl.uniform3fv(uAccent, accentRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const INTRO_DONE = 1e4;
    let frame = 0;
    if (reduceMotion) {
      draw(0, INTRO_DONE);
    } else {
      introStartedAt ??= performance.now();
      const introStart = introStartedAt;
      const start = performance.now();
      const tick = (now: number) => {
        draw((now - start) / 1000, Math.min((now - introStart) / 1000, INTRO_DONE));
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

  return <canvas ref={canvasRef} className={styles.aurora} aria-hidden />;
}
