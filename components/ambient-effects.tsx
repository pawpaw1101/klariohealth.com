"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type MouseState = {
  x: number;
  y: number;
  tx: number;
  ty: number;
};

export function AmbientEffects() {
  const pathname = usePathname();
  const webglRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    document.documentElement.classList.toggle("is-touch", isTouch);

    const cleanups: Array<() => void> = [];
    if (webglRef.current) cleanups.push(initWebGL(webglRef.current, mouseRef.current, reducedMotion));
    if (particlesRef.current) cleanups.push(initParticles(particlesRef.current, mouseRef.current, reducedMotion || isTouch));
    if (cursorRef.current) cleanups.push(initCursor(cursorRef.current, mouseRef.current, reducedMotion || isTouch));

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    let revealCleanup: () => void = () => undefined;
    let interactionCleanup: () => void = () => undefined;

    const timeout = window.setTimeout(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      revealCleanup = initReveal(reducedMotion);
      interactionCleanup = initInteractions(reducedMotion || window.matchMedia("(pointer: coarse)").matches);
    }, 40);

    const onScroll = () => {
      document.querySelectorAll(".site-header").forEach((header) => {
        header.classList.toggle("is-scrolled", window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timeout);
      revealCleanup();
      interactionCleanup();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    let loadingFallback = 0;

    const stopLoading = () => {
      window.clearTimeout(loadingFallback);
      cursorRef.current?.classList.remove("is-loading");
      document.documentElement.classList.remove("is-route-loading");
    };

    const startLoading = () => {
      const cursor = cursorRef.current;
      cursor?.classList.add("is-visible", "is-loading");
      document.documentElement.classList.add("is-route-loading");
      window.clearTimeout(loadingFallback);
      loadingFallback = window.setTimeout(stopLoading, 4500);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const next = new URL(href, window.location.href);
      const current = new URL(window.location.href);
      if (next.origin !== current.origin) return;
      if (next.pathname === current.pathname && next.search === current.search) return;

      startLoading();
    };

    window.addEventListener("klario:navigation-start", startLoading);
    window.addEventListener("pageshow", stopLoading);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("klario:navigation-start", startLoading);
      window.removeEventListener("pageshow", stopLoading);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(loadingFallback);
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      cursorRef.current?.classList.remove("is-loading");
      document.documentElement.classList.remove("is-route-loading");
    }, 140);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      <canvas id="klario-webgl" ref={webglRef} aria-hidden="true" />
      <canvas id="klario-particles" ref={particlesRef} aria-hidden="true" />
      <div id="klario-cursor" ref={cursorRef} aria-hidden="true" />
    </>
  );
}

function initWebGL(canvas: HTMLCanvasElement, mouse: MouseState, reducedMotion: boolean) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
  if (!gl) return () => undefined;

  const vertSrc = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision mediump float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.1;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = v_uv;
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 p = (uv - 0.5) * aspect;
      vec2 m = (u_mouse - 0.5) * aspect * 0.35;
      p += m * 0.08;

      float t = u_time * 0.12;
      float n1 = fbm(p * 2.2 + vec2(t, t * 0.7));
      float n2 = fbm(p * 3.5 - vec2(t * 0.6, t * 0.4) + n1);
      float wave = sin(p.x * 4.0 + n2 * 6.0 + t * 2.0) * 0.04;

      vec3 teal = vec3(0.08, 0.58, 0.53);
      vec3 mint = vec3(0.18, 0.83, 0.75);
      vec3 sky = vec3(0.45, 0.65, 0.95);
      vec3 slate = vec3(0.97, 0.98, 0.99);

      float blend = smoothstep(0.2, 0.85, n1 + wave);
      vec3 col = mix(slate, mix(sky * 0.35, mix(teal, mint, n2), 0.55), blend * 0.2);
      float lines = abs(sin((p.y + n1 * 0.4 + wave * 3.0) * 18.0 + t));
      lines = smoothstep(0.92, 1.0, lines) * 0.045;
      col += vec3(0.08, 0.72, 0.65) * lines;

      float vignette = 1.0 - dot(p * 0.55, p * 0.55);
      col *= clamp(vignette, 0.78, 1.0);

      gl_FragColor = vec4(col, 0.48 + n1 * 0.12);
    }
  `;

  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Klario WebGL:", gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return () => undefined;

  const prog = gl.createProgram();
  if (!prog) return () => undefined;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => undefined;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "a_pos");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");
  const uRes = gl.getUniformLocation(prog, "u_resolution");
  let raf = 0;
  const start = performance.now();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    mouse.tx += (mouse.x - mouse.tx) * 0.06;
    mouse.ty += (mouse.y - mouse.ty) * 0.06;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uTime, (now - start) * 0.001);
    gl.uniform2f(uMouse, mouse.tx, 1 - mouse.ty);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reducedMotion) raf = requestAnimationFrame(draw);
  };

  resize();
  draw(start);
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

function initParticles(canvas: HTMLCanvasElement, mouse: MouseState, disabled: boolean) {
  if (disabled) {
    canvas.style.display = "none";
    return () => undefined;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  const particles = Array.from({ length: Math.min(72, Math.floor(window.innerWidth / 20)) }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00014,
    vy: (Math.random() - 0.5) * 0.00014,
    r: 1 + Math.random() * 1.3
  }));

  let width = 0;
  let height = 0;
  let raf = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    raf = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, width, height);
    const mx = mouse.tx * width;
    const my = mouse.ty * height;

    particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
      if (particle.y < 0 || particle.y > 1) particle.vy *= -1;

      const px = particle.x * width;
      const py = particle.y * height;
      const md = Math.hypot(mx - px, my - py);
      if (md < 120 && md > 0) {
        particle.x += ((mx - px) / md) * 0.00006;
        particle.y += ((my - py) / md) * 0.00006;
      }

      ctx.beginPath();
      ctx.arc(px, py, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(13, 148, 136, 0.28)";
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const d = Math.hypot(px - other.x * width, py - other.y * height);
        if (d < 105) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(other.x * width, other.y * height);
          ctx.strokeStyle = `rgba(20, 184, 166, ${0.1 * (1 - d / 105)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    });
  };

  resize();
  draw();
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

function initCursor(cursor: HTMLDivElement, mouse: MouseState, disabled: boolean) {
  if (disabled) {
    cursor.style.display = "none";
    return () => undefined;
  }

  let cx = 0;
  let cy = 0;
  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;

  const render = () => {
    cx = tx;
    cy = ty;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
  };

  const onMove = (event: MouseEvent) => {
    tx = event.clientX;
    ty = event.clientY;
    mouse.x = event.clientX / window.innerWidth;
    mouse.y = event.clientY / window.innerHeight;
    cursor.classList.add("is-visible");
    render();
  };

  const onOver = (event: MouseEvent) => {
    const target = event.target;
    const isHovering = target instanceof Element && Boolean(target.closest("a, button, .button, .card, .screenshot-card, .metric, .record, input, textarea, select, label"));
    const isOnHero = target instanceof Element && Boolean(target.closest(".liquid-hero, .hero"));
    cursor.classList.toggle("is-hover", isHovering);
    cursor.classList.toggle("is-on-hero", isOnHero);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseover", onOver);

  return () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseover", onOver);
  };
}

function initReveal(reducedMotion: boolean) {
  const selectors = [
    ".hero-copy > *",
    ".hero-image",
    ".section-header",
    ".section > .grid > *",
    ".section > .record-list > *",
    ".story-block",
    ".cta-banner",
    ".form-panel",
    ".app-page-title",
    ".metric-grid > *",
    ".login-benefit",
    ".workspace-bar",
    ".interactive-panel",
    ".timeline-list > *",
    ".liquid-hero-copy > *",
    ".liquid-hero-panel",
    ".cascade-card",
    ".cascade-feature",
    ".cascade-step"
  ];

  const els = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(", ")));
  els.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
  });

  if (reducedMotion) {
    els.forEach((el) => el.classList.add("is-visible"));
    return () => undefined;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

function initInteractions(disabled: boolean) {
  if (disabled) return () => undefined;

  const cleanup: Array<() => void> = [];
  document.querySelectorAll<HTMLElement>(".button-primary, .button-secondary").forEach((button) => {
    button.classList.add("magnetic");
    const onMove = (event: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.16}px, ${y * 0.2}px)`;
    };
    const onLeave = () => {
      button.style.transform = "";
    };
    button.addEventListener("mousemove", onMove);
    button.addEventListener("mouseleave", onLeave);
    cleanup.push(() => {
      button.removeEventListener("mousemove", onMove);
      button.removeEventListener("mouseleave", onLeave);
    });
  });

  document.querySelectorAll<HTMLElement>(".card, .screenshot-card, .metric, .form-panel, .hero-image, .record, .liquid-hero-panel, .cascade-feature, .cascade-step").forEach((card) => {
    card.classList.add("tilt-card");
    const onMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${-y * 5}deg`);
      card.style.setProperty("--tilt-y", `${x * 5}deg`);
      card.style.setProperty("--tilt-lift", "1");
    };
    const onLeave = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--tilt-lift", "0");
    };
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    cleanup.push(() => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    });
  });

  return () => cleanup.forEach((fn) => fn());
}
