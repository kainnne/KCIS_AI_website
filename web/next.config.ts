import type { NextConfig } from "next";

/** GitHub Pages: https://kainnne.github.io/KCIS_AI_website/ */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/KCIS_AI_website" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
