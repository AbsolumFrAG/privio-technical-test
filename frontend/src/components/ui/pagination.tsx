import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PaginationOptions, PAGE_SIZE_OPTIONS, getPageRange } from "@/types/pagination";

interface PaginationProps extends PaginationOptions {
  totalPages: number;
  totalItems: number;
}

export function Pagination({
  page,
  limit,
  totalPages,
  totalItems,
  onPageChange,
  onLimitChange,
  showSizeSelector = true,
  showInfo = true,
  disabled = false,
  className
}: PaginationProps) {
  // Don't render if there's only one page or no items
  if (totalPages <= 1 && !showInfo) {
    return null;
  }

  const pageRange = getPageRange(page, totalPages, 2);
  const showFirstLast = totalPages > 7;
  const showLeftEllipsis = pageRange[0] > 2;
  const showRightEllipsis = pageRange[pageRange.length - 1] < totalPages - 1;

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages || disabled) return;
    onPageChange(newPage);
  };

  const handleLimitChange = (newLimit: string) => {
    if (!onLimitChange || disabled) return;
    const limitNumber = parseInt(newLimit);
    onLimitChange(limitNumber);
    
    // Adjust page if necessary
    const newTotalPages = Math.ceil(totalItems / limitNumber);
    if (page > newTotalPages && newTotalPages > 0) {
      onPageChange(newTotalPages);
    }
  };

  const getItemRange = () => {
    if (totalItems === 0) return "0 items";
    
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, totalItems);
    
    return `Showing ${startItem}-${endItem} of ${totalItems} items`;
  };

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      {/* Items info and page size selector */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <span className="text-sm text-muted-foreground">
            {getItemRange()}
          </span>
        )}
        
        {showSizeSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select
              value={limit.toString()}
              onValueChange={handleLimitChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* First page */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={page === 1 || disabled}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || disabled}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* First page number (if not in range) */}
          {showLeftEllipsis && (
            <>
              <Button
                variant={page === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                1
              </Button>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </>
          )}

          {/* Page range */}
          {pageRange.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              {pageNum}
            </Button>
          ))}

          {/* Last page number (if not in range) */}
          {showRightEllipsis && (
            <>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={page === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                {totalPages}
              </Button>
            </>
          )}

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || disabled}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages || disabled}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default Pagination;