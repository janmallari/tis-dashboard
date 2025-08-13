'use client';
import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

export type Report = {
  id: string;
  name: string;
  client: string;
  status: 'ready' | 'in_process' | 'failed';
  generatedBy: string;
  reportUrl?: string;
};

interface ReportsTableProps {
  data: Report[];
}

const columns: ColumnDef<Report>[] = [
  {
    accessorKey: 'name',
    header: () => (
      <span className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
        Report Name
      </span>
    ),
    cell: (info) => (
      <span className='text-sm font-medium text-gray-900 whitespace-nowrap'>
        {String(info.getValue())}
      </span>
    ),
    size: 100, // width in pixels
    maxSize: 100,
  },
  {
    accessorKey: 'client',
    header: () => (
      <span className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
        Client
      </span>
    ),
    cell: (info) => (
      <span className='text-sm font-medium text-gray-900 whitespace-nowrap'>
        {String(info.getValue())}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: () => (
      <span className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
        Status
      </span>
    ),
    cell: (info) => {
      const status = info.getValue();
      if (status === 'ready') {
        return (
          <Badge className='bg-green-100 text-green-700 rounded-full text-xs font-bold'>
            Ready
          </Badge>
        );
      }
      if (status === 'in_process') {
        return (
          <Badge className='bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1'>
            <span className='inline-block w-3 h-3 mr-1 align-middle'>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='#A0AEC0'
                  strokeWidth='2'
                />
                <path
                  d='M12 6v6l4 2'
                  stroke='#A0AEC0'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </span>
            In Process
          </Badge>
        );
      }
      if (status === 'failed') {
        return (
          <Badge className='bg-red-100 text-red-700 rounded-full text-xs font-bold'>
            Failed
          </Badge>
        );
      }
      return null;
    },
  },
  {
    accessorKey: 'reportUrl',
    header: () => (
      <span className='text-sm font-semibold text-gray-700 whitespace-nowrap'>
        Report
      </span>
    ),
    cell: (info) => {
      const url = info.getValue();
      return url ? (
        <a
          href={url as string}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 text-blue-600 hover:underline text-sm'
        >
          <ExternalLink size={14} className='mr-1' />
          {(url as string).split('/').pop()?.slice(0, 24) + '...'}
        </a>
      ) : (
        <span className='text-gray-400'>-</span>
      );
    },
  },
  {
    id: 'actions',
    cell: () => <span className='text-right'>•••</span>,
  },
];

export function ReportsTable({ data }: ReportsTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className='whitespace-nowrap px-2 py-2'
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
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className='whitespace-nowrap px-2 py-2'>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
