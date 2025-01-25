import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AISTM7 - Blockchain Portfolio Analysis',
  description: 'Level up your trading game with AI-powered insights and real-time market analysis.',
  icons: {
    icon: '/images/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0a0b0f] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
