import { useWallet } from '@solana/wallet-adapter-react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.highlight}>AISTM7</span>
        </h1>
        <p className={styles.description}>
          AI-Powered Blockchain Portfolio Management System
        </p>
        {!connected && (
          <div className={styles.connectPrompt}>
            <p>Connect your wallet to get started</p>
            <div className={styles.arrow}>↑</div>
          </div>
        )}
        {connected && (
          <div className={styles.dashboard}>
            <h2>Your Portfolio</h2>
            <p>Connected successfully! Portfolio data loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}