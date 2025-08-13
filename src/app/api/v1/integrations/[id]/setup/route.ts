import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL;

export async function GET(req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    // Fetch integration from DB
    const supabase = await createClient();
    const { data: integration, error } = await supabase
      .from('storage_integrations')
      .select('id, access_token, agency_id')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Integration not found or inactive' },
        { status: 404 },
      );
    }

    // Setup OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URL,
    );

    oauth2Client.setCredentials({ access_token: integration.access_token });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Check if folder already exists
    let folderId = null;

    const folderName = `tis-${integration.agency_id}_${integration.id}`;

    try {
      const listRes = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
      });

      if (listRes.data.files && listRes.data.files.length > 0) {
        folderId = listRes.data.files[0].id;

        return NextResponse.json(
          { folder: listRes.data.files[0], message: 'Folder already exists.' },
          { status: 200 },
        );
      }
    } catch (listError) {
      // Log but do not fail, continue to creation
      console.error('Error checking for existing folder:', listError);
    }

    // Create folder if not exists
    try {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id, name, webContentLink',
      });

      // update the agency setting to add folder details to json
      await supabase
        .from('agencies')
        .update({
          settings: {
            google_drive: {
              folder_id: folder.data.id,
              folder_name: folder.data.name,
              folder_link: folder.data.webContentLink,
            },
          },
        })
        .eq('id', integration.agency_id);

      return NextResponse.redirect(
        `${process.env.BASE_URL}/onboarding/storage`,
      );
    } catch (createError) {
      // Trap Google API errors
      return NextResponse.json({ error: createError }, { status: 500 });
    }
  } catch (error) {
    // Trap all other errors
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
