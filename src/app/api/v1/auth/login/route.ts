import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Only allow login if user is super admin
  console.log('User metadata:', data.user.user_metadata);
  const isSuperAdmin = data.user.user_metadata?.role === 'admin';

  if (isSuperAdmin) {
    // Log out user and clear session
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'Invalid credentials...' },
      { status: 403 },
    );
  }

  // Set session cookies for SSR
  // The supabase SSR client will handle cookies automatically
  return NextResponse.json({ user: data.user });
}

export async function GET() {
  return NextResponse.json({ message: 'Login endpoint' });
}
