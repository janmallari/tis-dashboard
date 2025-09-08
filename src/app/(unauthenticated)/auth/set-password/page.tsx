'use client';
import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type SupabaseAuthToken = {
  access_token: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    invited_at: string;
    phone: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: {
      provider: string;
      providers: string[];
    };
    user_metadata: {
      email_verified: boolean;
      full_name: string;
    };
    identities: Array<{
      identity_id: string;
      id: string;
      user_id: string;
      identity_data: {
        email: string;
        email_verified: boolean;
        phone_verified: boolean;
        sub: string;
      };
      provider: string;
      last_sign_in_at: string;
      created_at: string;
      updated_at: string;
      email: string;
    }>;
    created_at: string;
    updated_at: string;
    is_anonymous: boolean;
  };
};

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}

function SetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // Get auth token from localStorage
  const [authToken, setAuthToken] = useState<SupabaseAuthToken | null>(null);

  // Only run on client
  const getAuthToken = async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`,
      );

      const inviteToken = token ? await JSON.parse(token) : null;

      console.log('Invite Token:', inviteToken);

      setAuthToken(inviteToken);
    }
  };

  React.useEffect(() => {
    const authToken = getAuthToken();

    if (!authToken) {
      setError('Invalid or missing auth token.');
      return;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!authToken) {
      setError('Invalid or missing auth token.');
      return;
    }
    setLoading(true);
    try {
      console.log('Setting password with auth token:', authToken);
      // Set the session with the auth token before updating the user
      await supabase.auth.setSession({
        access_token: authToken.access_token,
        refresh_token: authToken.refresh_token,
      });

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      setSuccess('Password set successfully! Redirecting to dashboard...');
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50'>
      <div className='bg-white p-8 rounded shadow-md w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-4'>
          {/* Set Your Password {authToken} */}
        </h1>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div>
            <label className='block mb-1 font-medium'>New Password</label>
            <input
              type='password'
              className='w-full border rounded px-3 py-2'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='block mb-1 font-medium'>Confirm Password</label>
            <input
              type='password'
              className='w-full border rounded px-3 py-2'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className='text-red-500'>{error}</div>}
          {success && <div className='text-green-600'>{success}</div>}
          <button
            type='submit'
            className='w-full bg-black text-white py-2 rounded mt-2'
            disabled={loading}
          >
            {loading ? 'Setting...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
