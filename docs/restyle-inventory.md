# 粉紫玻璃改版：頁面與狀態清單（2026-11-24）

依 `docs/DESIGN-RULES.md` 改外觀。文字、功能、流程、資料、API、登入不變。
「看得到」＝本機建置後實際截圖；「讀碼」＝只能讀程式與樣式確認（真實環境才會出現）。

## 共用元件（每頁都有）

| 元件 | 狀態 | 檢查方式 |
|---|---|---|
| `SiteHeader` + `SharedHeader.css` | 預設、捲動後、hover／按下、focus | 看得到 |
| 選單（`kc-shared-nav-panel`） | 未登入、確認中（disabled）、已登入（姓名＋部門、登出）、教職員（上傳文件／我的文件）、有 `onManage`（管理）、語言切換 EN／中文 | 看得到（mock 登入服務） |
| `SchoolLogin` + `SchoolAccount.css` | 登入對話框：信箱步驟、驗證碼步驟（含「Resend / change email」）、送出中（busy 文字、disabled）、錯誤訊息；帳號對話框（姓名、部門、儲存、登出）；登出確認；右下角通知（Signed in／Signed out／Account updated／連線錯誤） | 看得到（mock）；busy 為讀碼 |
| `kc-account-button`（無 renderTrigger 時的獨立按鈕） | 確認中、未登入、已登入 | 讀碼（目前工具頁用到） |
| 背景 | 首頁手繪本；工具流程中手繪本淡到 30%；其他內頁紙底 | 看得到 |
| 頁尾 `kc-site-footer` | 文字連結 hover | 看得到 |
| 焦點 | 所有按鈕、連結、輸入框的 focus-visible | 看得到（鍵盤） |
| 減少動態 | `prefers-reduced-motion` | 讀碼 |

## 頁面 × 狀態

### `/` 首頁（`NavigatorApp`）
| 模式／步驟 | 狀態 |
|---|---|
| hub（`FeatureHub`） | 已核可，不改版面 |
| 工具導航 welcome（`InteractiveHero`） | 進場動畫、CTA hover／按下、標籤 |
| role | 三張 `OptionCard`、選中、hover、返回 |
| level（教師／學生） | 選項卡、選中 |
| department（行政） | 選項卡 |
| task | 選項卡（小卡） |
| keywords | `kc-chip` 一般／選中、只看免費 checkbox、返回／下一步 |
| details | textarea（focus）、`task=other` 時下一步 disabled |
| results 載入中／載入失敗 | `role=status` 文字 |
| results（`ResultsPanel`） | 摘要卡、星等說明、低相關提示、核心推薦卡（`kc-core-card`）、低相關卡（`kc-low-relevance-card`）、無官方網址、0 筆結果、prompt studio（chip、textarea、產生／複製／已複製）、啟動連結（Kuse 深色玻璃、ChatGPT、Gemini） |
| `ProgressBar` | 步驟 n / N、百分比 |
| 動態載入中 `FeatureLoading` | 載入中文字 |

### `/` Kuse Prompt Builder（`KusePromptBuilder`）
| 步驟 | 狀態 |
|---|---|
| role | 兩張選項卡、返回全部工具 |
| task | 預設任務 `kc-task-preset` 一般／選中、任務 textarea、下一步 disabled（空白時） |
| materials | 來源 chip、選「沒有素材」時的提示 `kc-no-material-note`、素材 textarea |
| specs | 兩個 input、網站任務的 `kc-website-specs`（MVP／完整兩張 scope 卡、選中）、進階選項 details（開／關、chip 群組、textarea） |
| result | eyebrow＋標題、重新開始、摘要四格、模型建議（主推卡、替代卡、訊號標籤、說明、比較 details 與目前最佳標籤）、Prompt 學習 details（快速／詳細切換、編號清單、轉移框）、結果 textarea、返回／複製／已複製、開啟 Kuse 主按鈕 |

### `/tools/[slug]/`（39 個工具，含 deprecated）
| 狀態 |
|---|
| 返回導航（次要按鈕）、`SchoolLogin` 獨立按鈕、狀態 eyebrow、標題、難度星等、說明中英、建置中提示框、隱私說明、官方網站主按鈕／「官方網址待確認」、Education page 次要按鈕 |

### `/forum/`（`Forum` + `ForumAdmin` + `Forum.module.css`）
| 狀態 | 檢查方式 |
|---|---|
| Checking account…（session 未就緒） | 看得到（短暫） |
| 未登入入口卡（AI Forum + Sign in） | 看得到 |
| 錯誤列（alert + Reload） | 看得到（mock 500 / API 失敗） |
| 問題列表：分頁 tab（Questions／AI articles）、篩選 tab（All／My questions）、載入中、無法載入、無問題（空狀態 icon）、問題列（標題兩行截斷、作者、部門、時間、已解決、回覆數、箭頭） | 看得到（mock） |
| 提問 composer（textarea、字數、取消、發布 disabled） | 看得到 |
| 問題詳情：返回所有問題、作者列、已解決標籤、標註已解決／更新解決紀錄、本文、編輯（自己的）、編輯器（取消／儲存）、解決紀錄表單（三個 textarea、改為未解決）、解決紀錄區塊、回覆列表、尚無回覆、更多回覆、回覆 composer | 看得到（mock）；編輯器、解決表單為讀碼＋按得到時看 |
| AI 文章：分享文章（教職員）、文章表單（標題 input、內容 textarea、字數、取消、發布）、文章卡（標題、作者、摘要、閱讀全文 details、管理員刪除）、尚無文章、分頁 | 看得到（mock） |
| 管理（`ForumAdmin`）：標題＋返回論壇、備份狀態、文章管理列、錯誤列、刪除確認 alertdialog、版本紀錄、管理詳情、未刪除／已刪除 tab、危險按鈕、分頁 | 看得到（mock）；確認框、版本紀錄為讀碼 |
| `window.confirm` 捨棄確認 | 瀏覽器原生，無法改樣式 |

### `/videos/`（`VideoTutorials` + module css）
| 狀態 | 檢查方式 |
|---|---|
| 確認登入中 | 看得到（短暫） |
| 連線錯誤 + 重試 | 看得到（mock 500） |
| 未登入 + 登入 | 看得到 |
| 影片庫：播放器海報＋播放鍵、iframe 播放中、系列與編號、標題、時長／Level／語言標籤、影片語言切換、上一部／下一部（disabled）、系列篩選（含數量）、搜尋框、分組標題、影片卡（目前／播放中標記、時長）、沒有符合的影片＋顯示全部 | 看得到（iframe 內為 YouTube） |

### `/ai-901/`（`public/ai-901/` 靜態頁）
與 test.kainnne.com 的 AI-901 練習共用，已是粉紫玻璃；本輪不改（不在 Next 元件內）。

## 不使用／待清除
- `DecorBackground`（藍色光球）→ 改為紙底。
- `InteractiveField`（粒子）：沒有任何頁面引用。
- `kc-signin`、`kc-login-dialog`、`kc-auth-*`、`kc-language-switch`、`kc-brand-home`、`kc-site-header`、`kc-hero-*` 掃描／格線：舊樣式，改為玻璃或移除。
