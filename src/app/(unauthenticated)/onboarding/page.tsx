'use client';

import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  console.log('Hello from pre-onboarding');

  return (
    <div>
      <h1>Onboarding</h1>
      <p>Welcome to the onboarding process!</p>
      <Button onClick={() => (window.location.href = '/api/v1/auth/google')}>
        Connect Google Drive
      </Button>
    </div>
  );
}
