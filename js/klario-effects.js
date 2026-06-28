/**
 * Klario — WebGL background, scroll reveals, and mouse interactions
 */
(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  /* ------------------------------------------------------------------ */
  /* DOM setup                                                           */
  /* ------------------------------------------------------------------ */

  function ensureCanvas() {
    let canvas = document.getElementById('klario-webgl');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'klario-webgl';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }
    return canvas;
  }

  function ensureCursor() {
    if (isTouch || reducedMotion) return null;
    let el = document.getElementById('klario-cursor');
    if (!el) {
      el = document.createElement('div');
      el.id = 'klario-cursor';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  /* ------------------------------------------------------------------ */
  /* WebGL flowing mesh background                                       */
  /* ------------------------------------------------------------------ */

  function initWebGL(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return null;

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

        vec3 teal   = vec3(0.08, 0.58, 0.53);
        vec3 mint   = vec3(0.18, 0.83, 0.75);
        vec3 sky    = vec3(0.45, 0.65, 0.95);
        vec3 slate  = vec3(0.97, 0.98, 0.99);

        float blend = smoothstep(0.2, 0.85, n1 + wave);
        vec3 col = mix(slate, mix(sky * 0.35, mix(teal, mint, n2), 0.55), blend * 0.22);

        float lines = abs(sin((p.y + n1 * 0.4 + wave * 3.0) * 18.0 + t));
        lines = smoothstep(0.92, 1.0, lines) * 0.06;
        col += vec3(0.08, 0.72, 0.65) * lines;

        float vignette = 1.0 - dot(p * 0.55, p * 0.55);
        col *= clamp(vignette, 0.75, 1.0);

        float alpha = 0.55 + n1 * 0.15;
        gl_FragColor = vec4(col, alpha);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Klario WebGL:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    let start = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      mouse.tx += (mouse.x - mouse.tx) * 0.06;
      mouse.ty += (mouse.y - mouse.ty) * 0.06;

      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uTime, (now - start) * 0.001);
      gl.uniform2f(uMouse, mouse.tx, 1.0 - mouse.ty);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    resize();
    if (!reducedMotion) frame(start);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Particle network (2D canvas overlay)                                */
  /* ------------------------------------------------------------------ */

  function initParticles() {
    if (reducedMotion || isTouch) return null;

    const overlay = document.createElement('canvas');
    overlay.id = 'klario-particles';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.prepend(overlay);
    const ctx = overlay.getContext('2d');

    const COUNT = Math.min(80, Math.floor(window.innerWidth / 18));
    const particles = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00015,
        r: 1 + Math.random() * 1.5,
      });
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      overlay.width = w * dpr;
      overlay.height = h * dpr;
      overlay.style.width = w + 'px';
      overlay.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.tx * w;
      const my = mouse.ty * h;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;

        const px = p.x * w;
        const py = p.y * h;

        const dx = mx - px;
        const dy = my - py;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          p.x += (dx / dist) * 0.00008;
          p.y += (dy / dist) * 0.00008;
        }

        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(13, 148, 136, 0.35)';
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x * w - b.x * w;
          const dy = a.y * h - b.y * h;
          const d = Math.hypot(dx, dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.strokeStyle = `rgba(20, 184, 166, ${0.12 * (1 - d / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        const a = particles[i];
        const dx = mx - a.x * w;
        const dy = my - a.y * h;
        const d = Math.hypot(dx, dy);
        if (d < 140) {
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(45, 212, 191, ${0.18 * (1 - d / 140)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      overlay.remove();
      window.removeEventListener('resize', resize);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Custom cursor glow                                                  */
  /* ------------------------------------------------------------------ */

  function initCursor(el) {
    if (!el) return;

    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let hovering = false;

    document.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    });

    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      hovering = !!(t.closest('a, button, .button, .card, .screenshot-card, .metric, .record, input, textarea, select, label'));
      el.classList.toggle('is-hover', hovering);
    });

    function tick() {
      raf = requestAnimationFrame(tick);
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      el.style.transform = `translate(${cx}px, ${cy}px)`;
    }

    tick();

    return () => cancelAnimationFrame(raf);
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */

  function initReveal() {
    const selectors = [
      '.hero-copy > *',
      '.hero-image',
      '.section-header',
      '.section > .grid > *',
      '.section > .record-list > *',
      '.story-block',
      '.cta-banner',
      '.form-panel',
      '.app-page-title',
      '.metric-grid > *',
      '.login-benefit',
    ];

    const els = document.querySelectorAll(selectors.join(', '));
    els.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(i % 6, 5) * 70}ms`);
    });

    if (reducedMotion) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic buttons                                                    */
  /* ------------------------------------------------------------------ */

  function initMagnetic() {
    if (isTouch || reducedMotion) return;

    document.querySelectorAll('.button-primary, .button-secondary').forEach((btn) => {
      btn.classList.add('magnetic');

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3D card tilt                                                        */
  /* ------------------------------------------------------------------ */

  function initTilt() {
    if (isTouch || reducedMotion) return;

    const cards = document.querySelectorAll('.card, .screenshot-card, .metric, .form-panel, .hero-image');

    cards.forEach((card) => {
      card.classList.add('tilt-card');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${-y * 8}deg`);
        card.style.setProperty('--tilt-y', `${x * 8}deg`);
        card.style.setProperty('--tilt-lift', '1');
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--tilt-lift', '0');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Header scroll + page entrance                                       */
  /* ------------------------------------------------------------------ */

  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initPageEntrance() {
    document.body.classList.add('page-enter');
    requestAnimationFrame(() => {
      document.body.classList.add('page-enter-active');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Smooth anchor transitions                                         */
  /* ------------------------------------------------------------------ */

  function initLinkTransitions() {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;

      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => {
          window.location.href = href;
        }, 280);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eyebrow pulse                                                       */
  /* ------------------------------------------------------------------ */

  function initEyebrowPulse() {
    document.querySelectorAll('.eyebrow-dot').forEach((dot) => {
      dot.classList.add('pulse-dot');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    const canvas = ensureCanvas();
    initWebGL(canvas);
    initParticles();
    initCursor(ensureCursor());
    initReveal();
    initMagnetic();
    initTilt();
    initHeaderScroll();
    initPageEntrance();
    initEyebrowPulse();

    if (!reducedMotion) {
      initLinkTransitions();
    }

    if (isTouch) {
      document.documentElement.classList.add('is-touch');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
