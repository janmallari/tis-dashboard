import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Get client by ID
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .eq('agency_id', agency.id)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error in GET /api/v1/clients/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Parse FormData
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

    const clientId = await params.id;

    // Get existing client
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('agency_id', agency.id)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get storage integration
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

    const integration = integrations?.[0];
    const agencySettings = agency.settings || {};
    const storageProvider = integration?.provider;

    // Handle file updates
    let updatedFiles = {
      media_plan_template: {
        id: existingClient.media_plan_template_id,
        url: existingClient.media_plan_template,
      },
      media_plan_results_template: {
        id: existingClient.media_plan_results_template_id,
        url: existingClient.media_plan_results_template,
      },
      slides_template: {
        id: existingClient.slides_template_id,
        url: existingClient.slides_template,
      },
    };

    if (integration && storageProvider) {
      try {
        // Handle media plan template update
        if (mediaPlanTemplateFile && mediaPlanTemplateFile.size > 0) {
          // Delete old file if it exists
          if (existingClient.media_plan_template_id) {
            await deleteFile(
              integration.access_token,
              existingClient.media_plan_template_id,
              storageProvider,
              agencySettings,
            );
          }

          // Upload new file
          const result = await uploadFileToStorage(
            integration.access_token,
            mediaPlanTemplateFile,
            storageProvider,
            agencySettings,
            existingClient.name,
            'Media Plan Template',
          );
          updatedFiles.media_plan_template = result;
        }

        // Handle media plan results template update
        if (
          mediaPlanResultsTemplateFile &&
          mediaPlanResultsTemplateFile.size > 0
        ) {
          // Delete old file if it exists
          if (existingClient.media_plan_results_template_id) {
            await deleteFile(
              integration.access_token,
              existingClient.media_plan_results_template_id,
              storageProvider,
              agencySettings,
            );
          }

          // Upload new file
          const result = await uploadFileToStorage(
            integration.access_token,
            mediaPlanResultsTemplateFile,
            storageProvider,
            agencySettings,
            existingClient.name,
            'Media Plan Results Template',
          );
          updatedFiles.media_plan_results_template = result;
        }

        // Handle slides template update
        if (slidesTemplateFile && slidesTemplateFile.size > 0) {
          // Delete old file if it exists
          if (existingClient.slides_template_id) {
            await deleteFile(
              integration.access_token,
              existingClient.slides_template_id,
              storageProvider,
              agencySettings,
            );
          }

          // Upload new file
          const result = await uploadFileToStorage(
            integration.access_token,
            slidesTemplateFile,
            storageProvider,
            agencySettings,
            existingClient.name,
            'Slides Template',
          );
          updatedFiles.slides_template = result;
        }
      } catch (error) {
        console.error('Error updating files:', error);
        // Continue with database update even if file operations fail
      }
    }

    // Update client in database with both IDs and URLs
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({
        name,
        media_plan_template: updatedFiles.media_plan_template.url,
        media_plan_template_id: updatedFiles.media_plan_template.id,
        media_plan_results_template:
          updatedFiles.media_plan_results_template.url,
        media_plan_results_template_id:
          updatedFiles.media_plan_results_template.id,
        slides_template: updatedFiles.slides_template.url,
        slides_template_id: updatedFiles.slides_template.id,
      })
      .eq('id', params.id)
      .eq('agency_id', agency.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating client:', updateError);
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      client: updatedClient,
    });
  } catch (error) {
    console.error('Error in PUT /api/v1/clients/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Helper function to upload file to storage
async function uploadFileToStorage(
  accessToken: string,
  file: File,
  provider: string,
  agencySettings: any,
  clientName: string,
  fileName: string,
): Promise<{ id: string | null; url: string | null }> {
  if (provider === 'google_drive') {
    const templatesFolder = await getGoogleDriveTemplatesFolder(
      accessToken,
      clientName,
      agencySettings,
    );
    if (templatesFolder) {
      return await uploadFileToGoogleDrive(
        accessToken,
        file,
        templatesFolder,
        fileName,
      );
    }
  } else if (provider === 'sharepoint') {
    const siteId = agencySettings.sharepoint?.site_id || 'root';
    const driveId = agencySettings.sharepoint?.drive_id || 'default';
    const basePath = agencySettings.sharepoint?.folder_path || 'clients';
    const templatesPath = `${basePath}/${encodeURIComponent(
      clientName,
    )}/templates`;

    return await uploadFileToSharePoint(
      accessToken,
      file,
      siteId,
      driveId,
      templatesPath,
      fileName,
    );
  }
  return { id: null, url: null };
}

// Helper function to delete file from storage
async function deleteFile(
  accessToken: string,
  fileId: string,
  provider: string,
  agencySettings: any,
): Promise<void> {
  try {
    if (provider === 'google_drive') {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else if (provider === 'sharepoint') {
      const siteId = agencySettings.sharepoint?.site_id || 'root';
      const driveId = agencySettings.sharepoint?.drive_id || 'default';

      await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error, just log it
  }
}

// Helper function to get Google Drive templates folder
async function getGoogleDriveTemplatesFolder(
  accessToken: string,
  clientName: string,
  agencySettings: any,
): Promise<string | null> {
  try {
    // Search for the client folder
    const clientFolderQuery = `name='${clientName}' and mimeType='application/vnd.google-apps.folder'`;
    const parentQuery = agencySettings.google_drive?.folder_id
      ? ` and '${agencySettings.google_drive.folder_id}' in parents`
      : '';

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        clientFolderQuery + parentQuery,
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await response.json();
    const clientFolder = data.files?.[0];

    if (!clientFolder) return null;

    // Search for templates folder within client folder
    const templatesFolderQuery = `name='templates' and mimeType='application/vnd.google-apps.folder' and '${clientFolder.id}' in parents`;

    const templatesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        templatesFolderQuery,
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const templatesData = await templatesResponse.json();
    return templatesData.files?.[0]?.id || null;
  } catch (error) {
    console.error('Error finding templates folder:', error);
    return null;
  }
}

// Reuse helper functions from the create route but return both ID and URL
async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  folderId: string,
  fileName: string,
): Promise<{ id: string | null; url: string | null }> {
  try {
    const metadata = {
      name: fileName + '.' + file.name.split('.').pop(),
      parents: [folderId],
    };

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
