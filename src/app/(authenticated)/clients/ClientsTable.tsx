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

type Client = {
  name: string;
  reports: number;
  mediaPlan: { text: string; className?: string };
  mediaResults: { text: string; className?: string };
  slides: { text: string; className?: string };
};

interface ClientsTableProps {
  data: Client[];
}

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'name',
    header: 'Client',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'reports',
    header: 'Reports Generated',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'mediaPlan',
    header: 'Media Plan Template',
    cell: (info) => {
      const value = info.getValue() as { text: string; className?: string };
      return (
        <Badge variant='default' className={value.className}>
          {value.text}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'mediaResultsa',
    header: 'Media Results Template',
    cell: (info) => {
      const value = info.getValue() as { text: string; className?: string };
      return (
        <Badge variant='default' className={value.className}>
          {value.text}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'slides',
    header: 'Slides Template',
    cell: (info) => {
      const value = info.getValue() as { text: string; className?: string };
      return (
        <Badge variant='default' className={value.className}>
          {value.text}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: () => <span className='text-right'>•••</span>,
  },
];

export function ClientsTable({ data }: ClientsTableProps) {
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
              <TableHead key={header.id}>
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
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
