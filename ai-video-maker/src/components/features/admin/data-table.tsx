'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = '검색...',
  searchKey,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onRowClick,
  isLoading = false,
  emptyMessage = '데이터가 없습니다.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 검색 필터링
  const filteredData = searchable && searchKey && search
    ? data.filter((item) => {
        const value = item[searchKey];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      })
    : data;

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  // 페이지 변경
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // 페이지 사이즈 변경
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  // 셀 값 가져오기
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(item);
    }
    const value = item[column.key as keyof T];
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* 검색 */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn('bg-gray-50 dark:bg-gray-900', column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-rose-600" />
                  </div>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-gray-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={column.className}
                    >
                      {getCellValue(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>페이지당</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              총 {filteredData.length}개 중 {startIndex + 1}-
              {Math.min(endIndex, filteredData.length)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 text-sm">
              {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
