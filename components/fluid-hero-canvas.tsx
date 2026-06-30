"use client";

import { useEffect, useRef } from "react";

export function FluidHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0.52, y: 0.46, tx: 0.52, ty: 0.46 };

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform vec2 u_pointer;
      uniform vec2 u_resolution;

      mat2 rot(float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c);
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.7, 289.3))) * 45758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 6; i++) {
          value += amp * noise(p);
          p = rot(0.46) * p * 2.03 + vec2(0.14, -0.09);
          amp *= 0.52;
        }
        return value;
      }

      void main() {
        vec2 uv = v_uv;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = (uv - 0.5) * aspect;
        vec2 m = (u_pointer - 0.5) * aspect;

        float t = u_time * 0.2;
        vec2 drift = vec2(t * 0.22, -t * 0.12);
        vec2 flow = p + m * 0.12;

        float broad = fbm(flow * 1.28 + drift);
        float detail = fbm(flow * 2.18 - drift * 1.7 + broad * 0.72);
        vec2 ridgeSpace = rot(-0.62) * (flow + vec2(broad * 0.18, detail * 0.12));
        float ridgeWarp = fbm(ridgeSpace * 2.2 + vec2(t * 0.24, -t * 0.3));
        float ridgeSignal = sin((ridgeSpace.y + ridgeWarp * 0.28) * 18.5 + t * 2.35);
        float ridgeFine = sin((ridgeSpace.y + ridgeWarp * 0.18 + 0.14) * 28.0 - t * 1.9);

        float ridges = smoothstep(0.82, 1.0, abs(ridgeSignal)) * 0.78;
        ridges += smoothstep(0.9, 1.0, abs(ridgeFine)) * 0.22;

        float wash = smoothstep(-0.8, 0.75, ridgeSpace.x + broad * 0.62 + detail * 0.22 + 0.28);
        float glow = smoothstep(0.95, 0.04, distance((uv - vec2(0.66, 0.38)) * vec2(0.82, 1.25), vec2(0.0)));
        float cursor = smoothstep(0.34, 0.0, distance(p, m));

        vec3 ink = vec3(0.015, 0.045, 0.075);
        vec3 deep = vec3(0.05, 0.20, 0.24);
        vec3 teal = vec3(0.05, 0.58, 0.54);
        vec3 aqua = vec3(0.33, 0.78, 0.84);
        vec3 mint = vec3(0.67, 0.95, 0.85);
        vec3 pearl = vec3(0.83, 0.91, 0.86);

        vec3 color = mix(deep, teal, wash);
        color = mix(color, aqua, smoothstep(0.26, 0.92, broad) * 0.42);
        color = mix(color, mint, glow * 0.58);
        color = mix(color, pearl, smoothstep(0.58, 1.05, detail + wash * 0.42) * 0.26);
        color += ridges * vec3(0.45, 0.98, 0.90) * (0.18 + wash * 0.28);
        color += cursor * vec3(0.35, 1.0, 0.92) * 0.18;

        float leftShade = smoothstep(0.64, 0.02, uv.x);
        color = mix(color, ink, leftShade * 0.5);
        float edgeShade = smoothstep(0.76, 1.16, length((uv - 0.5) * vec2(1.08, 1.0)));
        color = mix(color, ink, edgeShade * 0.18);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Klario hero WebGL:", gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "a_position");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      pointer.tx += (pointer.x - pointer.tx) * 0.12;
      pointer.ty += (pointer.y - pointer.ty) * 0.12;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uTime, (now - start) * 0.001);
      gl.uniform2f(uPointer, pointer.tx, 1 - pointer.ty);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    };

    resize();
    draw(start);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas className="fluid-hero-canvas" ref={canvasRef} aria-hidden="true" />;
}
