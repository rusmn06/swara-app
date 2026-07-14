import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ColumnConfig } from "../../types/swara";

interface Props<T> {
  columns: ColumnConfig<T>[];
  data: T[];
}

export default function SwaraDataTable<T extends Record<string, unknown>>({
  columns,
  data,
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.length === 0 && (
        <p className="text-center text-gray-400 py-8">Tidak ada data</p>
      )}
    </div>
  );
}