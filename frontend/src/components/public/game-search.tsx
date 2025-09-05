import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { apiClient } from "@/lib/api";
import type {
  PublicGameSearchResponse,
  PublicGameSearchResult,
} from "@/types/game";
import type { PaginationMeta } from "@/types/pagination";
import { Clock, Search, Star, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface GameSearchProps {
  className?: string;
}

function SearchResultCard({ game }: { game: PublicGameSearchResult }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      {game.imageUrl && (
        <img
          src={game.imageUrl}
          alt={game.title}
          className="w-full h-32 object-cover rounded-md mb-3"
        />
      )}

      <h3
        className="font-semibold text-lg mb-2 line-clamp-1"
        title={game.title}
      >
        {game.title}
      </h3>

      <div className="space-y-2 text-sm text-muted-foreground">
        {game.averageRating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{game.averageRating.toFixed(1)}</span>
          </div>
        )}

        {game.totalPlayers && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{game.totalPlayers} players</span>
          </div>
        )}

        {game.totalHoursPlayed && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{game.totalHoursPlayed}h total</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GameSearch({ className }: GameSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicGameSearchResult[]>(
    []
  );
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
        const params =
          page > 1
            ? { q: searchQuery.trim(), page }
            : { q: searchQuery.trim() };
        const response = await apiClient.searchPublicGames(params);

        if (response.error) {
          setError(response.error);
          setSearchResults([]);
          setTotalResults(0);
          setPagination(null);
        } else if (response.data) {
          const data = response.data as PublicGameSearchResponse & {
            pagination?: PaginationMeta;
          };
          setSearchResults(data.games || []);
          setTotalResults(
            data.pagination?.totalCount || data.games?.length || 0
          );
          setPagination(data.pagination || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search games");
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

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Search Games</h2>
        <p className="text-muted-foreground mb-4">
          Find games that other players have added to their collections
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search for games..."
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
          <p className="mt-4 text-muted-foreground">Searching games...</p>
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
              ? `No games found for "${query}"`
              : `${totalResults} game${
                  totalResults === 1 ? "" : "s"
                } found for "${query}"`}
          </p>
        </div>
      )}

      {!isLoading && !error && searchResults.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {searchResults.map((game) => (
              <SearchResultCard key={game.id} game={game} />
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
            <p>No games found matching your search.</p>
            <p className="text-sm mt-2">Try adjusting your search terms.</p>
          </div>
        )}

      {!hasSearched && !query && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Start typing to search for games</p>
          <p className="text-sm mt-2">
            Search through games added by other players
          </p>
        </div>
      )}
    </div>
  );
}
