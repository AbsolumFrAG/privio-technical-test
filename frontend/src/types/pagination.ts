export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showSizeSelector?: boolean;
  showInfo?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Standard page sizes as defined in PRD
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

// Pagination utility functions
export const calculatePagination = (
  page: number,
  limit: number,
  totalCount: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNext,
    hasPrev,
  };
};

export const getPageRange = (
  currentPage: number,
  totalPages: number,
  delta: number = 2
): number[] => {
  const range: number[] = [];
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return range;
};

export const generatePageInfo = (
  currentPage: number,
  totalPages: number,
  totalItems: number
): string => {
  if (totalItems === 0) return "No items";

  const itemsPerPage = Math.ceil(totalItems / totalPages) || 1;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return `Showing ${startItem}-${endItem} of ${totalItems} items`;
};
