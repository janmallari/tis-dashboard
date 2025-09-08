import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server'; // your function to save tokens
import { StorageIntegrationInsert } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const { tokens } = await oauth2Client.getToken(code as string);

  const supabase = await createClient();

  // get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: agencies } = await supabase.rpc('get_user_agencies', {
    user_id: user!.id,
  });

  const agency = agencies[0];

  const newIntegration: StorageIntegrationInsert = {
    agency_id: agency.id,
    provider: 'google_drive',
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expires_at: new Date(tokens.expiry_date!).toISOString(),
    status: 'active',
  };

  // create new storage_integrations
  const { data, error: integrationError } = await supabase
    .from('storage_integrations')
    .insert(newIntegration)
    .select('id')
    .single();

  if (integrationError) {
    console.error('Error creating integration:', integrationError);
    return NextResponse.error();
  }

  return NextResponse.redirect(
    `${process.env.BASE_URL}/api/v1/integrations/${data.id}/setup/google`,
  );
}
