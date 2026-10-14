"use client";

import { SiteHeader } from './SiteHeader';
import { useI18n } from '@/lib/i18n';
import { useSchoolSession } from '@/lib/shared-auth';
import styles from './VideoTutorials.module.css';

export function VideoTutorials() {
  const { locale, t } = useI18n();
  const { session, ready, error, refresh } = useSchoolSession();
  const text = (en: string, zh: string) => locale === 'en' ? en : zh;

  return <div className="kc-shell">
    <SiteHeader />
    <main className={styles.main} aria-busy={!ready}>
      <h1>{t.hub.videos.title}</h1>
      {!ready ? <p role="status">{text('Checking account…', '確認登入中…')}</p>
        : error ? <div role="alert">
          <p>{text('Unable to connect. Please try again.', '暫時無法連線，請再試一次。')}</p>
          <button className={styles.button} onClick={() => { void refresh().catch(() => {}); }}>{text('Retry', '重試')}</button>
        </div>
        : !session ? <button className={styles.button} onClick={() => window.dispatchEvent(new Event('kcis:open-signin'))}>{text('Sign in', '登入')}</button>
        : <p role="status">{text('No videos yet.', '尚無影片。')}</p>}
    </main>
  </div>;
}
