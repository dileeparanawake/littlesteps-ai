import type { Metadata } from 'next';

import './globals.css';

import ModalProvider from '@/components/layout/ModalProvider';
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
      <body>
        <ModalProvider>
          <Header />
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
