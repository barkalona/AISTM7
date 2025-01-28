import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styles from '../styles/WalletButton.module.css';

export function WalletButton() {
    const { wallet } = useWallet();

    return (
        <div className={styles.walletWrapper}>
            <WalletMultiButton className={styles.walletButton} />
        </div>
    );
}