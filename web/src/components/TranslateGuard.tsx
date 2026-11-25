"use client";
import { useEffect, useState } from "react";

// Google Translate rewrites the page and breaks buttons and text. If someone turns it on anyway, say so plainly.
export function TranslateGuard() {
  const [on, setOn] = useState(false), [closed, setClosed] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setOn(/translated-(ltr|rtl)/.test(html.className));
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    check();
    return () => observer.disconnect();
  }, []);
  if (!on || closed) return null;
  return (
    <div className="kc-translate-alert notranslate" translate="no" role="status">
      <p>偵測到網頁翻譯，部分功能和文字可能出錯，建議關閉翻譯，改用網站的 中文 / English 切換。<br />Page translation is on. Some features and text may break; please turn it off and use the site’s 中文 / English switch.</p>
      <button type="button" aria-label="Close" onClick={() => setClosed(true)}>×</button>
    </div>
  );
}
