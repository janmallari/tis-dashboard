import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ensureValidGoogleDriveToken,
  getJsonFromSlides,
} from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's agencies
    const { data: agencies, error: agencyError } = await supabase.rpc(
      'get_user_agencies',
      {
        user_id: user.id,
      },
    );

    if (agencyError || !agencies || agencies.length === 0) {
      return NextResponse.json(
        { error: 'No agency found for user' },
        { status: 400 },
      );
    }

    const agency = agencies[0];

    // Parse FormData instead of JSON
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const mediaPlanTemplateFile = formData.get(
      'media_plan_template',
    ) as File | null;
    const mediaPlanResultsTemplateFile = formData.get(
      'media_plan_results_template',
    ) as File | null;
    const slidesTemplateFile = formData.get('slides_template') as File | null;

    if (!name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 },
      );
    }

    // Get storage integration for the agency
    const { data: integrations, error: integrationError } = await supabase
      .from('storage_integrations')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('status', 'active')
      .limit(1);

    if (integrationError) {
      console.error('Error fetching storage integration:', integrationError);
      return NextResponse.json(
        { error: 'Failed to fetch storage integration' },
        { status: 500 },
      );
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        {
          error:
            'No active storage integration found. Please set up storage first.',
        },
        { status: 400 },
      );
    }

    const integration = integrations[0];

    // Check agency settings for folder configuration
    const agencySettings = agency.settings || {};
    const storageProvider = integration.provider; // 'google_drive' or 'sharepoint'

    // Create client folder structure and upload files
    let clientFolderId = null;
    let clientFolderUrl = null;
    const folderStructure = {
      templates: null as string | null,
      data: null as string | null,
      reports: null as string | null,
    };
    const uploadedFiles = {
      media_plan_template: {
        id: null as string | null,
        url: null as string | null,
      },
      media_plan_results_template: {
        id: null as string | null,
        url: null as string | null,
      },
      slides_template: {
        id: null as string | null,
        url: null as string | null,
      },
      slides_json: {
        id: null as string | null,
        url: null as string | null,
      },
    };
    let accessToken = integration.access_token;

    try {
      if (storageProvider === 'google_drive') {
        const tokenResult = await ensureValidGoogleDriveToken(
          integration.access_token,
          integration.refresh_token,
        );

        if (!tokenResult) {
          return NextResponse.json(
            {
              error:
                'Failed to authenticate with Google Drive. Please reconnect your storage integration.',
            },
            { status: 401 },
          );
        }

        accessToken = tokenResult.token;

        // Update the database if token was refreshed
        if (tokenResult.wasRefreshed) {
          console.log('Updating database with new access token...');
          await supabase
            .from('storage_integrations')
            .update({ access_token: accessToken })
            .eq('id', integration.id);
        }

        // Create main client folder
        const folderResponse = await fetch(
          'https://www.googleapis.com/drive/v3/files',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: agencySettings.google_drive?.folder_id
                ? [agencySettings.google_drive.folder_id]
                : undefined,
            }),
          },
        );

        if (!folderResponse.ok) {
          throw new Error('Failed to create Google Drive folder');
        }

        const folderData = await folderResponse.json();
        clientFolderId = folderData.id;
        clientFolderUrl = `https://drive.google.com/drive/folders/${folderData.id}`;

        // Create subfolders
        const subfolders = ['templates', 'data', 'reports'];
        for (const subfolder of subfolders) {
          const subfolderResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: subfolder,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [clientFolderId],
              }),
            },
          );

          if (subfolderResponse.ok) {
            const subfolderData = await subfolderResponse.json();
            folderStructure[subfolder as keyof typeof folderStructure] =
              subfolderData.id;
          }
        }

        // Upload template files to the templates folder
        if (folderStructure.templates) {
          if (mediaPlanTemplateFile && mediaPlanTemplateFile.size > 0) {
            const result = await uploadFileToGoogleDrive(
              accessToken,
              mediaPlanTemplateFile,
              folderStructure.templates,
              'Media Plan Template',
            );
            uploadedFiles.media_plan_template = result;
          }

          if (
            mediaPlanResultsTemplateFile &&
            mediaPlanResultsTemplateFile.size > 0
          ) {
            const result = await uploadFileToGoogleDrive(
              accessToken,
              mediaPlanResultsTemplateFile,
              folderStructure.templates,
              'Media Plan Results Template',
            );
            uploadedFiles.media_plan_results_template = result;
          }

          if (slidesTemplateFile && slidesTemplateFile.size > 0) {
            const result = await uploadFileToGoogleDrive(
              accessToken,
              slidesTemplateFile,
              folderStructure.templates,
              'Slides Template',
              'application/vnd.google-apps.presentation',
            );

            uploadedFiles.slides_template = result;

            // we then need to extract shapes and such from the slides
            const slidesJson = await getJsonFromSlides(accessToken, result.id!);

            // upload slidesJson as json file in google drive, use uploadFileToGoogleDrive function
            const slidesJsonBlob = new Blob([JSON.stringify(slidesJson)], {
              type: 'application/json',
            });
            const slidesJsonFile = new File([slidesJsonBlob], 'slides.json');

            const uploadedJson = await uploadFileToGoogleDrive(
              accessToken,
              slidesJsonFile,
              folderStructure.templates,
              'Slides JSON',
            );

            uploadedFiles.slides_json = uploadedJson;
          }
        }
      } else if (storageProvider === 'sharepoint') {
        // Create main client folder using Microsoft Graph
        const siteId = agencySettings.sharepoint?.site_id || 'root';
        const driveId = agencySettings.sharepoint?.drive_id || 'default';
        const basePath = agencySettings.sharepoint?.folder_path || 'clients';

        const folderResponse = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${basePath}/${encodeURIComponent(
            name,
          )}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${integration.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename',
            }),
          },
        );

        if (!folderResponse.ok) {
          throw new Error('Failed to create SharePoint folder');
        }

        const folderData = await folderResponse.json();
        clientFolderId = folderData.id;
        clientFolderUrl = folderData.webUrl;

        // Create subfolders
        const subfolders = ['templates', 'data', 'reports'];
        for (const subfolder of subfolders) {
          const subfolderResponse = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${basePath}/${encodeURIComponent(
              name,
            )}/${subfolder}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename',
              }),
            },
          );

          if (subfolderResponse.ok) {
            const subfolderData = await subfolderResponse.json();
            folderStructure[subfolder as keyof typeof folderStructure] =
              subfolderData.id;
          }
        }

        // Upload template files to the templates subfolder
        const templatesPath = `${basePath}/${encodeURIComponent(
          name,
        )}/templates`;

        if (mediaPlanTemplateFile && mediaPlanTemplateFile.size > 0) {
          const result = await uploadFileToSharePoint(
            integration.access_token,
            mediaPlanTemplateFile,
            siteId,
            driveId,
            templatesPath,
            'Media Plan Template',
          );
          uploadedFiles.media_plan_template = result;
        }

        if (
          mediaPlanResultsTemplateFile &&
          mediaPlanResultsTemplateFile.size > 0
        ) {
          const result = await uploadFileToSharePoint(
            integration.access_token,
            mediaPlanResultsTemplateFile,
            siteId,
            driveId,
            templatesPath,
            'Media Plan Results Template',
          );
          uploadedFiles.media_plan_results_template = result;
        }

        if (slidesTemplateFile && slidesTemplateFile.size > 0) {
          const result = await uploadFileToSharePoint(
            integration.access_token,
            slidesTemplateFile,
            siteId,
            driveId,
            templatesPath,
            'Slides Template',
          );
          uploadedFiles.slides_template = result;
        }
      }
    } catch (error) {
      console.error('Error creating client folder:', error);
      // Continue without folder creation - user can manually organize files
    }

    // Create client record in database with both IDs and URLs
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name,
        media_plan_template: uploadedFiles.media_plan_template.url,
        media_plan_template_id: uploadedFiles.media_plan_template.id,
        media_plan_results_template:
          uploadedFiles.media_plan_results_template.url,
        media_plan_results_template_id:
          uploadedFiles.media_plan_results_template.id,
        slides_template: uploadedFiles.slides_template.url,
        slides_template_id: uploadedFiles.slides_template.id,
        slides_template_json: uploadedFiles.slides_json.url,
        slides_template_json_id: uploadedFiles.slides_json.id,
        agency_id: agency.id,
        settings: {
          templates: folderStructure.templates,
          data: folderStructure.data,
          reports: folderStructure.reports,
        },
      })
      .select('*')
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        folder_id: clientFolderId,
        folder_url: clientFolderUrl,
        folder_structure: folderStructure,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/v1/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Helper function to upload file to Google Drive
async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  folderId: string,
  fileName: string,
  mimeType?: string | null,
): Promise<{ id: string | null; url: string | null }> {
  try {
    // First, create the file metadata
    const metadata: { name: string; parents: string[]; mimeType?: string } = {
      name: fileName + '.' + file.name.split('.').pop(),
      parents: [folderId],
    };

    if (mimeType) {
      metadata.mimeType = mimeType;
    }

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      },
    );

    if (!response.ok) {
      console.error(
        'Failed to upload file to Google Drive:',
        await response.text(),
      );
      return { id: null, url: null };
    }

    const result = await response.json();
    return {
      id: result.id,
      url: `https://drive.google.com/file/d/${result.id}/view`,
    };
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    return { id: null, url: null };
  }
}

// Helper function to upload file to SharePoint
async function uploadFileToSharePoint(
  accessToken: string,
  file: File,
  siteId: string,
  driveId: string,
  folderPath: string,
  fileName: string,
): Promise<{ id: string | null; url: string | null }> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fullFileName = `${fileName}.${fileExtension}`;

    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${folderPath}/${encodeURIComponent(
        fullFileName,
      )}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': file.type,
        },
        body: fileBuffer,
      },
    );

    if (!response.ok) {
      console.error(
        'Failed to upload file to SharePoint:',
        await response.text(),
      );
      return { id: null, url: null };
    }

    const result = await response.json();
    return {
      id: result.id,
      url: result.webUrl,
    };
  } catch (error) {
    console.error('Error uploading file to SharePoint:', error);
    return { id: null, url: null };
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's agencies
    const { data: agencies, error: agencyError } = await supabase.rpc(
      'get_user_agencies',
      {
        user_id: user.id,
      },
    );

    if (agencyError || !agencies || agencies.length === 0) {
      return NextResponse.json(
        { error: 'No agency found for user' },
        { status: 400 },
      );
    }

    const agency = agencies[0];

    // Get clients for the agency
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 },
      );
    }

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error in GET /api/v1/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
