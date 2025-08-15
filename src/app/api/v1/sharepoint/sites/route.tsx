import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('access_token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing access_token' },
      { status: 400 },
    );
  }

  try {
    // Try to get sites - start with root site and subsites
    let response = await fetch(
      'https://graph.microsoft.com/v1.0/sites/root/sites',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // If that fails, try getting the root site only
    if (!response.ok) {
      console.log('Root/sites failed, trying root site only...');
      response = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        'Failed to fetch SharePoint sites:',
        response.status,
        response.statusText,
        errorText,
      );
      throw new Error(
        `Failed to fetch sites: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // If we got a single site (root), wrap it in an array
    if (data.id && !data.value) {
      return NextResponse.json({ value: [data] });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching SharePoint sites:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sites',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
