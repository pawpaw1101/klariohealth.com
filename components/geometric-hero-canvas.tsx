"use client";

import { useEffect, useRef } from "react";

export function GeometricHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

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

      float sdSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }

      vec2 rotatePoint(vec2 p, vec2 c, float a) {
        float s = sin(a);
        float co = cos(a);
        p -= c;
        return vec2(p.x * co - p.y * s, p.x * s + p.y * co) + c;
      }

      float lineShape(float d, float w) {
        return 1.0 - smoothstep(w, w + 0.004, d);
      }

      float circleShape(vec2 p, vec2 c, float r, float w) {
        return 1.0 - smoothstep(w, w + 0.004, abs(length(p - c) - r));
      }

      float rectShape(vec2 p, vec2 c, vec2 size) {
        vec2 q = abs(p - c) - size;
        return 1.0 - smoothstep(0.0, 0.004, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
      }

      float triangleFill(vec2 p, vec2 a, vec2 b, vec2 c) {
        vec2 e0 = b - a;
        vec2 e1 = c - b;
        vec2 e2 = a - c;
        float s0 = (p.x - a.x) * e0.y - (p.y - a.y) * e0.x;
        float s1 = (p.x - b.x) * e1.y - (p.y - b.y) * e1.x;
        float s2 = (p.x - c.x) * e2.y - (p.y - c.y) * e2.x;
        return step(0.0, s0) * step(0.0, s1) * step(0.0, s2);
      }

      void main() {
        vec2 uv = v_uv;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = (uv - 0.5) * aspect + 0.5;
        vec2 mouse = mix(vec2(0.5), u_pointer, 0.18);
        float t = u_time;

        vec3 paper = vec3(0.925, 0.921, 0.914);
        vec3 ink = vec3(0.02, 0.02, 0.02);
        vec3 coral = vec3(0.941, 0.290, 0.141);
        vec3 pink = vec3(0.969, 0.780, 0.824);
        vec3 green = vec3(0.333, 0.678, 0.451);
        vec3 gold = vec3(0.659, 0.478, 0.208);

        vec3 color = paper;

        vec2 gridUv = uv * vec2(11.0, 8.0);
        vec2 gridLine = abs(fract(gridUv) - 0.5);
        float grid = 1.0 - smoothstep(0.012, 0.018, min(gridLine.x, gridLine.y));
        color = mix(color, ink, grid * 0.10);

        vec2 pinkCenter = vec2(0.70 + sin(t * 0.42) * 0.035, 0.28 + cos(t * 0.35) * 0.025);
        float pinkDisc = 1.0 - smoothstep(0.0, 0.012, length(uv - pinkCenter) - 0.18);
        color = mix(color, pink, pinkDisc * 0.92);

        vec2 triCenter = vec2(0.64 + mouse.x * 0.06, 0.67 - mouse.y * 0.04);
        vec2 ta = rotatePoint(vec2(0.53, 0.77), triCenter, sin(t * 0.32) * 0.18);
        vec2 tb = rotatePoint(vec2(0.78, 0.77), triCenter, sin(t * 0.32) * 0.18);
        vec2 tc = rotatePoint(vec2(0.78, 0.52), triCenter, sin(t * 0.32) * 0.18);
        float triFill = triangleFill(uv, ta, tb, tc);
        float triLine = max(max(lineShape(sdSegment(uv, ta, tb), 0.004), lineShape(sdSegment(uv, tb, tc), 0.004)), lineShape(sdSegment(uv, tc, ta), 0.004));
        color = mix(color, coral, triFill * 0.90);
        color = mix(color, ink, triLine * 0.78);

        vec2 rectCenter = vec2(0.24 + sin(t * 0.28) * 0.02, 0.66 + cos(t * 0.22) * 0.025);
        float rect = rectShape(uv, rectCenter, vec2(0.045, 0.145));
        color = mix(color, green, rect * 0.86);

        vec2 star = vec2(0.27, 0.34);
        float starInk = 0.0;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398 + t * 0.18;
          vec2 dir = vec2(cos(a), sin(a)) * 0.11;
          starInk = max(starInk, lineShape(sdSegment(uv, star - dir, star + dir), 0.003));
        }
        color = mix(color, gold, starInk * 0.88);

        float ring = circleShape(uv, vec2(0.31 + mouse.x * 0.04, 0.50), 0.072 + sin(t * 0.5) * 0.01, 0.004);
        color = mix(color, ink, ring * 0.84);

        float sweep = lineShape(sdSegment(uv, vec2(0.08, 0.86), vec2(0.92, 0.16 + sin(t * 0.4) * 0.04)), 0.003);
        color = mix(color, ink, sweep * 0.34);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Klario geometric WebGL:", gl.getShaderInfoLog(shader));
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
      gl.uniform2f(uPointer, pointer.tx, pointer.ty);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / Math.max(1, rect.width);
      pointer.y = (event.clientY - rect.top) / Math.max(1, rect.height);
    };

    resize();
    draw(start);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas className="geometric-hero-canvas" ref={canvasRef} aria-hidden="true" />;
}
