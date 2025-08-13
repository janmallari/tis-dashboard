'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircleIcon, FolderIcon } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function ConnectedPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/'); // Navigate to the main app or dashboard
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center'>
            <CheckCircleIcon className='w-8 h-8 text-green-600 dark:text-green-400' />
          </div>
          <CardTitle className='text-2xl font-bold'>All Set!</CardTitle>
          <CardDescription className='text-base'>
            Your Google Drive account has been successfully connected
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <FolderIcon className='w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0' />
              <div className='text-sm text-green-800 dark:text-green-200'>
                <p className='font-medium mb-1'>Folders Created</p>
                <p>
                  We've successfully created the necessary folders in your
                  Google Drive to keep your files organized.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className='w-full h-12 text-base font-medium'
            size='lg'
          >
            Continue to App
          </Button>

          <p className='text-xs text-muted-foreground text-center'>
            You can manage your connection settings anytime from your account
            preferences
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
