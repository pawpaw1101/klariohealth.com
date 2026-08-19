"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BioIcon } from "@/components/bio-icon";

export function HeroGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Left phone (Report): starts with a small peek, then spreads quickly on scroll.
  const xLeft = useTransform(scrollYProgress, [0, 0.36], [-56, -340]);

  // Right phone (Trends): starts with a small peek, then spreads quickly on scroll.
  const xRight = useTransform(scrollYProgress, [0, 0.36], [56, 340]);

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
        <a className="scroll-cue" href="#premium-content" aria-label="Scroll to product showcase">
          <BioIcon name="icon_action_continue" size={20} />
        </a>
      </div>
    </section>
  );
}
