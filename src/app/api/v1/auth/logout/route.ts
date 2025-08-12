import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  // Set session cookies for SSR
  // The supabase SSR client will handle cookies automatically
  return NextResponse.json({ success: true });
}
