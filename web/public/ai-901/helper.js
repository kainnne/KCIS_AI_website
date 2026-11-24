// AI-901 study assistant panel. Lives outside #main so it survives question re-renders.
// One conversation per question; the current question, the learner's answer and the reference explanation go along as context.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Small, safe markdown: code blocks, inline code, bold, bullet and numbered lists, paragraphs.
function render(md) {
  const blocks = String(md).split(/```[a-z]*\n?/);
  return blocks.map((part, i) => {
    if (i % 2) return `<pre><code>${esc(part.replace(/\n$/, ''))}</code></pre>`;
    return part.split(/\n{2,}/).map(p => {
      const lines = p.split('\n').filter(l => l.trim());
      if (!lines.length) return '';
      const inline = l => esc(l).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      if (lines.every(l => /^\s*[-*•]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('')}</ul>`;
      if (lines.every(l => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map(l => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    }).join('');
  }).join('');
}

const ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><path d="M9 9.5h6M9 12.5h3.5"/></svg>';
const ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

export function mountHelper({apiBase, token, context, lang, t}) {
  if (!apiBase) return {show() {}, hide() {}, question() {}};
  const threads = new Map();
  let current = null, busy = false, open = false;
  const root = document.createElement('div');
  root.className = 'helper';
  root.hidden = true;
  root.innerHTML = `<button type="button" class="helper-fab" aria-expanded="false" aria-controls="helper-panel">${ICON_CHAT}<span></span></button>
<section id="helper-panel" class="helper-panel" role="dialog" aria-modal="false" aria-labelledby="helper-title" hidden>
  <header class="helper-head"><div><p class="helper-eyebrow">AI-901</p><h2 id="helper-title"></h2></div><button type="button" class="helper-close">${ICON_CLOSE}</button></header>
  <div class="helper-log" aria-live="polite"></div>
  <div class="helper-chips"></div>
  <form class="helper-form"><label class="sr-only" for="helper-input"></label><textarea id="helper-input" rows="1" maxlength="1500"></textarea><button type="submit" class="helper-send">${ICON_SEND}</button></form>
  <p class="helper-note"></p>
</section>`;
  document.body.append(root);
  const fab = root.querySelector('.helper-fab'), panel = root.querySelector('.helper-panel'), log = root.querySelector('.helper-log'),
    chips = root.querySelector('.helper-chips'), form = root.querySelector('form'), input = root.querySelector('textarea'), send = root.querySelector('.helper-send');

  function labels() {
    fab.querySelector('span').textContent = t('helper');
    fab.setAttribute('aria-label', t('helperOpen'));
    root.querySelector('#helper-title').textContent = t('helperTitle');
    root.querySelector('.helper-close').setAttribute('aria-label', t('helperClose'));
    root.querySelector('label').textContent = t('helperAsk');
    input.placeholder = t('helperAsk');
    send.setAttribute('aria-label', t('helperSend'));
    root.querySelector('.helper-note').textContent = t('helperNote');
    chips.innerHTML = t('helperChips').map(c => `<button type="button" class="helper-chip">${esc(c)}</button>`).join('');
  }
  function draw() {
    const thread = threads.get(current) ?? [];
    log.innerHTML = thread.length ? thread.map(m => `<div class="helper-msg ${m.role}${m.error ? ' error' : ''}">${m.role === 'assistant' ? render(m.content || '…') : `<p>${esc(m.content)}</p>`}${m.trace ? `<span class="helper-trace">${esc(t('helperTrace'))} ${esc(m.trace)}</span>` : ''}</div>`).join('') + (busy && thread.at(-1)?.role === 'user' ? `<div class="helper-msg assistant typing"><span></span><span></span><span></span></div>` : '')
      : `<p class="helper-empty">${esc(t('helperEmpty'))}</p>`;
    chips.hidden = thread.length > 0;
    log.scrollTop = log.scrollHeight;
    send.disabled = busy;
  }
  function setOpen(value) {
    open = value; panel.hidden = !open; fab.setAttribute('aria-expanded', String(open)); root.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('helper-open', open);
    if (open) { draw(); setTimeout(() => input.focus({preventScroll: true}), 60); }
  }
  async function ask(text) {
    text = text.trim();
    if (!text || busy || !current) return;
    const thread = threads.get(current) ?? [];
    thread.push({role: 'user', content: text}); threads.set(current, thread);
    busy = true; input.value = ''; input.style.height = 'auto'; draw();
    const q = current, reply = {role: 'assistant', content: ''};
    try {
      const response = await fetch(`${apiBase}/api/assistant`, {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token: token() ?? undefined, questionId: q, site: location.hostname, lang: lang(), turn: thread.filter(m => m.role === 'user').length, context: context(),
          messages: thread.filter(m => !m.error).slice(-8).map(({role, content}) => ({role, content}))})});
      if (!response.ok || !(response.headers.get('Content-Type') || '').includes('event-stream')) {
        const data = await response.json().catch(() => ({}));
        throw Object.assign(new Error(data.error || 'network'), {trace: data.trace});
      }
      thread.push(reply); busy = false;
      const reader = response.body.getReader(), dec = new TextDecoder(); let buffer = '', status = 'ok';
      for (;;) {
        const {value, done} = await reader.read(); if (done) break;
        buffer += dec.decode(value, {stream: true}); let i;
        while ((i = buffer.indexOf('\n\n')) >= 0) {
          const line = buffer.slice(0, i).replace(/^data: /, ''); buffer = buffer.slice(i + 2);
          let ev; try { ev = JSON.parse(line); } catch { continue; }
          if (ev.type === 'start') reply.trace = ev.trace;
          else if (ev.type === 'delta') { reply.content += ev.text; if (current === q) draw(); }
          else if (ev.type === 'done') status = ev.status;
        }
      }
      if (!reply.content) { reply.content = t(status === 'ok' ? 'helperEmptyAnswer' : 'helperError'); reply.error = status !== 'ok'; }
    } catch (err) {
      const key = {paused: 'helperPaused', blocked: 'helperBlocked', rate_limited: 'helperLimit', daily_cap: 'helperCap', person_cap: 'helperPersonCap', thread_limit: 'helperThread', assistant_unavailable: 'helperOff'}[err.message] ?? 'helperError';
      if (!thread.includes(reply)) thread.push(reply);
      reply.content = t(key); reply.error = true; reply.trace ??= err.trace;
    } finally {
      busy = false; if (current === q) draw();
    }
  }
  fab.addEventListener('click', () => setOpen(!open));
  root.querySelector('.helper-close').addEventListener('click', () => { setOpen(false); fab.focus(); });
  chips.addEventListener('click', e => { const b = e.target.closest('.helper-chip'); if (b) ask(b.textContent); });
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); });
  labels();
  return {
    show() { root.hidden = false; labels(); if (open) draw(); },
    hide() { root.hidden = true; if (open) setOpen(false); },
    question(id) { current = id; if (open) draw(); },
  };
}
