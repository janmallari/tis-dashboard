'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MoreHorizontal, Folder, ExternalLink } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';

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

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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

  const getTemplateStatus = (templateUrl?: string, templateId?: string) => {
    if (templateUrl && templateId) {
      return (
        <div className='flex items-center gap-2'>
          <Badge
            variant='secondary'
            className='bg-green-100 text-green-800 hover:bg-green-100'
          >
            Uploaded
          </Badge>
          <Button variant='ghost' size='sm' asChild className='h-6 w-6 p-0'>
            <a
              href={templateUrl}
              target='_blank'
              rel='noopener noreferrer'
              title='Open file'
            >
              <ExternalLink className='h-3 w-3' />
            </a>
          </Button>
        </div>
      );
    }
    return (
      <Badge
        variant='secondary'
        className='bg-gray-100 text-gray-800 hover:bg-gray-100'
      >
        Pending
      </Badge>
    );
  };

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: 'Client',
      cell: ({ row }) => {
        return <div className='font-medium'>{row.getValue('name')}</div>;
      },
    },
    {
      id: 'reports_generated',
      header: 'Reports Generated',
      cell: () => {
        // This would come from your reports API - placeholder for now
        return <div className='text-sm'>0</div>;
      },
    },
    {
      accessorKey: 'media_plan_template',
      header: 'Media Plan Template',
      cell: ({ row }) => {
        return getTemplateStatus(
          row.getValue('media_plan_template'),
          row.original.media_plan_template_id,
        );
      },
    },
    {
      accessorKey: 'media_plan_results_template',
      header: 'Media Results Template',
      cell: ({ row }) => {
        return getTemplateStatus(
          row.getValue('media_plan_results_template'),
          row.original.media_plan_results_template_id,
        );
      },
    },
    {
      accessorKey: 'slides_template',
      header: 'Slides Template',
      cell: ({ row }) => {
        return getTemplateStatus(
          row.getValue('slides_template'),
          row.original.slides_template_id,
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const client = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem className='text-red-600'>
                Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: clients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  if (loading) {
    return (
      <div className='min-h-screen  flex items-center justify-center'>
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

      <main className='lg:max-w-7xl bg-white px-8 pt-10'>
        <div className='grid grid-cols-2 gap-4 gap-y-8'>
          <section className='col-span-2'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-2xl font-bold mb-1'>Clients</h2>
                <p className='text-gray-500 text-base'>
                  Manage your clients data and upload templates
                </p>
              </div>
              <Button className='bg-black text-white' asChild>
                <Link href={'/clients/new'}>Add New Client</Link>
              </Button>
            </div>

            <div className='bg-white rounded-lg border overflow-hidden'>
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

              {/* Table */}
              {clients.length > 0 && (
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className='border-b bg-gray-50/50'
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className='font-medium text-gray-700'
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                          className='hover:bg-gray-50/50'
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className='py-4'>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className='h-24 text-center'
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
