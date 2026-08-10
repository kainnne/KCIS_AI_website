# 康橋 AI 應用導航

依身分與需求，快速找到合適的 AI／數位工具，並產生可複製的提示詞。

## 線上網站

**https://kainnne.github.io/KCIS_AI_website/**

## 本機執行

```bash
cd web
npm install
npm run dev
```

開啟 http://127.0.0.1:3000

## 文件

技術說明（資料來源、推薦邏輯、製作方法）見：[`AGENT_TECHNICAL_DESIGN_LOG.md`](./AGENT_TECHNICAL_DESIGN_LOG.md)

## 部署備註

- 公開站：GitHub Actions → GitHub Pages（`web/` 靜態匯出，`GITHUB_PAGES=true` 時使用 `basePath: /KCIS_AI_website`）
- 若改接 Vercel：Root Directory 設 `web`，且**不要**設 `GITHUB_PAGES=true`（即可無 basePath）
