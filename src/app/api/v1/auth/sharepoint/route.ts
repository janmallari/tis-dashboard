import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const params = new URLSearchParams({
    client_id: process.env.SHAREPOINT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SHAREPOINT_REDIRECT_URI ?? '',
    response_mode: 'query',
    scope: 'offline_access Files.ReadWrite Sites.ReadWrite.All',
  });

  return NextResponse.redirect(`${process.env.SHAREPOINT_AUTH_URL}?${params}`);
}
