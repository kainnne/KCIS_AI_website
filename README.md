# 康橋 AI 應用導航

依身分與需求，快速找到合適的 AI／數位工具，並產生可複製的提示詞。

## 線上網站

**https://ai-tools.kcis.kainnne.com/**

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

- 公開站：GitHub Actions → GitHub Pages（`web/` 靜態匯出，自訂網域從 `/` 提供服務）
- 自訂網域：`ai-tools.kcis.kainnne.com`（DNS CNAME 指向 `kainnne.github.io`）
- 若未來需要部署到子路徑，可在建置時設定 `NEXT_PUBLIC_BASE_PATH`
