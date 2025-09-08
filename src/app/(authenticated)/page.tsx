'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  MoreHorizontal,
  Folder,
  ExternalLink,
  Filter,
  Calendar,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  id: string;
  name: string;
}

interface Report {
  id: string;
  name: string;
  client_id: string;
  status: 'ready' | 'in-process' | 'failed';
  report_link?: string;
  report_id?: string;
  media_plan_link?: string;
  media_plan_id?: string;
  media_results_link?: string;
  media_results_id?: string;
  generated_by: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  clients: Client;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchReports();
    fetchClients();
  }, [selectedClient, selectedStatus, startDate, endDate]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClient) params.append('client_id', selectedClient);
      if (selectedStatus) params.append('status', selectedStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/v1/reports?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load reports',
      );
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge
            variant='secondary'
            className='bg-green-100 text-green-800 hover:bg-green-100'
          >
            Ready
          </Badge>
        );
      case 'in-process':
        return (
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
          >
            In Process
          </Badge>
        );
      case 'failed':
        return (
          <Badge
            variant='secondary'
            className='bg-red-100 text-red-800 hover:bg-red-100'
          >
            Failed
          </Badge>
        );
      default:
        return (
          <Badge
            variant='secondary'
            className='bg-gray-100 text-gray-800 hover:bg-gray-100'
          >
            {status}
          </Badge>
        );
    }
  };

  const getReportLink = (report: Report) => {
    if (report.status === 'ready' && report.report_link) {
      return (
        <Button variant='ghost' size='sm' asChild className='h-6 w-6 p-0'>
          <a
            href={report.report_link}
            target='_blank'
            rel='noopener noreferrer'
            title='Open report'
          >
            <ExternalLink className='h-3 w-3' />
          </a>
        </Button>
      );
    }
    return <span className='text-gray-400'>-</span>;
  };

  const getDataFiles = (report: Report) => {
    const files = [];
    if (report.media_plan_link) {
      files.push(
        <Button
          key='media-plan'
          variant='ghost'
          size='sm'
          asChild
          className='h-6 w-6 p-0 mr-1'
        >
          <a
            href={report.media_plan_link}
            target='_blank'
            rel='noopener noreferrer'
            title='View Media Plan CSV'
          >
            <ExternalLink className='h-3 w-3' />
          </a>
        </Button>,
      );
    }
    if (report.media_results_link) {
      files.push(
        <Button
          key='media-results'
          variant='ghost'
          size='sm'
          asChild
          className='h-6 w-6 p-0'
        >
          <a
            href={report.media_results_link}
            target='_blank'
            rel='noopener noreferrer'
            title='View Media Results CSV'
          >
            <ExternalLink className='h-3 w-3' />
          </a>
        </Button>,
      );
    }
    return files.length > 0 ? (
      <div className='flex'>{files}</div>
    ) : (
      <span className='text-gray-400'>-</span>
    );
  };

  const clearFilters = () => {
    setSelectedClient('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: 'name',
      header: 'Report Name',
      cell: ({ row }) => {
        return (
          <div className='font-medium'>
            {row.getValue('name')}
            {row.original.error_message && (
              <div
                className='text-xs text-red-600 mt-1'
                title={row.original.error_message}
              >
                Error: {row.original.error_message.substring(0, 50)}...
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'clients.name',
      header: 'Client',
      cell: ({ row }) => {
        return <div className='text-sm'>{row.original.clients.name}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return getStatusBadge(row.getValue('status'));
      },
    },
    {
      id: 'data_files',
      header: 'Data Files',
      cell: ({ row }) => {
        return getDataFiles(row.original);
      },
    },
    {
      id: 'report',
      header: 'Report',
      cell: ({ row }) => {
        return getReportLink(row.original);
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return (
          <div className='text-sm text-gray-600'>
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const report = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>View details</DropdownMenuItem>
              {report.status === 'ready' && report.report_link && (
                <DropdownMenuItem asChild>
                  <a
                    href={report.report_link}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Open report
                  </a>
                </DropdownMenuItem>
              )}
              {report.media_plan_link && (
                <DropdownMenuItem asChild>
                  <a
                    href={report.media_plan_link}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Download Media Plan
                  </a>
                </DropdownMenuItem>
              )}
              {report.media_results_link && (
                <DropdownMenuItem asChild>
                  <a
                    href={report.media_results_link}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Download Media Results
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className='text-red-600'>
                Delete report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: reports,
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
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>Loading reports...</p>
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
              <BreadcrumbPage>Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className='lg:max-w-7xl bg-white px-8 pt-10'>
        <div className='grid grid-cols-2 gap-4 gap-y-8'>
          <section className='col-span-2'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-2xl font-bold mb-1'>Reports</h2>
                <p className='text-gray-500 text-base'>
                  View and manage your generated reports
                </p>
              </div>
              <Button className='bg-black text-white' asChild>
                <Link href='/reports/new'>
                  <Plus className='w-4 h-4' />
                  Generate Report
                </Link>
              </Button>
            </div>

            {/* Filters */}
            <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-4 flex-wrap'>
                <div className='flex items-center gap-2'>
                  <Filter className='w-4 h-4 text-gray-600' />
                  <span className='text-sm font-medium text-gray-700'>
                    Filters:
                  </span>
                </div>

                <Select
                  value={selectedClient}
                  onValueChange={(value) =>
                    setSelectedClient(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className='w-48 bg-white'>
                    <SelectValue placeholder='All Clients' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setSelectedStatus(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className='w-40 bg-white'>
                    <SelectValue placeholder='All Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='ready'>Ready</SelectItem>
                    <SelectItem value='in-process'>In Process</SelectItem>
                    <SelectItem value='failed'>Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='bg-white'>
                      <Calendar className='w-4 h-4' />
                      Date Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-80'>
                    <div className='grid gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='start-date'>Start Date</Label>
                        <Input
                          id='start-date'
                          type='date'
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='end-date'>End Date</Label>
                        <Input
                          id='end-date'
                          type='date'
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {(selectedClient || selectedStatus || startDate || endDate) && (
                  <Button
                    variant='outline'
                    onClick={clearFilters}
                    className='bg-white'
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <div className='bg-white rounded-lg border overflow-hidden'>
              {error && (
                <Card className='mb-6'>
                  <CardContent className='pt-6'>
                    <div className='text-center text-red-600 dark:text-red-400'>
                      <p>{error}</p>
                      <Button
                        variant='outline'
                        onClick={fetchReports}
                        className='mt-4'
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!error && reports.length === 0 && (
                <Card>
                  <CardContent className='pt-6'>
                    <div className='text-center py-12'>
                      <Folder className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                        No reports yet
                      </h3>
                      <p className='text-gray-600 dark:text-gray-400 mb-6'>
                        Generate your first report to get started
                      </p>
                      <Button asChild>
                        <Link href='/reports/new'>
                          <Plus className='w-4 h-4 mr-2' />
                          Generate First Report
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Table */}
              {reports.length > 0 && (
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
