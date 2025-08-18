'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, ExternalLink, Folder } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import Link from 'next/link';

interface Client {
  id: number;
  name: string;
  media_plan_template?: string;
  media_plan_results_template?: string;
  slides_template?: string;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load clients',
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>Loading clients...</p>
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
              <BreadcrumbPage>Clients</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className='min-h-screen lg:max-w-7xl bg-white px-8 py-10'>
        <div className='grid grid-cols-2 gap-4 gap-y-8'>
          <section className='col-span-2'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-2xl font-bold mb-1'>Clients</h2>
                <p className='text-gray-500 text-base'>
                  Manage your agency's clients and their templates
                </p>
              </div>
              <Button className='bg-black text-white' asChild>
                <Link href={'/clients/new'}>Add New Client</Link>
              </Button>
            </div>
            <div className='bg-white rounded-lg border p-0 overflow-x-auto'>
              {error && (
                <Card className='mb-6'>
                  <CardContent className='pt-6'>
                    <div className='text-center text-red-600 dark:text-red-400'>
                      <p>{error}</p>
                      <Button
                        variant='outline'
                        onClick={fetchClients}
                        className='mt-4'
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!error && clients.length === 0 && (
                <Card>
                  <CardContent className='pt-6'>
                    <div className='text-center py-12'>
                      <Folder className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                        No clients yet
                      </h3>
                      <p className='text-gray-600 dark:text-gray-400 mb-6'>
                        Create your first client to get started with organizing
                        templates and projects
                      </p>
                      <Button onClick={() => router.push('/clients/new')}>
                        <Plus className='w-4 h-4 mr-2' />
                        Add First Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {clients.length > 0 && (
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {clients.map((client) => (
                    <Card
                      key={client.id}
                      className='hover:shadow-lg transition-shadow'
                    >
                      <CardHeader>
                        <CardTitle className='flex items-center justify-between'>
                          <span>{client.name}</span>
                        </CardTitle>
                        <CardDescription>
                          Created {formatDate(client.created_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3'>
                          {/* Template Links */}
                          {client.media_plan_template && (
                            <div className='flex items-center justify-between'>
                              <span className='text-sm text-gray-600 dark:text-gray-400'>
                                Media Plan Template
                              </span>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  window.open(
                                    client.media_plan_template,
                                    '_blank',
                                  )
                                }
                              >
                                <ExternalLink className='w-3 h-3' />
                              </Button>
                            </div>
                          )}

                          {client.media_plan_results_template && (
                            <div className='flex items-center justify-between'>
                              <span className='text-sm text-gray-600 dark:text-gray-400'>
                                Results Template
                              </span>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  window.open(
                                    client.media_plan_results_template,
                                    '_blank',
                                  )
                                }
                              >
                                <ExternalLink className='w-3 h-3' />
                              </Button>
                            </div>
                          )}

                          {client.slides_template && (
                            <div className='flex items-center justify-between'>
                              <span className='text-sm text-gray-600 dark:text-gray-400'>
                                Slides Template
                              </span>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  window.open(client.slides_template, '_blank')
                                }
                              >
                                <ExternalLink className='w-3 h-3' />
                              </Button>
                            </div>
                          )}

                          {/* No templates message */}
                          {!client.media_plan_template &&
                            !client.media_plan_results_template &&
                            !client.slides_template && (
                              <p className='text-sm text-gray-500 italic'>
                                No template files configured
                              </p>
                            )}
                        </div>

                        <div className='mt-4 pt-4 border-t'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                            onClick={() => router.push(`/clients/${client.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
