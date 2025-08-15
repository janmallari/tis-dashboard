import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StorageIntegrationInsert } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Missing code param' }, { status: 400 });
  }

  try {
    // Request tokens from Microsoft
    const tokenRes = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.SHAREPOINT_CLIENT_ID!,
          client_secret: process.env.SHAREPOINT_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.SHAREPOINT_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      },
    );

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: 'Failed to get tokens', details: tokens },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: agencies, error } = await supabase.rpc('get_user_agencies', {
      user_id: user!.id,
    });

    const agency = agencies[0];

    const newIntegration: StorageIntegrationInsert = {
      agency_id: agency.id,
      provider: 'sharepoint',
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
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

    // Redirect to sharepoint setup - selecting folder
    return NextResponse.redirect(
      `${process.env.BASE_URL}/onboarding/storage/sharepoint/setup?access_token=${tokens.access_token}`,
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unexpected error', details: err.message },
      { status: 500 },
    );
  }
}
