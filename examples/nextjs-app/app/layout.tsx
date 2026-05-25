import type { Metadata } from 'next';
import { DevModePreview } from '@promise-inc/devmode-preview';

export const metadata: Metadata = {
  title: 'DevMode Preview · Next.js Example',
  description: 'Live in-app dev companion demo running on Next.js App Router.',
  openGraph: {
    title: 'DevMode Preview · Next.js Example',
    description: 'Live in-app dev companion demo running on Next.js App Router.',
    url: 'https://example.com',
    images: ['https://placehold.co/1200x630/0d0f10/b6f23d?text=DEVMODE+PREVIEW'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <DevModePreview />
      </body>
    </html>
  );
}
