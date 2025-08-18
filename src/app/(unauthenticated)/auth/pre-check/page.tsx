import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { GetUserAgenciesResult } from '@/lib/supabase/client';

export default async function PreCheck() {
  console.log('Hello from pre-check');

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }

  if (!user) {
    redirect('/auth/sign-in');
  }

  const fetchUserAgencies = async (
    userId: string,
  ): Promise<GetUserAgenciesResult[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_agencies', {
        user_id: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching agencies:', err);
      return [];
    }
  };

  const agencies = await fetchUserAgencies(user.id);

  if (agencies.length > 0 && !agencies[0].has_active_integration) {
    redirect('/onboarding');
  }

  if (agencies.length > 0 && agencies[0].has_active_integration) {
    redirect('/');
  }

  return (
    <p>Hello, {user?.user_metadata?.full_name}! Doing some pre-checks...</p>
  );
}
