import type { Metadata } from 'next';
import { Forum } from '@/components/Forum';

export const metadata: Metadata = {
  title: 'AI 論壇 · AI Forum',
  description: 'AI questions and articles for KCIS staff and students.',
  robots: { index: false, follow: false },
};

export default function ForumPage() { return <Forum />; }
