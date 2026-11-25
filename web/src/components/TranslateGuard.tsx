"use client";
import { useEffect, useState } from "react";

// Browser translation (Google, Edge and others) rewrites the page and breaks buttons and text. If someone turns it on anyway, say so plainly.
// Chrome marks <html> with translated-ltr|rtl, Edge marks text with _msttexthash, most translators wrap text in <font style="vertical-align: inherit">.
export function TranslateGuard() {
  const [on, setOn] = useState(false), [closed, setClosed] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setOn(/translated-(ltr|rtl)/.test(html.className) || !!document.querySelector('[_msttexthash], font[style*="vertical-align: inherit"]'));
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    const timer = setInterval(check, 3000);
    check();
    return () => { observer.disconnect(); clearInterval(timer); };
  }, []);
  if (!on || closed) return null;
  return (
    <div className="kc-translate-alert notranslate" translate="no" role="status">
      <p>偵測到網頁翻譯，部分功能和文字可能會出錯。建議關閉翻譯，改用網站的中文 / EN 切換。<br />Page translation is on. Some features and text may break. Please turn it off and use the site’s 中文 / EN switch.</p>
      <button type="button" aria-label="Close" onClick={() => setClosed(true)}>×</button>
    </div>
  );
}
