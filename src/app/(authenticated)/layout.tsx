import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AuthProvider } from '@/hooks/use-auth';
import { GetUserAgenciesResult } from '@/lib/supabase/client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'This is Rocket - Reporting Toos',
  description: 'Reporting Tool Dashboard',
};

export default await async function RootAutenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar user={user} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
};
