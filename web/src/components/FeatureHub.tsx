"use client";

import { motion, useReducedMotion } from "motion/react";

export type FeatureHubItem = {
  id: string;
  index: string;
  monogram: string;
  title: string;
  description: string;
  audience: string;
  action: string;
  variant: "light" | "dark" | "mint";
  onClick: () => void;
};

export function FeatureHub({
  eyebrow,
  title,
  subtitle,
  features,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  features: FeatureHubItem[];
}) {
  const reduce = useReducedMotion();

  return (
    <motion.main
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -12 }}
      className="kc-hub mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10"
    >
      <div className="kc-hub-heading">
        <p className="kc-eyebrow">
          <span />
          {eyebrow}
        </p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="kc-feature-grid">
        {features.map((feature) => (
          <FeatureCard key={feature.id} {...feature} reduce={Boolean(reduce)} />
        ))}
      </div>
    </motion.main>
  );
}

function FeatureCard({
  index,
  monogram,
  title,
  description,
  audience,
  action,
  onClick,
  reduce,
  variant,
}: {
  index: string;
  monogram: string;
  title: string;
  description: string;
  audience: string;
  action: string;
  onClick: () => void;
  reduce: boolean;
  variant: FeatureHubItem["variant"];
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -10, scale: 1.012 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className={`kc-feature-card kc-feature-${variant}`}
    >
      <span className="kc-feature-glow" aria-hidden />
      <span className="kc-feature-topline">
        <span>{index}</span>
        <span>{audience}</span>
      </span>
      <span className="kc-feature-monogram" aria-hidden>{monogram}</span>
      <span className="kc-feature-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="kc-feature-action">
        {action}
        <span aria-hidden>↗</span>
      </span>
    </motion.button>
  );
}
