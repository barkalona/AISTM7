'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          throw new Error('Invalid verification token');
        }

        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        if (!response.ok) {
          throw new Error('Failed to verify email');
        }

        setVerified(true);
        toast.success('Email verified successfully!');
        router.push('/dashboard');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to verify email');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {loading ? 'Verifying Email...' : verified ? 'Email Verified!' : 'Verification Failed'}
          </h2>
        </div>
      </div>
    </div>
  );
}