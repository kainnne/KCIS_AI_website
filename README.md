# 康橋 AI Tools

康橋校園使用的 AI 功能入口。目前包含：

- AI 工具導航：依身分與需求找到合適的 AI／數位工具。
- Kuse Prompt Builder：以角色、任務、材料與規格產生可直接複製到 Kuse 的結構化 Prompt。
- AI 論壇：中英文介面、提問與回覆、教職員文章分享、管理刪除／復原，以及文章版本留存與可設定的 Drive 備份。

- AI 影片教學：`/videos/`，沿用校內電子郵件驗證登入，目前尚無影片。之後嵌入 YouTube 教學影片；影片頁獨立載入，首頁不載入播放器。若影片需保密，影片清單也必須由驗證登入的後台提供，YouTube 不公開連結本身不等於校內存取限制。

首頁功能卡採資料驅動的自適應網格，後續可持續加入第三個以上的子功能。

## 可攜交接包

打包工具為 `scripts/package_handoff.py`；主管說明、Agent 交接指引及接入文件在 `scripts/handoff/templates/`。交接包使用獨立設定範本，不包含現有文章、憑證、原帳號資源 ID 或本機私人規則。Drive 備份需由接手者完成授權後才會啟動。

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
