'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function BackupCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBackupCodes = async () => {
    try {
      const response = await fetch('/api/auth/backup-codes');
      if (!response.ok) {
        throw new Error('Failed to fetch backup codes');
      }
      const data = await response.json();
      setCodes(data.codes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch backup codes');
    }
  };

  const regenerateBackupCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/backup-codes/regenerate', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate backup codes');
      }

      const data = await response.json();
      setCodes(data.codes);
      toast.success('Backup codes regenerated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupCodes();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Backup Codes</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Your Backup Codes</h2>
          <p className="text-sm text-gray-600 mb-4">
            Save these codes in a safe place. Each code can be used once.
          </p>
          
          {codes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {codes.map((code, i) => (
                <div key={i} className="font-mono bg-gray-50 p-3 rounded">
                  {code}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No backup codes available</p>
          )}
        </div>

        <div className="border-t pt-6">
          <button
            onClick={regenerateBackupCodes}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Regenerating...' : 'Regenerate Backup Codes'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Warning: Regenerating backup codes will invalidate all existing codes.
          </p>
        </div>
      </div>
    </div>
  );
}