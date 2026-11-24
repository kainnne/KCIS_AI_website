import type { Metadata } from 'next';
import { VideoTutorials } from '@/components/VideoTutorials';

export const metadata: Metadata = {
  title: 'AI 影片教學 · AI Video Tutorials',
  robots: { index: false, follow: false },
};

export default function VideosPage() { return <VideoTutorials />; }
