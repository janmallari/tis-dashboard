'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Upload, X, ExternalLink } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';

interface Client {
  id: number;
  name: string;
  media_plan_template?: string;
  media_plan_template_id?: string;
  media_plan_results_template?: string;
  media_plan_results_template_id?: string;
  slides_template?: string;
  slides_template_id?: string;
  created_at: string;
  updated_at: string;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  const [files, setFiles] = useState({
    media_plan_template: null as File | null,
    media_plan_results_template: null as File | null,
    slides_template: null as File | null,
  });

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/v1/clients/${clientId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch client');
      }

      const data = await response.json();
      setClient(data.client);
      setFormData({
        name: data.client.name,
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      alert(error instanceof Error ? error.message : 'Failed to load client');
      router.push('/clients');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
  };

  const validateFileType = (file: File, allowedTypes: string[]): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(fileExtension);
  };

  // Helper function to get existing file URL based on field
  const getExistingFileUrl = (field: keyof typeof files) => {
    if (!client) return null;

    switch (field) {
      case 'media_plan_template':
        return client.media_plan_template;
      case 'media_plan_results_template':
        return client.media_plan_results_template;
      case 'slides_template':
        return client.slides_template;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a client name');
      return;
    }

    // Validate file types
    if (
      files.media_plan_template &&
      !validateFileType(files.media_plan_template, ['.csv'])
    ) {
      alert('Media Plan Template must be a CSV file');
      return;
    }

    if (
      files.media_plan_results_template &&
      !validateFileType(files.media_plan_results_template, ['.csv'])
    ) {
      alert('Media Plan Results Template must be a CSV file');
      return;
    }

    if (
      files.slides_template &&
      !validateFileType(files.slides_template, ['.pptx'])
    ) {
      alert('Slides Template must be a PPTX file');
      return;
    }

    setLoading(true);

    try {
      // Create FormData to handle file uploads
      const submitData = new FormData();
      submitData.append('name', formData.name);

      // Append files if they exist (only new files will be uploaded)
      if (files.media_plan_template) {
        submitData.append('media_plan_template', files.media_plan_template);
      }
      if (files.media_plan_results_template) {
        submitData.append(
          'media_plan_results_template',
          files.media_plan_results_template,
        );
      }
      if (files.slides_template) {
        submitData.append('slides_template', files.slides_template);
      }

      const response = await fetch(`/api/v1/clients/${clientId}`, {
        method: 'PUT',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update client');
      }

      // Redirect to clients list
      router.push('/clients');
    } catch (error) {
      console.error('Error updating client:', error);
      alert(error instanceof Error ? error.message : 'Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({
    label,
    field,
    description,
    accept,
    allowedTypes,
    disabled = false,
    hasExistingFile = false,
  }: {
    label: string;
    field: keyof typeof files;
    description: string;
    accept: string;
    allowedTypes: string[];
    disabled?: boolean;
    hasExistingFile?: boolean;
  }) => {
    const file = files[field];
    const existingFileUrl = getExistingFileUrl(field);

    const handleDivClick = () => {
      if (!file && !disabled) {
        const input = document.getElementById(field) as HTMLInputElement;
        input?.click();
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        const droppedFile = droppedFiles[0];
        if (validateFileType(droppedFile, allowedTypes)) {
          handleFileChange(field, droppedFile);
        } else {
          alert(
            `Please upload a valid file format: ${allowedTypes.join(', ')}`,
          );
        }
      }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      if (selectedFile) {
        if (validateFileType(selectedFile, allowedTypes)) {
          handleFileChange(field, selectedFile);
        } else {
          alert(
            `Please upload a valid file format: ${allowedTypes.join(', ')}`,
          );
          e.target.value = '';
        }
      }
    };

    return (
      <div className='space-y-2'>
        <Label htmlFor={field}>{label}</Label>
        {hasExistingFile && !file && existingFileUrl && (
          <div className='text-sm mb-2'>
            <a
              href={existingFileUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline'
            >
              {label}
              <ExternalLink className='h-3 w-3' />
            </a>
            <span className='text-gray-500 ml-2'>
              - Upload a new file to replace it
            </span>
          </div>
        )}
        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50'
              : file
              ? 'border-gray-300'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
          onClick={handleDivClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {file ? (
            <div className='flex items-center justify-between p-2 bg-gray-50 rounded'>
              <div className='flex items-center space-x-2'>
                <Upload className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-700'>{file.name}</span>
                <span className='text-xs text-gray-500'>
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <span className='text-xs text-orange-600 font-medium'>
                  (Will replace existing)
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(field);
                }}
                className='text-red-500 hover:text-red-700'
                disabled={disabled}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          ) : (
            <div className='text-center'>
              <Upload
                className={`mx-auto h-8 w-8 mb-2 ${
                  disabled ? 'text-gray-300' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-sm ${
                  disabled ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {disabled
                  ? 'Upload disabled during update'
                  : hasExistingFile
                  ? 'Click to upload replacement file'
                  : 'Click to upload or drag and drop'}
              </span>
              <p
                className={`text-xs mt-1 ${
                  disabled ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {description}
              </p>
              <input
                id={field}
                type='file'
                className='hidden'
                accept={accept}
                onChange={handleFileInputChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (fetchLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>Client not found</p>
          <Button onClick={() => router.push('/clients')} className='mt-4'>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4'
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbLink href='/clients'>Clients</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className='w-4 h-4 text-gray-400' />
            </BreadcrumbSeparator>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbPage>Edit {client.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className='lg:max-w-7xl bg-white px-8 pt-10'>
        <div className='grid grid-cols-2 gap-4 gap-y-8'>
          <section className='col-span-2'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-2xl font-bold mb-1'>Edit Client</h2>
                <p className='text-gray-500 text-base'>
                  Update client details and replace template files
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6 lg:max-w-2xl'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Client Name *</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder='Enter client name'
                  required
                  disabled={loading}
                />
              </div>

              <FileUploadField
                label='Media Plan Template'
                field='media_plan_template'
                description='Upload the media plan template file (.csv file only)'
                accept='.csv'
                allowedTypes={['.csv']}
                disabled={loading}
                hasExistingFile={!!client.media_plan_template}
              />

              <FileUploadField
                label='Media Plan Results Template'
                field='media_plan_results_template'
                description='Upload the media plan results template file (.csv file only)'
                accept='.csv'
                allowedTypes={['.csv']}
                disabled={loading}
                hasExistingFile={!!client.media_plan_results_template}
              />

              <FileUploadField
                label='Slides Template'
                field='slides_template'
                description='Upload the slides template file (.pptx file only)'
                accept='.pptx'
                allowedTypes={['.pptx']}
                disabled={loading}
                hasExistingFile={!!client.slides_template}
              />

              {/* Submit Button */}
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.push('/clients')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Updating...' : 'Update Client'}
                </Button>
              </div>
            </form>

            {/* Info Card */}
            <Card className='mt-6 lg:max-w-2xl'>
              <CardHeader>
                <CardTitle className='text-base'>
                  File Update Information
                </CardTitle>
              </CardHeader>
              <CardContent className='text-sm text-gray-600'>
                <ul className='space-y-2'>
                  <li>• Only upload files that you want to replace</li>
                  <li>
                    • Existing files will be automatically deleted when replaced
                  </li>
                  <li>
                    • If no new file is uploaded, the existing file will remain
                    unchanged
                  </li>
                  <li>
                    • Accepted formats: CSV for templates, PPTX for slides
                  </li>
                  <li>• Maximum file size: 10MB per file</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
