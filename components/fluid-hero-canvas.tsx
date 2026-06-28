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

        float t = u_time * 0.16;
        vec2 flow = p;
        flow += 0.22 * vec2(
          sin(flow.y * 3.4 + t * 2.2),
          cos(flow.x * 2.8 - t * 1.7)
        );
        flow += m * 0.28;

        float n1 = fbm(flow * 1.55 + vec2(t, -t * 0.72));
        float n2 = fbm((flow + n1 * 0.9) * 2.35 - vec2(t * 0.5, t));
        float ribbon = sin((flow.x + n1 * 0.72) * 5.4 + (flow.y - n2 * 0.28) * 2.5 + t * 3.1);
        float pools = smoothstep(0.18, 0.92, n1 * 0.65 + n2 * 0.55 + ribbon * 0.12);

        float cursor = smoothstep(0.42, 0.0, distance(p, m * 0.8));
        pools += cursor * 0.26;

        vec3 ink = vec3(0.02, 0.18, 0.19);
        vec3 teal = vec3(0.02, 0.62, 0.56);
        vec3 mint = vec3(0.37, 0.95, 0.80);
        vec3 sky = vec3(0.28, 0.51, 0.95);
        vec3 coral = vec3(1.0, 0.42, 0.32);
        vec3 porcelain = vec3(0.94, 0.99, 0.98);

        vec3 color = mix(porcelain, mint, pools * 0.52);
        color = mix(color, teal, smoothstep(0.45, 0.95, n2) * 0.5);
        color = mix(color, sky, smoothstep(0.7, 1.05, n1 + ribbon * 0.16) * 0.36);
        color = mix(color, coral, smoothstep(0.72, 1.12, n2 + cursor * 0.45) * 0.18);

        float vein = smoothstep(0.975, 1.0, abs(sin((flow.x - flow.y * 0.8 + n1 * 0.55) * 22.0 + t * 3.0)));
        color += vein * vec3(0.62, 1.0, 0.94) * 0.12;

        float vignette = smoothstep(1.0, 0.05, dot(p * vec2(0.82, 1.08), p * vec2(0.82, 1.08)));
        color = mix(color * 0.74, color, vignette);
        color = mix(color, ink, smoothstep(0.88, 1.24, length(p)) * 0.32);

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
      pointer.tx += (pointer.x - pointer.tx) * 0.055;
      pointer.ty += (pointer.y - pointer.ty) * 0.055;
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
    canvas.addEventListener("pointermove", onPointerMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas className="fluid-hero-canvas" ref={canvasRef} aria-hidden="true" />;
}
