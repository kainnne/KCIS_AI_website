# 康橋 AI Tools

康橋校園使用的 AI 功能入口。目前包含：

- AI 工具導航：依身分與需求找到合適的 AI／數位工具。
- Kuse Prompt Builder：以角色、任務、材料與規格產生可直接複製到 Kuse 的結構化 Prompt。

首頁功能卡採資料驅動的自適應網格，後續可持續加入第三個以上的子功能。

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
