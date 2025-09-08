import { NextResponse } from 'next/server';

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.SHAREPOINT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SHAREPOINT_REDIRECT_URI!,
    response_mode: 'query',
    scope: 'offline_access Files.ReadWrite.All Sites.ReadWrite.All',
    state: 'optional_csrf_token',
  });

  return NextResponse.redirect(`${process.env.SHAREPOINT_AUTH_URL}?${params}`);
}
