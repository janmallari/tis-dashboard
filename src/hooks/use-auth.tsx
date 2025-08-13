'use client';

import React, { useEffect, useState, useContext, createContext } from 'react';
import {
  supabase,
  type UserProfile,
  type GetUserAgenciesResult,
} from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type AuthState = {
  user: AuthUser | null;
  profile: UserProfile | null;
  agencies: GetUserAgenciesResult[];
  loading: boolean;
  error: string | null;
  isSuper: boolean;
  refreshProfile: () => Promise<void>;
  refreshAgencies: () => Promise<void>;
};

const AuthenticationContext = createContext<AuthState>({
  user: null,
  profile: null,
  agencies: [],
  loading: true,
  error: null,
  isSuper: false,
  refreshProfile: async () => {},
  refreshAgencies: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agencies, setAgencies] = useState<GetUserAgenciesResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (
    userId: string,
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  const fetchUserAgencies = async (
    userId: string,
  ): Promise<GetUserAgenciesResult[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_agencies', {
        user_id: userId,
      });

      console.log('Fetched agencies:', data); // Debugging line

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching agencies:', err);
      return [];
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const userProfile = await fetchUserProfile(user.id);
    setProfile(userProfile);
  };

  const refreshAgencies = async () => {
    if (!user) return;
    const userAgencies = await fetchUserAgencies(user.id);
    setAgencies(userAgencies);
  };

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log('FROM FETCH USER', user);

        if (error) {
          console.error(error);
          throw error;
        }

        if (mounted) {
          setUser(user);

          if (user) {
            // Fetch user profile and agencies
            const [userProfile, userAgencies] = await Promise.all([
              fetchUserProfile(user.id),
              fetchUserAgencies(user.id),
            ]);

            setProfile(userProfile);
            setAgencies(userAgencies);
          } else {
            setProfile(null);
            setAgencies([]);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication error');
          setUser(null);
          setProfile(null);
          setAgencies([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);

        if (session?.user) {
          const [userProfile, userAgencies] = await Promise.all([
            fetchUserProfile(session.user.id),
            fetchUserAgencies(session.user.id),
          ]);

          setProfile(userProfile);
          setAgencies(userAgencies);
        } else {
          setProfile(null);
          setAgencies([]);
        }

        setLoading(false);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isSuper = profile?.user_type === 'super_admin';

  console.log(user);

  return (
    <AuthenticationContext.Provider
      value={{
        user,
        profile,
        agencies,
        loading,
        error,
        isSuper,
        refreshProfile,
        refreshAgencies,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthenticationContext);
  return context;
}
