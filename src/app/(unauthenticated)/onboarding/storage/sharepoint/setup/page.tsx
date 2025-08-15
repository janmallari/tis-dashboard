'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Site {
  id: string;
  displayName: string;
  webUrl: string;
}

interface SharePointFolder {
  id: string;
  name: string;
  webUrl: string;
}

export default function SharePointFoldersPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [folders, setFolders] = useState<SharePointFolder[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<SharePointFolder | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const accessToken = searchParams.get('access_token');

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch(
        `/api/v1/sharepoint/sites?access_token=${accessToken}`,
      );
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.value || []);
    } catch (err) {
      setError('Failed to load SharePoint sites');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async (site: Site) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/sharepoint/folders?siteId=${site.id}`,
      );
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data.value || []);
      setSelectedSite(site);
    } catch (err) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (selectedFolder && selectedSite) {
      router.push(
        `/connected?service=SharePoint&site=${encodeURIComponent(
          selectedSite.displayName,
        )}&folder=${encodeURIComponent(selectedFolder.name)}`,
      );
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen  flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            Loading SharePoint...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen  flex items-center justify-center p-4'>
      <Card className='w-full max-w-2xl'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900 dark:text-white'>
            {selectedSite ? 'Select Folder' : 'Select SharePoint Site'}
          </CardTitle>
          <CardDescription>
            {selectedSite
              ? `Choose a folder from ${selectedSite.displayName}`
              : 'Choose which SharePoint site to connect'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <p className='text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          {selectedSite && (
            <Button
              variant='outline'
              onClick={() => {
                setSelectedSite(null);
                setSelectedFolder(null);
                setFolders([]);
              }}
              className='mb-4'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Sites
            </Button>
          )}

          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {!selectedSite
              ? sites.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => fetchFolders(site)}
                    className='p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors'
                  >
                    <div className='flex items-center space-x-3'>
                      <ArrowLeft className='w-5 h-5 text-blue-600' />
                      <div>
                        <h3 className='font-medium text-gray-900 dark:text-white'>
                          {site.displayName}
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {site.webUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              : folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFolder?.id === folder.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <ArrowLeft className='w-5 h-5 text-blue-600' />
                        <span className='font-medium text-gray-900 dark:text-white'>
                          {folder.name}
                        </span>
                      </div>
                      {selectedFolder?.id === folder.id && (
                        <CheckCircle className='w-5 h-5 text-blue-600' />
                      )}
                    </div>
                  </div>
                ))}
          </div>

          {selectedFolder && (
            <Button onClick={handleConnect} className='w-full'>
              Connect to {selectedFolder.name}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
