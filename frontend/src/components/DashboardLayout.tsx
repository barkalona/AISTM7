import { FC, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Loading from './Loading';
import { useNotifications } from '../providers/NotificationProvider';
import { ThemeToggle } from '../providers/ThemeProvider';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  loading?: boolean;
  actions?: ReactNode;
  sidebar?: ReactNode;
}

const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  loading = false,
  actions,
  sidebar
}) => {
  const { connected } = useWallet();
  const router = useRouter();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!connected) {
      addNotification({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please connect your wallet to access this page.',
        userId: 'system'
      });
      router.push('/');
    }
  }, [connected, router, addNotification]);

  if (!connected) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-800 min-h-screen">
            <div className="fixed w-64 h-full overflow-y-auto bg-white dark:bg-gray-800 px-4 py-6">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Content Area */}
        <main className={`flex-1 ${sidebar ? 'lg:ml-64' : ''}`}>
          <div className="py-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  {actions}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="relative">
                {loading ? (
                  <div className="min-h-[400px]">
                    <LoadingOverlay show text="Loading data..." />
                  </div>
                ) : (
                  children
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Grid layout components for dashboard content
export const DashboardGrid: FC<{
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}> = ({ children, columns = 2 }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 xl:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {children}
    </div>
  );
};

export const DashboardCard: FC<{
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}> = ({ children, title, subtitle, actions, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const LoadingOverlay: FC<{ show: boolean; text?: string }> = ({
  show,
  text
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
      <Loading size="lg" text={text} />
    </div>
  );
};

export default DashboardLayout;