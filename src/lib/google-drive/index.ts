interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  error?: string;
}

export async function refreshGoogleDriveToken(
  refreshToken: string,
): Promise<RefreshTokenResult> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return {
        success: false,
        error: 'Missing Google OAuth credentials in environment variables',
      };
    }

    console.log('Attempting to refresh Google Drive token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to refresh token:', errorText);
      return {
        success: false,
        error: `Token refresh failed: ${response.status} - ${errorText}`,
      };
    }

    const data: TokenResponse = await response.json();
    console.log('Token refreshed successfully');

    return {
      success: true,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during token refresh',
    };
  }
}

export async function validateGoogleDriveToken(
  accessToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Token is valid for user:', data.user?.emailAddress);
      return true;
    } else {
      console.log('Token validation failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

export async function ensureValidGoogleDriveToken(
  currentToken: string,
  refreshToken?: string,
): Promise<{ token: string; wasRefreshed: boolean } | null> {
  console.log('Validating Google Drive token...');

  // First, try the current token
  const isValid = await validateGoogleDriveToken(currentToken);

  if (isValid) {
    console.log('Current token is valid');
    return { token: currentToken, wasRefreshed: false };
  }

  // If invalid and we have a refresh token, try to refresh
  if (refreshToken) {
    console.log('Current token invalid, attempting refresh...');
    const refreshResult = await refreshGoogleDriveToken(refreshToken);

    if (refreshResult.success && refreshResult.accessToken) {
      console.log('Token refresh successful');
      return { token: refreshResult.accessToken, wasRefreshed: true };
    } else {
      console.error('Token refresh failed:', refreshResult.error);
    }
  } else {
    console.error('No refresh token available');
  }

  return null;
}
