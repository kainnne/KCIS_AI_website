"use client";
import { KcisAssistant } from './KcisAssistant';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SiteHeader } from './SiteHeader';
import { useI18n } from '@/lib/i18n';
import { useSchoolSession } from '@/lib/shared-auth';
import { SERIES, VIDEOS, type SeriesId, type VideoLesson, type VideoVersion } from '@/data/kcisVideos';
import styles from './VideoTutorials.module.css';

type Lang = 'zh' | 'en';
type Filter = 'all' | SeriesId;

const duration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const thumb = (id: string, size: 'hq' | 'maxres' = 'hq') => `https://i.ytimg.com/vi/${id}/${size}default.jpg`;
const pick = (v: VideoLesson, lang: Lang): [VideoVersion, Lang] =>
  lang === 'en' ? (v.en ? [v.en, 'en'] : [v.zh!, 'zh']) : (v.zh ? [v.zh, 'zh'] : [v.en!, 'en']);
// Some lessons exist only in Chinese on purpose (for staff who work in Chinese). The English interface says so plainly.
const versionNote = (videoLang: Lang, uiLang: Lang) => uiLang === 'en' && videoLang === 'zh' ? 'No English version' : videoLang === 'en' ? 'English' : '中文';

export function VideoTutorials() {
  const { locale, t } = useI18n();
  const { session, ready, error, refresh } = useSchoolSession();
  const text = (en: string, zh: string) => locale === 'en' ? en : zh;

  return <div className="kc-shell">
    <SiteHeader />
    <KcisAssistant feature="videos" />
    <main className={styles.page} aria-busy={!ready}>
      {!ready || error || !session ? <div className={styles.gate}>
        <h1 className={styles.title}>{t.hub.videos.title}</h1>
        {!ready ? <p role="status">{text('Checking account…', '確認登入中…')}</p>
          : error ? <div role="alert">
            <p>{text('Unable to connect. Please try again.', '暫時無法連線，請再試一次。')}</p>
            <button className={styles.primary} onClick={() => { void refresh().catch(() => {}); }}>{text('Retry', '重試')}</button>
          </div>
          : <>
            <p>{text('Sign in with your school account to watch.', '登入學校帳號後觀看。')}</p>
            <button className={styles.primary} onClick={() => window.dispatchEvent(new Event('kcis:open-signin'))}>{text('Sign in', '登入')}</button>
          </>}
      </div> : <Library />}
    </main>
  </div>;
}

function Library() {
  const { locale, t } = useI18n();
  const uiLang: Lang = locale === 'en' ? 'en' : 'zh';
  const text = (en: string, zh: string) => uiLang === 'en' ? en : zh;
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [currentKey, setCurrentKey] = useState(VIDEOS[0].key);
  const [override, setOverride] = useState<Lang | null>(null);
  const [playing, setPlaying] = useState(false);
  const stage = useRef<HTMLElement>(null);

  useEffect(() => {
    const key = new URLSearchParams(location.search).get('v');
    if (key && VIDEOS.some(v => v.key === key)) setCurrentKey(key);
  }, []);
  useEffect(() => { setOverride(null); }, [locale]);

  const current = VIDEOS.find(v => v.key === currentKey) ?? VIDEOS[0];
  const [version, versionLang] = pick(current, override ?? uiLang);
  const seriesName = (id: SeriesId) => { const s = SERIES.find(x => x.id === id)!; return uiLang === 'en' ? s.en : s.zh; };
  const siblings = VIDEOS.filter(v => v.series === current.series);
  const position = siblings.findIndex(v => v.key === current.key);

  const select = useCallback((key: string, scroll = true) => {
    setCurrentKey(key);
    setOverride(null);
    setPlaying(true);
    const url = new URL(location.href);
    url.searchParams.set('v', key);
    history.replaceState(null, '', url);
    if (scroll && stage.current && stage.current.getBoundingClientRect().top < 0) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      stage.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERIES.filter(s => filter === 'all' || s.id === filter).map(s => ({
      series: s,
      items: VIDEOS.filter(v => v.series === s.id).filter(v => !q || [v.zh?.title, v.en?.title, v.number, s.zh, s.en]
        .some(x => x?.toLowerCase().includes(q))),
    })).filter(g => g.items.length);
  }, [filter, query]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const languageLabel = (lang: Lang) => lang === 'en' ? 'English' : '中文';
  const label = (v: VideoLesson) => v.number ? (v.series === 'ai' ? v.number : '#' + v.number) : null;

  return <>
    <div className={styles.heading}>
      <h1 className={styles.title}>{t.hub.videos.title}</h1>
    </div>

    <section ref={stage} className={styles.stage} aria-label={text('Player', '播放器')}>
      <div className={styles.screen}>
        {playing
          ? <iframe
              key={version.id}
              src={`https://www.youtube-nocookie.com/embed/${version.id}?autoplay=1&rel=0&playsinline=1&hl=${uiLang === 'en' ? 'en' : 'zh-TW'}`}
              title={version.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen />
          : <button type="button" className={styles.poster} onClick={() => setPlaying(true)} aria-label={text('Play: ', '播放：') + version.title}>
              <img src={thumb(version.id, 'maxres')} alt="" onError={e => { const img = e.currentTarget; if (!img.src.includes('/hqdefault')) img.src = thumb(version.id); }} />
              <span className={styles.play} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg>{text('Play', '播放')}</span>
            </button>}
      </div>
      <div className={styles.info}>
        <p className={styles.series}>{seriesName(current.series)}{label(current) && <span>{label(current)}</span>}</p>
        <h2 lang={versionLang === 'en' ? 'en' : 'zh-Hant'}>{version.title}</h2>
        <ul className={styles.meta}>
          <li>{duration(version.seconds)}</li>
          {current.level && <li>Level {current.level}</li>}
          {versionLang !== uiLang && <li>{versionNote(versionLang, uiLang)}</li>}
        </ul>
        {current.zh && current.en && <div className={styles.versions} role="group" aria-label={text('Video language', '影片語言')}>
          {(['zh', 'en'] as Lang[]).map(l => <button key={l} type="button" aria-pressed={versionLang === l}
            onClick={() => { setOverride(l); }}>{languageLabel(l)}</button>)}
        </div>}
        {siblings.length > 1 && <div className={styles.steps}>
          <button type="button" disabled={position <= 0} onClick={() => select(siblings[position - 1].key, false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>{text('Previous', '上一部')}
          </button>
          <span>{position + 1} / {siblings.length}</span>
          <button type="button" disabled={position >= siblings.length - 1} onClick={() => select(siblings[position + 1].key, false)}>
            {text('Next', '下一部')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>}
      </div>
    </section>

    <div className={styles.controls}>
      <div className={styles.filters} role="group" aria-label={text('Series', '系列')}>
        {([['all', text('All', '全部'), VIDEOS.length], ...SERIES.map(s => [s.id, seriesName(s.id), VIDEOS.filter(v => v.series === s.id).length])] as [Filter, string, number][])
          .map(([id, name, count]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {name}<span>{count}</span>
          </button>)}
      </div>
      <label className={styles.search}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={text('Search videos', '搜尋影片')} aria-label={text('Search videos', '搜尋影片')} />
      </label>
    </div>
    <p className={styles.srOnly} role="status" aria-live="polite">{text(`${total} videos`, `${total} 部影片`)}</p>

    {groups.length === 0 ? <div className={styles.empty}>
      <p>{text('No matching videos.', '沒有符合的影片。')}</p>
      <button type="button" onClick={() => { setQuery(''); setFilter('all'); }}>{text('Show all', '顯示全部')}</button>
    </div> : groups.map(({ series, items }) => <section key={series.id} className={styles.group} aria-labelledby={'series-' + series.id}>
      <h2 id={'series-' + series.id}>{seriesName(series.id)}<span>{items.length}</span></h2>
      <ol className={styles.grid}>
        {items.map(v => {
          const [ver, lang] = pick(v, uiLang);
          const active = v.key === current.key;
          return <li key={v.key}>
            <button type="button" className={styles.card} aria-current={active ? 'true' : undefined} onClick={() => select(v.key)}>
              <span className={styles.thumb}>
                <img src={thumb(ver.id)} alt="" loading="lazy" />
                <span className={styles.time}>{duration(ver.seconds)}</span>
                {active && playing && <span className={styles.now}>{text('Now playing', '播放中')}</span>}
              </span>
              <span className={styles.cardText}>
                {(label(v) || v.level || lang !== uiLang) && <span className={styles.cardMeta}>
                  {label(v) && <b>{label(v)}</b>}
                  {v.level && <span>Level {v.level}</span>}
                  {lang !== uiLang && <span>{versionNote(lang, uiLang)}</span>}
                </span>}
                <span className={styles.cardTitle} lang={lang === 'en' ? 'en' : 'zh-Hant'}>{ver.title}</span>
              </span>
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </>;
}
