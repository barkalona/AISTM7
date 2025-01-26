import type { AppProps } from 'next/app';
import { SolanaWalletProvider } from '../providers/WalletProvider';
import { Layout } from '../components/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SolanaWalletProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SolanaWalletProvider>
  );
}