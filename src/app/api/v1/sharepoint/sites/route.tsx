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
    // You can use /sites?search=* or /sites/root/sites depending on your needs
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
      console.error('Failed to fetch SharePoint sites:', response.statusText);
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
