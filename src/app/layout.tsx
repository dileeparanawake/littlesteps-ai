import type { Metadata } from 'next';

import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

import './globals.css';

import ModalProvider from '@/components/providers/ModalProvider';
import Header from '@/components/layout/Header';

const baseUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'https://littlesteps-ai.com';

export const metadata: Metadata = {
  title: 'LittleSteps AI',
  description:
    'AI guidance for new parents - milestone and development support for the early years',
  icons: {
    icon: '/littlesteps_favicon.png',
  },
  openGraph: {
    title: 'LittleSteps AI',
    description:
      'AI guidance for new parents - milestone and development support for the early years',
    url: baseUrl,
    siteName: 'LittleSteps AI',
    images: [
      {
        url: `${baseUrl}/og`,
        width: 1200,
        height: 630,
        alt: 'LittleSteps AI - Guidance for new parents',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LittleSteps AI',
    description:
      'AI guidance for new parents - milestone and development support for the early years',
    images: [`${baseUrl}/og`],
  },
  other: {
    'og:logo': `${baseUrl}/littlesteps_favicon.png`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        <ReactQueryProvider>
          <ModalProvider>
            <Header />
            <div className="h-[calc(100vh-73px)] overflow-hidden">
              {children}
            </div>
          </ModalProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
