import type { Metadata } from 'next';
import { Forum } from '@/components/Forum';

export const metadata: Metadata = {
  title: '康橋 AI 論壇',
  description: '康橋教師 AI 使用問答與討論。',
  robots: { index: false, follow: false },
};

export default function ForumPage() { return <Forum />; }
