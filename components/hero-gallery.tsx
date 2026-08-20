"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function HeroGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [spreadDistance, setSpreadDistance] = useState(320);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 92%", "end 20%"]
  });

  useEffect(() => {
    const updateSpreadDistance = () => {
      setSpreadDistance(Math.min(Math.max(window.innerWidth * 0.27, 128), 360));
    };

    updateSpreadDistance();
    window.addEventListener("resize", updateSpreadDistance);
    return () => window.removeEventListener("resize", updateSpreadDistance);
  }, []);

  const bloomProgress = useTransform(scrollYProgress, [0, 0.36], [0, 1]);
  const spring = { stiffness: 180, damping: 15, mass: 0.8 };
  const springProgress = useSpring(bloomProgress, spring);
  const xLeft = useTransform(springProgress, [0, 1], [0, -spreadDistance]);
  const xRight = useTransform(springProgress, [0, 1], [0, spreadDistance]);
  const leftRotate = useTransform(springProgress, [0, 1], [0, -11]);
  const rightRotate = useTransform(springProgress, [0, 1], [0, 11]);
  const sideY = useTransform(springProgress, [0, 1], [0, 18]);
  const sideScale = useTransform(springProgress, [0, 1], [0.88, 0.96]);
  const centerY = useTransform(springProgress, [0, 1], [20, -22]);
  const centerScale = useTransform(springProgress, [0, 1], [0.94, 1.06]);
  const bloomOpacity = useTransform(bloomProgress, [0, 0.12, 0.78, 1], [0, 1, 0.48, 0]);
  const bloomScale = useTransform(bloomProgress, [0, 1], [0.48, 1.36]);

  return (
    <section className="hero-gallery-section" ref={sectionRef} aria-label="Klario app screens">
      <div className="hero-app-gallery">
        <motion.span className="hero-gallery-bloom" aria-hidden="true" style={{ opacity: bloomOpacity, scale: bloomScale }} />
        <motion.img
          className="hero-phone hero-phone-report"
          src="/investor-screens/09_report_detail_structured.png"
          alt="Klario structured laboratory report"
          loading="lazy"
          style={{ x: xLeft, y: sideY, rotate: leftRotate, scale: sideScale }}
        />
        <motion.img
          className="hero-phone hero-phone-main"
          src="/investor-screens/03_dashboard_body_populated.png"
          alt="Klario health dashboard"
          fetchPriority="high"
          style={{ y: centerY, scale: centerScale }}
        />
        <motion.img
          className="hero-phone hero-phone-trends"
          src="/investor-screens/14_trends_overview_populated.png"
          alt="Klario longitudinal health trends"
          loading="lazy"
          style={{ x: xRight, y: sideY, rotate: rightRotate, scale: sideScale }}
        />
      </div>
    </section>
  );
}
