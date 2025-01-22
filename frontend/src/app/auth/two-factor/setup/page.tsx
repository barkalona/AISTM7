'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    backupCodes?: string[];
  }>({});

  useEffect(() => {
    const setup2FA = async () => {
      try {
        const response = await fetch('/api/auth/two-factor/setup', {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Failed to setup 2FA');
        }

        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setData(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to setup 2FA');
      }
    };

    setup2FA();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, secret })
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      toast.success('Two-factor authentication setup successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Two-Factor Authentication
          </h2>
        </div>
        <div className="text-center">
          <p className="mb-4">Scan this QR code with your authenticator app:</p>
          {qrCodeUrl && (
            <div className="flex justify-center">
              <QRCodeSVG value={qrCodeUrl} size={200} />
            </div>
          )}
          <p className="mt-4">Or enter this secret manually:</p>
          <p className="font-mono bg-gray-100 p-2 rounded">{secret}</p>
          
          {data?.backupCodes && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Backup Codes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save these codes in a safe place. Each code can be used once.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {data.backupCodes.map((code: string, i: number) => (
                  <div key={i} className="font-mono bg-white p-2 rounded">
                    {code}
                  </div>
                ))}
              </div>
              <p className="text-sm text-red-600 mt-4">
                Warning: These codes will not be shown again!
              </p>
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="code" className="sr-only">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                autoComplete="off"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}