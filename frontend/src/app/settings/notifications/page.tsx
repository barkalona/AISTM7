'use client';

import React, { useState } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import type { NotificationPreferences } from '../../../types/notifications';
import { toast } from 'react-toastify';
import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter as useNextRouter } from 'next/navigation';

const NotificationSettings: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useNextRouter();
  const { preferences, updatePreferences, loading, error } = useNotifications();
  const [formState, setFormState] = useState<NotificationPreferences>({
    email: false,
    push: false,
    inApp: true,
    email_enabled: false,
    sms_enabled: false,
    phone: '',
    riskAlerts: true,
    risk_alerts: true,
    anomaly_alerts: true,
    model_alerts: true,
    portfolio_summaries: true,
    tokenRequirements: true,
    systemUpdates: true,
    marketAlerts: true
  });

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Initialize form with current preferences
  React.useEffect(() => {
    if (preferences) {
      setFormState(preferences);
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences(formState);
      toast.success('Notification preferences updated successfully');
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
      toast.error('Failed to update notification preferences');
    }
  };

  const handleChange = (field: keyof NotificationPreferences, value: boolean | string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="p-4">Loading notification settings...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Methods */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Delivery Methods</h2>
            
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formState.email_enabled}
                    onChange={(e) => handleChange('email_enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">SMS Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formState.sms_enabled}
                    onChange={(e) => handleChange('sms_enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </div>

              {/* Phone Number */}
              {formState.sms_enabled && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={formState.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 555-5555"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Notification Types */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Notification Types</h2>
            
            <div className="space-y-4">
              {/* Risk Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Risk Alerts</label>
                  <p className="text-sm text-gray-500">Important alerts about portfolio risk levels</p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.risk_alerts}
                  onChange={(e) => handleChange('risk_alerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              {/* Anomaly Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Anomaly Alerts</label>
                  <p className="text-sm text-gray-500">Notifications about unusual market behavior</p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.anomaly_alerts}
                  onChange={(e) => handleChange('anomaly_alerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              {/* Model Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Model Alerts</label>
                  <p className="text-sm text-gray-500">Updates from AI trading models</p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.model_alerts}
                  onChange={(e) => handleChange('model_alerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              {/* Portfolio Summaries */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Portfolio Summaries</label>
                  <p className="text-sm text-gray-500">Regular portfolio performance updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.portfolio_summaries}
                  onChange={(e) => handleChange('portfolio_summaries', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;