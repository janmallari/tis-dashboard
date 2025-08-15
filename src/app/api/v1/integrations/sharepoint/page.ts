import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('access_token');

  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/sites?search=*',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch sites');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching SharePoint sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 },
    );
  }
}
