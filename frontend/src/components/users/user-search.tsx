import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { apiClient } from "@/lib/api";
import type { UserSearchResult, UserSearchResponse } from "@/types/user";
import type { PaginationMeta } from "@/types/pagination";
import { Search, User, Users, Calendar, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UserSearchProps {
  className?: string;
  onUserSelect?: (userId: string) => void;
}

function UserResultCard({ 
  user, 
  onSelect 
}: { 
  user: UserSearchResult; 
  onSelect?: (userId: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.steamAvatarUrl ? (
            <img
              src={user.steamAvatarUrl}
              alt={`${user.username}'s avatar`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">
              {user.username}
            </h3>
            {user.steamUsername && (
              <span className="text-sm text-muted-foreground truncate">
                ({user.steamUsername})
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{user.gameCount} games</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Joined {new Date(user.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(user.id)}
          >
            View Profile
          </Button>
        )}
      </div>
    </div>
  );
}

export function UserSearch({ className, onUserSelect }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  const performSearch = useCallback(
    async (searchQuery: string, page: number = 1) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setTotalResults(0);
        setPagination(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = {
          q: searchQuery.trim(),
          ...(page > 1 ? { page } : {}),
        };
        const response = await apiClient.searchUsers(params);

        if (response.error) {
          setError(response.error);
          setSearchResults([]);
          setTotalResults(0);
          setPagination(null);
        } else if (response.data) {
          const data = response.data as UserSearchResponse & {
            pagination?: PaginationMeta;
          };
          setSearchResults(data.users || []);
          setTotalResults(
            data.pagination?.totalCount || data.users?.length || 0
          );
          setPagination(data.pagination || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search users");
        setSearchResults([]);
        setTotalResults(0);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when query changes
    performSearch(debouncedQuery, 1);
  }, [debouncedQuery, performSearch]);

  useEffect(() => {
    if (hasSearched && query.trim()) {
      performSearch(query.trim(), currentPage);
    }
  }, [currentPage, hasSearched, performSearch, query]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
    setTotalResults(0);
    setCurrentPage(1);
    setPagination(null);
  };

  const handleUserSelect = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Search Users</h2>
        <p className="text-muted-foreground mb-4">
          Find other players and explore their game libraries
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search for users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Searching users...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button variant="outline" onClick={() => performSearch(query)}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && hasSearched && (
        <div className="mb-4">
          <p className="text-muted-foreground">
            {totalResults === 0
              ? `No users found for "${query}"`
              : `${totalResults} user${
                  totalResults === 1 ? "" : "s"
                } found for "${query}"`}
          </p>
        </div>
      )}

      {!isLoading && !error && searchResults.length > 0 && (
        <>
          <div className="space-y-4 mb-6">
            {searchResults.map((user) => (
              <UserResultCard 
                key={user.id} 
                user={user} 
                onSelect={handleUserSelect}
              />
            ))}
          </div>

          {pagination && (
            <SimplePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              disabled={isLoading}
            />
          )}
        </>
      )}

      {!isLoading &&
        !error &&
        hasSearched &&
        searchResults.length === 0 &&
        totalResults === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users found matching your search.</p>
            <p className="text-sm mt-2">Try adjusting your search terms.</p>
          </div>
        )}

      {!hasSearched && !query && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Start typing to search for users</p>
          <p className="text-sm mt-2">
            Find players with public profiles and explore their game collections
          </p>
        </div>
      )}
    </div>
  );
}