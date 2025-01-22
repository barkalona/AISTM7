'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Header from './Header';
import { useNotifications } from '@/providers/NotificationProvider';
import WalletBalance from './WalletBalance';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Wallet Balance Section */}
          <div className="mb-6">
            <WalletBalance />
          </div>

          {/* Main Content */}
          <main>
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} AISTM7. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}