import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, context: any) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('storage_integrations')
    .select('*')
    .eq('agency_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ integrations: data }, { status: 200 });
}
