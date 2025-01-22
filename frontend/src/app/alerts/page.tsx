'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AlertManager from '@/components/AlertManager';
import DashboardLayout from '@/components/DashboardLayout';

export default function AlertsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin?callbackUrl=/alerts');
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Risk Alerts
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Configure and manage your portfolio risk alerts. Get notified when your risk metrics
              exceed specified thresholds.
            </p>
          </div>

          <AlertManager />
        </div>
      </div>
    </DashboardLayout>
  );
}