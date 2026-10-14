import type { Metadata } from 'next';
import { VideoTutorials } from '@/components/VideoTutorials';

export const metadata: Metadata = {
  title: 'KCIS AI Video Tutorials',
  robots: { index: false, follow: false },
};

export default function VideosPage() { return <VideoTutorials />; }
