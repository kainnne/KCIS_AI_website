"use client";

import { motion, useReducedMotion } from "motion/react";
import { trackSpot } from "./OptionCard";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Navigator welcome: one glass card with a cursor reflection, staggered fade-up entrance. */
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
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.9, ease: EASE },
        };

  return (
    <div className="kc-hero" onPointerMove={trackSpot}>
      <span className="kc-spot" aria-hidden />

      <div className="kc-hero-content">
        <motion.p className="kc-eyebrow" {...rise(0.05)}>
          <span />
          {eyebrow}
        </motion.p>
        <motion.h1 className="kc-hero-title" {...rise(0.12)}>
          {title}
        </motion.h1>
        <motion.p className="kc-hero-subtitle" {...rise(0.2)}>
          {subtitle}
        </motion.p>

        <motion.div {...rise(0.28)}>
          <button type="button" className="kc-btn-primary kc-btn-hero" onClick={onStart}>
            <span>{cta}</span>
            <span className="kc-btn-arrow" aria-hidden>↗</span>
          </button>
        </motion.div>

        <motion.div className="kc-hero-labels" {...rise(0.36)} aria-hidden>
          {labels.map((label, index) => (
            <span key={label}>
              {String(index + 1).padStart(2, "0")} · {label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
