import type { Metadata } from 'next';

import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

import './globals.css';

import ModalProvider from '@/components/providers/ModalProvider';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'LittleSteps AI',
  description: 'AI child development assistant',
  icons: {
    icon: '/littlesteps_favicon.png',
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
