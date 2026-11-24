import Link from "next/link";
import { notFound } from "next/navigation";
import { DecorBackground } from "@/components/DecorBackground";
import { SchoolLogin } from "@/components/SchoolLogin";
import { getAllToolsIncludingDeprecated, getToolBySlug } from "@/lib/tools";

export function generateStaticParams() {
  return getAllToolsIncludingDeprecated().map((tool) => ({ slug: tool.slug }));
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const descZh = tool.shortDescription["zh-TW"];
  const descEn = tool.shortDescription.en;

  return (
    <div className="kc-shell">
      <DecorBackground />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/" className="kc-btn-ghost">
          ← 回到導航 / Back
        </Link>
        <SchoolLogin /></div>

        <article className="kc-card kc-tool-card mt-6 p-6 sm:p-10">
          <p className="kc-eyebrow">
            {tool.pageStatus === "placeholder" ? "內容建置中 / Coming soon" : tool.pageStatus}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl">
            {tool.name}
          </h1>
          <p className="mt-2 text-sm text-kc-muted">
            這個 AI 工具好不好學：<span className="kc-stars">{"★".repeat(tool.difficultyStars)}
            {"☆".repeat(5 - tool.difficultyStars)}</span>（<span className="kc-num">{tool.difficultyStars}/5</span>，星星愈多愈需要學） ·{" "}
            {tool.freeStatus}
            {tool.status === "deprecated" ? " · deprecated" : ""}
            {tool.priorityCore ? " · 核心推薦" : ""}
          </p>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-kc-ink sm:text-base">
            <p>{descZh}</p>
            <p className="text-kc-muted">{descEn}</p>
          </div>

          <div className="kc-tool-note mt-6 text-sm">
            <p className="font-bold text-kc-plum">內容建置中</p>
            <p className="mt-1">
              此工具的詳細教學尚在整理，你仍可先參考簡介與官方網站。A fuller guide is still being
              written.
            </p>
          </div>

          {tool.privacyNotes?.[0] ? (
            <p className="mt-4 text-xs text-kc-faint">{tool.privacyNotes[0]["zh-TW"]}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-2">
            {tool.officialUrl ? (
              <a
                href={tool.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="kc-btn-primary"
              >
                前往官方網站
              </a>
            ) : (
              <span className="text-sm text-kc-muted">官方網址待確認</span>
            )}
            {tool.educationUrl ? (
              <a
                href={tool.educationUrl}
                target="_blank"
                rel="noreferrer"
                className="kc-btn-ghost"
              >
                Education page
              </a>
            ) : null}
          </div>
        </article>
      </main>
    </div>
  );
}
