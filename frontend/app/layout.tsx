import './globals.css';
import Providers from '../src/providers/Providers';

export const metadata = {
  title: 'AISTM7 - AI-Powered Portfolio Analysis',
  description: 'Advanced portfolio analysis with AI and blockchain technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}