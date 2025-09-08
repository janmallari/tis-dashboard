import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureValidGoogleDriveToken } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query
    let query = supabase
      .from('reports')
      .select(
        `
        *,
        clients!inner(
          id,
          name
        )
      `,
      )
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 },
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agency.id);

    if (clientId) {
      countQuery = countQuery.eq('client_id', clientId);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting reports:', countError);
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

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

    // Parse FormData
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const clientId = formData.get('client_id') as string;
    const mediaPlanFile = formData.get('media_plan') as File | null;
    const mediaResultsFile = formData.get('media_results') as File | null;

    if (!name || !clientId || !mediaPlanFile || !mediaResultsFile) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 },
      );
    }

    // Verify client belongs to the agency
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('agency_id', agency.id)
      .single();

    if (clientError || !client) {
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
    if (!integration) {
      return NextResponse.json(
        { error: 'No active storage integration found' },
        { status: 400 },
      );
    }

    const agencySettings = agency.settings || {};
    const storageProvider = integration.provider;

    // Generate timestamp for filenames
    const timestamp = Date.now();
    const mediaPlanFilename = `${timestamp}.media_plan.csv`;
    const mediaResultsFilename = `${timestamp}.media_plan_results.csv`;

    // Upload files to storage
    const uploadedFiles = {
      media_plan: { id: null as string | null, url: null as string | null },
      media_results: { id: null as string | null, url: null as string | null },
    };

    let accessToken = integration.access_token;

    try {
      console.log('Storage provider:', storageProvider);
      console.log('Agency settings:', agencySettings);
      console.log('Client name:', client.name);
      console.log('Access token exists:', !!integration.access_token);

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
      }

      // Upload media plan file
      console.log('Uploading media plan file...');
      uploadedFiles.media_plan = await uploadFileToStorage(
        accessToken,
        mediaPlanFile,
        storageProvider,
        agencySettings,
        client.name,
        mediaPlanFilename,
      );
      console.log('Media plan upload result:', uploadedFiles.media_plan);

      // Upload media results file
      console.log('Uploading media results file...');
      uploadedFiles.media_results = await uploadFileToStorage(
        accessToken,
        mediaResultsFile,
        storageProvider,
        agencySettings,
        client.name,
        mediaResultsFilename,
      );
      console.log('Media results upload result:', uploadedFiles.media_results);
    } catch (error) {
      console.error('Error uploading files:', error);
      return NextResponse.json(
        { error: 'Failed to upload files' },
        { status: 500 },
      );
    }

    // Create report in database
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        name,
        client_id: clientId,
        status: 'in-process',
        media_plan_link: uploadedFiles.media_plan.url,
        media_plan_id: uploadedFiles.media_plan.id,
        media_results_link: uploadedFiles.media_results.url,
        media_results_id: uploadedFiles.media_results.id,
        generated_by: user.id,
        agency_id: agency.id,
      })
      .select(
        `
        *,
        clients!inner(
          id,
          name
        )
      `,
      )
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 },
      );
    }

    // Prepare payload for N8N webhook
    const webhookPayload = {
      report: {
        id: report.id,
        name: report.name,
        status: report.status,
      },
      client: {
        id: client.id,
        name: client.name,
      },
      agency: {
        id: agency.id,
        name: agency.name,
      },
      data_files: {
        media_plan: {
          url: uploadedFiles.media_plan.url,
          file_id: uploadedFiles.media_plan.id,
          filename: mediaPlanFilename,
        },
        media_results: {
          url: uploadedFiles.media_results.url,
          file_id: uploadedFiles.media_results.id,
          filename: mediaResultsFilename,
        },
      },
      templates: {
        media_plan_template: {
          url: client.media_plan_template,
          file_id: client.media_plan_template_id,
        },
        media_plan_results_template: {
          url: client.media_plan_results_template,
          file_id: client.media_plan_results_template_id,
        },
        slides_template: {
          url: client.slides_template,
          file_id: client.slides_template_id,
        },
        slides_template_json: {
          url: client.slides_template_json,
          file_id: client.slides_template_json_id,
        },
      },
      storage: {
        provider: storageProvider,
        access_token: accessToken,
        settings: agencySettings,
      },
      callback_url: `${process.env.BASE_URL}/api/v1/reports/callback`,
    };

    console.log('Webhook payload:', webhookPayload);
    console.log('Sending webhook to N8N...', process.env.N8N_WEBHOOK_URL!);

    // Send webhook to N8N
    fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.N8N_API_KEY!,
      },
      body: JSON.stringify(webhookPayload),
    });

    return NextResponse.json({
      success: true,
      report,
      message:
        "Report generation started. You will be notified when it's ready.",
    });
  } catch (error) {
    console.error('Error in POST /api/v1/reports:', error);
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
    const dataFolder = await getGoogleDriveDataFolder(
      accessToken,
      clientName,
      agencySettings,
    );
    if (dataFolder) {
      return await uploadFileToGoogleDrive(
        accessToken,
        file,
        dataFolder,
        fileName,
      );
    }
  } else if (provider === 'sharepoint') {
    const siteId = agencySettings.sharepoint?.site_id || 'root';
    const driveId = agencySettings.sharepoint?.drive_id || 'default';
    const basePath = agencySettings.sharepoint?.folder_path || 'clients';
    const dataPath = `${basePath}/${encodeURIComponent(clientName)}/data`;

    return await uploadFileToSharePoint(
      accessToken,
      file,
      siteId,
      driveId,
      dataPath,
      fileName,
    );
  }
  return { id: null, url: null };
}

// Helper function to get Google Drive data folder
// Replace the Google Drive helper functions:

// Helper function to get Google Drive data folder
async function getGoogleDriveDataFolder(
  accessToken: string,
  clientName: string,
  agencySettings: any,
): Promise<string | null> {
  try {
    console.log('Looking for client folder:', clientName);
    console.log('Agency Google Drive settings:', agencySettings.google_drive);

    // Search for the client folder
    const clientFolderQuery = `name='${clientName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const parentQuery = agencySettings.google_drive?.folder_id
      ? ` and '${agencySettings.google_drive.folder_id}' in parents`
      : '';

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      clientFolderQuery + parentQuery,
    )}`;

    console.log('Searching for client folder with URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(
        'Failed to search for client folder:',
        await response.text(),
      );
      return null;
    }

    const data = await response.json();
    console.log('Client folder search result:', data);

    const clientFolder = data.files?.[0];

    if (!clientFolder) {
      console.error('Client folder not found for:', clientName);
      return null;
    }

    console.log('Found client folder:', clientFolder);

    // Search for data folder within client folder
    const dataFolderQuery = `name='data' and mimeType='application/vnd.google-apps.folder' and '${clientFolder.id}' in parents and trashed=false`;

    const dataSearchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      dataFolderQuery,
    )}`;

    console.log('Searching for data folder with URL:', dataSearchUrl);

    const dataResponse = await fetch(dataSearchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!dataResponse.ok) {
      console.error(
        'Failed to search for data folder:',
        await dataResponse.text(),
      );
      return null;
    }

    const dataResult = await dataResponse.json();
    console.log('Data folder search result:', dataResult);

    let dataFolder = dataResult.files?.[0];

    // Create data folder if it doesn't exist
    if (!dataFolder) {
      console.log('Data folder not found, creating new one...');

      const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'data',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [clientFolder.id],
          }),
        },
      );

      if (createResponse.ok) {
        dataFolder = await createResponse.json();
        console.log('Created data folder:', dataFolder);
      } else {
        console.error(
          'Failed to create data folder:',
          await createResponse.text(),
        );
        return null;
      }
    }

    return dataFolder?.id || null;
  } catch (error) {
    console.error('Error finding/creating data folder:', error);
    return null;
  }
}

async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  folderId: string,
  fileName: string,
): Promise<{ id: string | null; url: string | null }> {
  try {
    console.log(`Uploading file ${fileName} to folder ${folderId}`);

    const metadata = {
      name: fileName,
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

    const responseText = await response.text();
    console.log('Upload response status:', response.status);
    console.log('Upload response:', responseText);

    if (!response.ok) {
      console.error('Failed to upload file to Google Drive:', responseText);
      return { id: null, url: null };
    }

    const result = JSON.parse(responseText);
    console.log('Upload successful:', result);

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
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${folderPath}/${encodeURIComponent(
        fileName,
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
