import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // get refresh token
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.photos.readonly',
    ],
  });

  return NextResponse.redirect(authUrl);
}
