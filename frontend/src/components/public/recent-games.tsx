import { Button } from "@/components/ui/button";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { apiClient } from "@/lib/api";
import type { PublicGame, RecentGamesResponse } from "@/types/game";
import type { PaginationMeta } from "@/types/pagination";
import { Calendar, Clock, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface RecentGamesProps {
  className?: string;
}

function RecentGameCard({ game }: { game: PublicGame }) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      {game.imageUrl && (
        <div className="relative w-full h-32 mb-3">
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-full h-full object-cover rounded-md"
            onError={(e) => {
              e.currentTarget.parentElement!.innerHTML = `
                <div class="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center text-4xl">
                  🎮
                </div>
              `;
            }}
          />
        </div>
      )}

      <h3
        className="font-semibold text-lg mb-2 line-clamp-1"
        title={game.title}
      >
        {game.title}
      </h3>

      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <Calendar className="w-4 h-4" />
        <span>{formatDate(game.recentlyAddedAt)}</span>
      </div>

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

export function RecentGames({ className }: RecentGamesProps) {
  const [recentGames, setRecentGames] = useState<PublicGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const loadRecentGames = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = page > 1 ? { page } : {};
      const response = await apiClient.getRecentGames(params);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const data = response.data as RecentGamesResponse & {
          pagination?: PaginationMeta;
        };
        setRecentGames(data.games || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recent games"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentGames(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recent games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Recently Added Games</h2>
        <p className="text-muted-foreground">
          Discover what other players have been adding to their collections
        </p>
      </div>

      {recentGames.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent games found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {recentGames.map((game) => (
              <RecentGameCard
                key={`${game.id}-${game.recentlyAddedAt}`}
                game={game}
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
    </div>
  );
}
