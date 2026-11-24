import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kc: {
          ink: "#2e0f38",
          muted: "#5b3b66",
          faint: "#8d7395",
          paper: "#fbf2f6",
          rose: "#c8306b",
          violet: "#6a46c8",
          plum: "#7b2f8f",
          kcis: "#900080",
          teal: "#0098a0",
        },
      },
      maxWidth: {
        reading: "42rem",
      },
      boxShadow: {
        soft: "0 26px 80px rgba(200, 48, 107, 0.13)",
      },
    },
  },
  plugins: [],
} satisfies Config;
