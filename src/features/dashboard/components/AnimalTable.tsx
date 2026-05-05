import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';

interface Animal {
  id: string;
  name: string | null;
  species: string | null;
  category: string | null;
}

interface AnimalTableProps {
  animals: Animal[];
}

const columnHelper = createColumnHelper<Animal>();

const columns = [
  columnHelper.accessor('name', { cell: (info) => info.getValue() || 'Unnamed', header: 'Name' }),
  columnHelper.accessor('species', { cell: (info) => info.getValue(), header: 'Species' }),
  columnHelper.accessor('category', { cell: (info) => info.getValue(), header: 'Category' }),
];

export function AnimalTable({ animals }: AnimalTableProps) {
  const table = useReactTable({
    data: animals,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-lg overflow-hidden">
      <table className="w-full text-left text-xs text-slate-400">
        <thead className="bg-slate-900 text-slate-500 uppercase tracking-wider">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-800 hover:bg-slate-800/30">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
