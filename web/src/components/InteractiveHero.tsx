"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent } from "react";

export function InteractiveHero({
  eyebrow,
  title,
  subtitle,
  cta,
  labels,
  onStart,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  labels: string[];
  onStart: () => void;
}) {
  const reduce = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const glowX = useMotionValue(160);
  const glowY = useMotionValue(120);
  const rotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [4, -4]), {
    stiffness: 150,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 150,
    damping: 22,
  });
  const lightX = useSpring(glowX, { stiffness: 110, damping: 24 });
  const lightY = useSpring(glowY, { stiffness: 110, damping: 24 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    tiltX.set(x / rect.width - 0.5);
    tiltY.set(y / rect.height - 0.5);
    glowX.set(x - 180);
    glowY.set(y - 180);
  }

  function resetTilt() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <motion.div
      className="kc-hero"
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1100 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <motion.div className="kc-hero-cursor-light" style={{ x: lightX, y: lightY }} aria-hidden />
      <div className="kc-hero-grid" aria-hidden />
      <div className="kc-hero-scan" aria-hidden />

      <div className="kc-hero-content">
        <motion.p
          className="kc-eyebrow"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <span />
          {eyebrow}
        </motion.p>
        <motion.h1
          className="kc-hero-title"
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="kc-hero-subtitle"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
        >
          {subtitle}
        </motion.p>

        <motion.button
          type="button"
          className="kc-btn-hero"
          onClick={onStart}
          whileHover={reduce ? undefined : { scale: 1.035, y: -3 }}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span>{cta}</span>
          <span className="kc-btn-arrow" aria-hidden>↗</span>
        </motion.button>

        <motion.div
          className="kc-hero-labels"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
          aria-hidden
        >
          {labels.map((label, index) => (
            <motion.span
              key={label}
              animate={reduce ? undefined : { y: [0, index % 2 === 0 ? -5 : 5, 0] }}
              transition={{ duration: 3.8 + index * 0.45, repeat: Infinity, ease: "easeInOut" }}
            >
              {String(index + 1).padStart(2, "0")} · {label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
