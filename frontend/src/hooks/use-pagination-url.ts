import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { useCallback, useEffect, useState, useMemo } from "react";

interface UsePaginationUrlOptions {
  defaultPage?: number;
  defaultLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onFiltersChange?: (filters: Record<string, string | number>) => void;
}

interface PaginationUrlState {
  page: number;
  limit: number;
  filters: Record<string, string | number>;
  updatePage: (page: number) => void;
  updateLimit: (limit: number) => void;
  updateFilters: (filters: Record<string, string | number>) => void;
  clearFilters: () => void;
}

/**
 * Hook for synchronizing pagination state with URL search parameters
 * Useful for maintaining pagination state across page refreshes and enabling sharing of URLs
 */
export function usePaginationUrl({
  defaultPage = 1,
  defaultLimit = DEFAULT_PAGE_SIZE,
  onPageChange,
  onLimitChange,
  onFiltersChange,
}: UsePaginationUrlOptions = {}): PaginationUrlState {
  const [urlParams, setUrlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params;
  });

  // Extract current values from URL
  const page = parseInt(urlParams.get("page") || defaultPage.toString(), 10);
  const limit = parseInt(urlParams.get("limit") || defaultLimit.toString(), 10);

  // Extract filter parameters (excluding page and limit)
  const filters = useMemo(() => {
    const result: Record<string, string | number> = {};
    Array.from(urlParams.entries()).forEach(([key, value]) => {
      if (key !== "page" && key !== "limit") {
        // Try to parse as number, otherwise keep as string
        const numericValue = parseFloat(value);
        result[key] =
          !isNaN(numericValue) && isFinite(numericValue) ? numericValue : value;
      }
    });
    return result;
  }, [urlParams]);

  // Update URL when parameters change
  const updateSearchParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const newParams = new URLSearchParams(urlParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value.toString());
        }
      });

      // Update the URL in the browser
      const newUrl = `${window.location.pathname}${
        newParams.toString() ? `?${newParams.toString()}` : ""
      }`;
      window.history.pushState(null, "", newUrl);

      setUrlParams(newParams);
    },
    [urlParams]
  );

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setUrlParams(params);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updatePage = useCallback(
    (newPage: number) => {
      if (newPage === 1) {
        // Remove page parameter when it's the default
        updateSearchParams({ page: null });
      } else {
        updateSearchParams({ page: newPage });
      }
      onPageChange?.(newPage);
    },
    [updateSearchParams, onPageChange]
  );

  const updateLimit = useCallback(
    (newLimit: number) => {
      // Reset to page 1 when changing page size
      const updates: Record<string, string | number | null> = {
        page: null, // Reset to page 1
      };

      if (newLimit === defaultLimit) {
        updates.limit = null; // Remove limit parameter when it's the default
      } else {
        updates.limit = newLimit;
      }

      updateSearchParams(updates);
      onLimitChange?.(newLimit);
      onPageChange?.(1);
    },
    [updateSearchParams, defaultLimit, onLimitChange, onPageChange]
  );

  const updateFilters = useCallback(
    (newFilters: Record<string, string | number>) => {
      const updates: Record<string, string | number | null> = {
        page: null, // Reset to page 1 when filters change
      };

      // Add new filter values
      Object.entries(newFilters).forEach(([key, value]) => {
        updates[key] = value;
      });

      updateSearchParams(updates);
      onFiltersChange?.(newFilters);
      onPageChange?.(1);
    },
    [updateSearchParams, onFiltersChange, onPageChange]
  );

  const clearFilters = useCallback(() => {
    // Keep only page and limit parameters
    const newParams = new URLSearchParams();
    if (page !== 1) newParams.set("page", page.toString());
    if (limit !== defaultLimit) newParams.set("limit", limit.toString());

    // Update the URL in the browser
    const newUrl = `${window.location.pathname}${
      newParams.toString() ? `?${newParams.toString()}` : ""
    }`;
    window.history.pushState(null, "", newUrl);

    setUrlParams(newParams);
    onFiltersChange?.({});
  }, [page, limit, defaultLimit, onFiltersChange]);

  // Trigger callbacks when URL changes externally
  useEffect(() => {
    if (page !== defaultPage) {
      onPageChange?.(page);
    }
  }, [page, defaultPage, onPageChange]);

  useEffect(() => {
    if (limit !== defaultLimit) {
      onLimitChange?.(limit);
    }
  }, [limit, defaultLimit, onLimitChange]);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      onFiltersChange?.(filters);
    }
  }, [filters, onFiltersChange]);

  return {
    page,
    limit,
    filters,
    updatePage,
    updateLimit,
    updateFilters,
    clearFilters,
  };
}
