"use client";

import { useEffect, useMemo, useRef } from "react";

type BodyParticleCardProps = {
  name: string;
  lastTest: string;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  hue: "teal" | "blue" | "amber";
  drift: number;
};

export function BodyParticleCard({ name, lastTest }: BodyParticleCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useMemo(() => createParticles(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let startedAt = performance.now();

    const render = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const time = (performance.now() - startedAt) / 1000;
      const scale = Math.min(width / 320, height / 500);
      const originX = width / 2;
      const originY = height * 0.46;

      const glow = context.createRadialGradient(originX, originY, 20, originX, originY, width * 0.45);
      glow.addColorStop(0, "rgba(20, 184, 166, 0.18)");
      glow.addColorStop(0.55, "rgba(37, 99, 235, 0.08)");
      glow.addColorStop(1, "rgba(15, 23, 42, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      drawSignalRings(context, originX, originY, scale, time);

      for (const particle of particles) {
        const waveX = Math.sin(time * 0.8 + particle.drift) * 1.8;
        const waveY = Math.cos(time * 0.65 + particle.drift) * 1.2;
        const x = originX + (particle.x - 160) * scale + waveX;
        const y = originY + (particle.y - 250) * scale + waveY;
        const radius = Math.max(1, particle.r * scale);

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = particleColor(particle.hue, 0.78 + Math.sin(time + particle.drift) * 0.16);
        context.fill();
      }

      const signalX = originX + (196 - 160) * scale;
      const signalY = originY + (218 - 250) * scale;
      context.beginPath();
      context.arc(signalX, signalY, 24 * scale, 0, Math.PI * 2);
      context.fillStyle = "rgba(251, 191, 36, 0.12)";
      context.fill();

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [particles]);

  return (
    <aside className="dashboard-body-card" aria-label="Health signals preview">
      <div className="body-particle-stage">
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="body-callout">
          <span>Signals</span>
        </div>
      </div>
      <div className="body-card-caption">
        <strong>{name}</strong>
        <span>{lastTest}</span>
      </div>
    </aside>
  );
}

function createParticles() {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const particles: Particle[] = [];
  let attempts = 0;

  while (particles.length < 720 && attempts < 10000) {
    attempts += 1;
    const angle = random() * Math.PI * 2;
    const orbit = Math.sqrt(random());
    const x = 160 + Math.cos(angle) * orbit * (34 + random() * 92);
    const y = 235 + Math.sin(angle) * orbit * (50 + random() * 142);
    if (!isInsideSignalField(x, y, random)) continue;

    const nearSignal = Math.hypot(x - 196, y - 218) < 20;
    particles.push({
      x,
      y,
      r: nearSignal ? 2.2 + random() * 2.2 : 1.15 + random() * 1.45,
      hue: nearSignal ? "amber" : random() > 0.72 ? "blue" : "teal",
      drift: random() * Math.PI * 2
    });
  }

  return particles;
}

function isInsideSignalField(x: number, y: number, random: () => number) {
  const core = ellipse(x, y, 160, 220, 86, 126);
  const orbitA = ellipse(x, y, 160, 224, 122, 174);
  const orbitB = ellipse(x, y, 160, 220, 150, 84);
  const path = Math.abs(Math.sin((x - 70) / 34) * 28 + 238 - y) < 18;
  const inside = core || (orbitA && random() > 0.42) || (orbitB && random() > 0.5) || path;
  if (!inside) return false;

  const outerFade = Math.hypot((x - 160) / 148, (y - 224) / 178);
  return random() > Math.max(0, outerFade - 0.72) * 0.8;
}

function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function particleColor(hue: Particle["hue"], alpha: number) {
  if (hue === "amber") return `rgba(251, 191, 36, ${alpha})`;
  if (hue === "blue") return `rgba(37, 99, 235, ${alpha * 0.78})`;
  return `rgba(20, 184, 166, ${alpha})`;
}

function drawSignalRings(context: CanvasRenderingContext2D, originX: number, originY: number, scale: number, time: number) {
  context.save();
  context.translate(originX, originY - 16 * scale);
  context.rotate(Math.sin(time * 0.28) * 0.05);

  const rings = [
    { rx: 112, ry: 158, color: "rgba(45, 212, 191, 0.34)", width: 1.4, rotation: 0.06 },
    { rx: 140, ry: 82, color: "rgba(96, 165, 250, 0.26)", width: 1.2, rotation: -0.32 },
    { rx: 72, ry: 104, color: "rgba(20, 184, 166, 0.22)", width: 1, rotation: 0.56 }
  ];

  for (const ring of rings) {
    context.save();
    context.rotate(ring.rotation + Math.sin(time * 0.22) * 0.04);
    context.beginPath();
    context.ellipse(0, 0, ring.rx * scale, ring.ry * scale, 0, 0, Math.PI * 2);
    context.strokeStyle = ring.color;
    context.lineWidth = Math.max(1, ring.width * scale);
    context.setLineDash([10 * scale, 12 * scale]);
    context.lineDashOffset = -time * 10 * scale;
    context.stroke();
    context.restore();
  }

  context.beginPath();
  context.arc(0, 0, 46 * scale, 0, Math.PI * 2);
  context.fillStyle = "rgba(20, 184, 166, 0.08)";
  context.strokeStyle = "rgba(45, 212, 191, 0.22)";
  context.lineWidth = Math.max(1, 1.2 * scale);
  context.fill();
  context.stroke();
  context.restore();
}
