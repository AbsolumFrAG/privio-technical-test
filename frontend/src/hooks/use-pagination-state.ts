import { DEFAULT_PAGE_SIZE, type PaginationMeta } from "@/types/pagination";
import { useCallback, useEffect, useState } from "react";

interface UsePaginationStateOptions {
  defaultPage?: number;
  defaultLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

interface PaginationState extends PaginationMeta {
  updatePage: (page: number) => void;
  updateLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setTotalCount: (count: number) => void;
  reset: () => void;
}

/**
 * Hook for managing pagination state
 * Provides pagination controls and automatically calculates derived values
 */
export function usePaginationState({
  defaultPage = 1,
  defaultLimit = DEFAULT_PAGE_SIZE,
  onPageChange,
  onLimitChange,
}: UsePaginationStateOptions = {}): PaginationState {
  const [page, setPage] = useState(defaultPage);
  const [limit, setLimit] = useState(defaultLimit);
  const [totalCount, setTotalCount] = useState(0);

  // Calculate derived values
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Ensure current page is within valid range when totalPages changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
      onPageChange?.(totalPages);
    }
  }, [totalPages, page, onPageChange]);

  const updatePage = useCallback(
    (newPage: number) => {
      if (
        newPage === page ||
        newPage < 1 ||
        (totalPages > 0 && newPage > totalPages)
      ) {
        return;
      }
      setPage(newPage);
      onPageChange?.(newPage);
    },
    [page, totalPages, onPageChange]
  );

  const updateLimit = useCallback(
    (newLimit: number) => {
      if (newLimit === limit || newLimit < 1) {
        return;
      }

      setLimit(newLimit);
      // Reset to page 1 when changing limit
      setPage(1);
      onLimitChange?.(newLimit);
      onPageChange?.(1);
    },
    [limit, onLimitChange, onPageChange]
  );

  const nextPage = useCallback(() => {
    if (hasNext) {
      updatePage(page + 1);
    }
  }, [hasNext, page, updatePage]);

  const previousPage = useCallback(() => {
    if (hasPrev) {
      updatePage(page - 1);
    }
  }, [hasPrev, page, updatePage]);

  const goToFirstPage = useCallback(() => {
    updatePage(1);
  }, [updatePage]);

  const goToLastPage = useCallback(() => {
    if (totalPages > 0) {
      updatePage(totalPages);
    }
  }, [totalPages, updatePage]);

  const reset = useCallback(() => {
    setPage(defaultPage);
    setLimit(defaultLimit);
    setTotalCount(0);
    onPageChange?.(defaultPage);
    onLimitChange?.(defaultLimit);
  }, [defaultPage, defaultLimit, onPageChange, onLimitChange]);

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNext,
    hasPrev,
    updatePage,
    updateLimit,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setTotalCount,
    reset,
  };
}
