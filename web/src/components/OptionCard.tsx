"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

/** Moves the glass reflection with the pointer (sets --mx / --my on the card). */
export function trackSpot(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function OptionCard({
  title,
  hint,
  selected,
  onClick,
  large = false,
}: {
  title: string;
  hint?: string;
  selected?: boolean;
  onClick: () => void;
  large?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { y: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onPointerMove={trackSpot}
      className={`kc-card kc-choice relative w-full overflow-hidden text-left ${
        selected ? "kc-card-selected" : ""
      } ${large ? "min-h-[6.5rem] p-5 pr-14 sm:p-6 sm:pr-16" : "kc-choice-sm min-h-[4.25rem] p-4 pr-14"}`}
    >
      <span className="kc-spot" aria-hidden />
      <span className={`relative z-[1] block font-bold text-kc-ink ${large ? "text-lg sm:text-xl" : "text-base"}`}>
        {title}
      </span>
      {hint ? <span className="relative z-[1] mt-1 block text-sm text-kc-muted">{hint}</span> : null}
      <span className="kc-choice-arrow" aria-hidden>↗</span>
    </motion.button>
  );
}

export function StepPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      key={title}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6"
    >
      <h2 className="kc-step-title text-2xl sm:text-3xl">
        <span className="kc-step-mark mr-2 inline-block" aria-hidden>
          ✦
        </span>
        {title}
      </h2>
      {subtitle ? <p className="kc-step-subtitle mt-2 max-w-reading text-sm sm:text-base">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
