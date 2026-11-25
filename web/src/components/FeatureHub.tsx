"use client";

import { motion, useReducedMotion } from "motion/react";

export type FeatureHubItem = {
  id: string;
  index: string;
  monogram: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  action: string;
  actionEn?: string;
  variant: "light" | "dark" | "mint" | "purple";
  onClick?: () => void;
  href?: string;
};

export function FeatureHub({
  features,
}: {
  features: FeatureHubItem[];
}) {
  const reduce = useReducedMotion();

  return (
    <motion.main
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -12 }}
      aria-label="AI Tools"
      className="kc-hub mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10"
    >
      <p className="kc-translate-note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h8M8 3v2M10.5 5c-.6 3.6-2.8 6.4-6.5 8M6 8.5c1 1.8 2.6 3.2 4.6 4"/><path d="m12.5 21 4-9 4 9M14 18h5"/></svg>
        <span>請不要使用 Google 或其他瀏覽器的網頁翻譯，可能會讓功能失效或文字顯示錯誤。我們已經在各功能裡加入中文 / EN 切換。<span lang="en">Please don’t use Google Translate or any other browser translation. It can break features and garble text. We’ve added a 中文 / EN switch to each tool.</span></span>
      </p>
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
  titleEn,
  description,
  descriptionEn,
  action,
  actionEn,
  onClick,
  href,
  reduce,
  variant,
}: {
  index: string;
  monogram: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  action: string;
  actionEn?: string;
  onClick?: () => void;
  href?: string;
  reduce: boolean;
  variant: FeatureHubItem["variant"];
}) {
  const content = <>
      <span className="kc-feature-spot" aria-hidden />
      <span className="kc-feature-topline">
        <span>{index}</span>
      </span>
      <span className="kc-feature-monogram" aria-hidden>{monogram}</span>
      <span className="kc-feature-copy">
        <strong>{title}</strong>
        {titleEn && titleEn !== title && <em className="kc-feature-en" lang="en">{titleEn}</em>}
        {description && <span>{description}{descriptionEn && <small className="kc-feature-desc-en" lang="en">{descriptionEn}</small>}</span>}
      </span>
      <span className="kc-feature-action">
        {action}{actionEn && <small className="kc-feature-action-en" lang="en">{actionEn}</small>}
        <span aria-hidden>↗</span>
      </span>
  </>;
  const feedback = {
    whileHover: reduce ? undefined : { y: -4 },
    whileTap: reduce ? undefined : { scale: 0.985 },
    className: `kc-feature-card kc-feature-${variant}`,
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
  };
  return href
    ? <motion.a href={href} {...feedback}>{content}</motion.a>
    : <motion.button type="button" onClick={onClick} {...feedback}>{content}</motion.button>;
}
