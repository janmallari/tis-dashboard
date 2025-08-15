'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CloudIcon, FolderIcon } from 'lucide-react';

export default function OnboardingPage() {
  const handleConnectService = (service: 'google' | 'sharepoint') => {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/auth/${service}`;
    window.location.href = url;
  };
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center'>
            <CloudIcon className='w-8 h-8 text-blue-600 dark:text-blue-400' />
          </div>
          <CardTitle className='text-2xl font-bold'>Welcome!</CardTitle>
          <CardDescription className='text-base'>
            Let's get you set up by connecting your storage account
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <FolderIcon className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0' />
              <div className='text-sm text-amber-800 dark:text-amber-200'>
                <p className='font-medium mb-1'>What happens next?</p>
                <p>
                  We'll create a few folders in your preferred storage to
                  organize your files and keep everything tidy.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleConnectService('google')}
            className='w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700'
            size='lg'
          >
            Connect Google Drive
          </Button>

          <Button
            disabled
            onClick={() => handleConnectService('sharepoint')}
            className='mb-1 w-full h-12 text-base font-medium bg-blue-800 hover:bg-blue-900'
            size='lg'
          >
            <span>Connect SharePoint</span>
          </Button>
          <p className='text-center text-xs text-muted-foreground'>
            Under maintenance
          </p>

          <p className='text-xs text-muted-foreground text-center'>
            By connecting, you agree to let us access and organize your Google
            Drive/Sharepoint files
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
