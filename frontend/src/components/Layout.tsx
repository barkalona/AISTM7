import { WalletButton } from './WalletButton';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <div className={styles.logo}>
                        AISTM7
                    </div>
                    <WalletButton />
                </nav>
            </header>
            <main className={styles.main}>
                {children}
            </main>
            <footer className={styles.footer}>
                <p>© 2025 AISTM7. All rights reserved.</p>
            </footer>
        </div>
    );
}