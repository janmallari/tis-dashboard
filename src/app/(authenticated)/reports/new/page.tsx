'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Upload, X, FileText } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Client {
  id: string;
  name: string;
}

export default function NewReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
  });

  const [files, setFiles] = useState({
    media_plan: null as File | null,
    media_results: null as File | null,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/v1/clients');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
      }

      const data = await response.json();
      console.log('Fetched clients:', data.clients); // Debug log
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Failed to load clients');
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

  const validateFileType = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return fileExtension === '.csv';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a report name');
      return;
    }

    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    if (!files.media_plan) {
      alert('Please upload a media plan CSV file');
      return;
    }

    if (!files.media_results) {
      alert('Please upload a media results CSV file');
      return;
    }

    // Validate file types
    if (!validateFileType(files.media_plan)) {
      alert('Media Plan must be a CSV file');
      return;
    }

    if (!validateFileType(files.media_results)) {
      alert('Media Results must be a CSV file');
      return;
    }

    setLoading(true);

    try {
      // Create FormData to handle file uploads
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('client_id', formData.client_id);
      submitData.append('media_plan', files.media_plan);
      submitData.append('media_results', files.media_results);

      const response = await fetch('/api/v1/reports', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create report');
      }

      // Redirect to reports list
      router.push('/');
    } catch (error) {
      console.error('Error creating report:', error);
      alert(error instanceof Error ? error.message : 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({
    label,
    field,
    description,
    disabled = false,
  }: {
    label: string;
    field: keyof typeof files;
    description: string;
    disabled?: boolean;
  }) => {
    const file = files[field];

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
        if (validateFileType(droppedFile)) {
          handleFileChange(field, droppedFile);
        } else {
          alert('Please upload a valid CSV file');
        }
      }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      if (selectedFile) {
        if (validateFileType(selectedFile)) {
          handleFileChange(field, selectedFile);
        } else {
          alert('Please upload a valid CSV file');
          e.target.value = '';
        }
      }
    };

    return (
      <div className='space-y-2'>
        <Label htmlFor={field}>{label} *</Label>
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
                <FileText className='w-4 h-4 text-green-600' />
                <span className='text-sm text-gray-700'>{file.name}</span>
                <span className='text-xs text-gray-500'>
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
                  ? 'Upload disabled during creation'
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
                accept='.csv'
                onChange={handleFileInputChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

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
              <BreadcrumbLink href='/'>Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className='w-4 h-4 text-gray-400' />
            </BreadcrumbSeparator>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbPage>Generate New Report</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className='lg:max-w-7xl bg-white px-8 pt-10'>
        <div className='grid grid-cols-2 gap-4 gap-y-8'>
          <section className='col-span-2'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-2xl font-bold mb-1'>Generate New Report</h2>
                <p className='text-gray-500 text-base'>
                  Upload your data files to generate a new report
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6 lg:max-w-2xl'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Report Name *</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder='Enter report name (e.g., Monthly Performance Report - Jan 2024)'
                  required
                  disabled={loading}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='client'>Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    handleInputChange('client_id', value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a client' />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FileUploadField
                label='Media Plan Data'
                field='media_plan'
                description='Upload the media plan CSV file with campaign data'
                disabled={loading}
              />

              <FileUploadField
                label='Media Results Data'
                field='media_results'
                description='Upload the media results CSV file with performance data'
                disabled={loading}
              />

              {/* Submit Button */}
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.push('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Generating Report...' : 'Generate Report'}
                </Button>
              </div>
            </form>

            {/* Info Card */}
            <Card className='mt-6 lg:max-w-2xl'>
              <CardHeader>
                <CardTitle className='text-base'>
                  Report Generation Process
                </CardTitle>
              </CardHeader>
              <CardContent className='text-sm text-gray-600'>
                <ul className='space-y-2'>
                  <li>• Upload your media plan and results CSV files</li>
                  <li>
                    • Our AI will process the data using your client templates
                  </li>
                  <li>
                    • A PowerPoint presentation will be generated automatically
                  </li>
                  <li>• You&apos;ll be notified when the report is ready</li>
                  <li>• Processing typically takes 2-5 minutes</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
