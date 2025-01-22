import './globals.css';
import Providers from '@/providers/Providers';

export const metadata = {
  title: 'AISTM7 - AI-Powered Risk Analysis',
  description: 'Advanced risk analysis and portfolio management powered by AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
