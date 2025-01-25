"use client";

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import DashboardLayout, { DashboardGrid, DashboardCard } from '../../components/DashboardLayout';
import { LoadingButton } from '../../components/Loading';
import { useNotifications } from '../../providers/NotificationProvider';
import { useTheme } from '../../providers/ThemeProvider';

interface IBKRCredentials {
  username: string;
  isConnected: boolean;
  lastSync: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  riskAlerts: boolean;
  tradeNotifications: boolean;
  portfolioUpdates: boolean;
  marketAlerts: boolean;
}

const SettingsPage = () => {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [ibkrLoading, setIbkrLoading] = useState(false);
  const [credentials, setCredentials] = useState<IBKRCredentials>({
    username: 'user@example.com',
    isConnected: true,
    lastSync: new Date().toISOString()
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    riskAlerts: true,
    tradeNotifications: true,
    portfolioUpdates: false,
    marketAlerts: true
  });

  const handleIBKRDisconnect = async () => {
    try {
      setIbkrLoading(true);
      // API call to disconnect IBKR account
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      setCredentials(prev => ({
        ...prev,
        isConnected: false
      }));
      
      addNotification({
        type: 'success',
        title: 'IBKR Disconnected',
        message: 'Your IBKR account has been disconnected successfully',
        userId: 'system'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Disconnection Failed',
        message: 'Failed to disconnect IBKR account. Please try again.',
        userId: 'system'
      });
    } finally {
      setIbkrLoading(false);
    }
  };

  const handleNotificationChange = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your settings have been updated successfully',
        userId: 'system'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save settings. Please try again.',
        userId: 'system'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account settings and preferences"
      loading={loading}
    >
      <DashboardGrid columns={2}>
        {/* IBKR Integration */}
        <DashboardCard title="IBKR Integration">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Connected Account
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {credentials.username}
                </p>
              </div>
              <LoadingButton
                loading={ibkrLoading}
                onClick={handleIBKRDisconnect}
                variant="outline"
                size="sm"
              >
                Disconnect
              </LoadingButton>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last Synchronized: {new Date(credentials.lastSync).toLocaleString()}
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your IBKR account is used to fetch real-time portfolio data and execute trades.
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Appearance */}
        <DashboardCard title="Appearance">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Theme
              </label>
              <div className="mt-2 space-y-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <label
                    key={t}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={t}
                      checked={theme === t}
                      onChange={() => setTheme(t)}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {t}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Notifications */}
        <DashboardCard
          title="Notifications"
          className="col-span-2"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Notification Channels
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email}
                      onChange={() => handleNotificationChange('email')}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Email Notifications
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push}
                      onChange={() => handleNotificationChange('push')}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Push Notifications
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Notification Types
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.riskAlerts}
                      onChange={() => handleNotificationChange('riskAlerts')}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Risk Alerts
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.tradeNotifications}
                      onChange={() => handleNotificationChange('tradeNotifications')}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Trade Notifications
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.portfolioUpdates}
                      onChange={() => handleNotificationChange('portfolioUpdates')}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Portfolio Updates
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketAlerts}
                      onChange={() => handleNotificationChange('marketAlerts')}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Market Alerts
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <LoadingButton
                loading={loading}
                onClick={handleSaveSettings}
                variant="primary"
              >
                Save Settings
              </LoadingButton>
            </div>
          </div>
        </DashboardCard>
      </DashboardGrid>
    </DashboardLayout>
  );
};

export default SettingsPage;