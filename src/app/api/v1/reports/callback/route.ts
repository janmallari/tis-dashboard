import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      report_id,
      status,
      report_link,
      report_id: reportFileId,
      error_message,
    } = body;

    if (!report_id || !status) {
      return NextResponse.json(
        { error: 'report_id and status are required' },
        { status: 400 },
      );
    }

    // Validate status
    if (!['ready', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "ready" or "failed"' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Update report status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'ready' && report_link && reportFileId) {
      updateData.report_link = report_link;
      updateData.report_id = reportFileId;
    }

    if (status === 'failed' && error_message) {
      updateData.error_message = error_message;
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', report_id)
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

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 },
      );
    }

    if (!updatedReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    console.log(`Report ${report_id} updated to status: ${status}`);

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Report status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error in POST /api/v1/reports/callback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
