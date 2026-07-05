"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Left phone (Report): waits until halfway through the track, then slides out smoothly
  const xLeft = useTransform(scrollYProgress, [0.45, 0.85], [0, -280]);

  // Right phone (Trends): waits until halfway through the track, then slides out smoothly
  const xRight = useTransform(scrollYProgress, [0.45, 0.85], [0, 280]);

  return (
    <section
      className="hero-gallery-section"
      ref={sectionRef}
      aria-label="Klario app screens"
    >
      <div className="hero-app-gallery">
        {/* Left phone - starts behind center, slides left */}
        <motion.img
          className="hero-phone hero-phone-report"
          src="/app-screens/document-preview.png"
          alt="Klario mobile report preview"
          style={{ x: xLeft }}
        />

        {/* Center phone - always visible and centered */}
        <motion.img
          className="hero-phone hero-phone-main"
          src="/app-screens/dashboard.png"
          alt="Klario mobile dashboard"
        />

        {/* Right phone - starts behind center, slides right */}
        <motion.img
          className="hero-phone hero-phone-trends"
          src="/app-screens/trends.png"
          alt="Klario mobile trends view"
          style={{ x: xRight }}
        />
      </div>
    </section>
  );
}
