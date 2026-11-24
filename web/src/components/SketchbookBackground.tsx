"use client";

import { useEffect, useRef } from "react";

/** Campus sketchbook background (shared with kcis.kainnne.com, "tools" arrangement). Loads after first paint. */
export function SketchbookBackground({ quiet = false }: { quiet?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || canvas.dataset.mounted) return;
    canvas.dataset.mounted = "1";
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    import(/* webpackIgnore: true */ `${base}/sketchbook/sketchbook.js?v=4`)
      .then((m: { mount: (c: HTMLCanvasElement, o: { variant: string }) => unknown }) => m.mount(canvas, { variant: "tools" }))
      .catch(() => { /* the paper colour stays */ });
  }, []);

  return (
    <>
      <div className="kc-paper" aria-hidden />
      <canvas ref={ref} className="kc-sketch" data-quiet={quiet ? "true" : "false"} aria-hidden />
    </>
  );
}
