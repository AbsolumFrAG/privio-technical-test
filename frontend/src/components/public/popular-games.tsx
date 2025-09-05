import { Button } from "@/components/ui/button";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { apiClient } from "@/lib/api";
import type { PopularGamesResponse, PublicGame } from "@/types/game";
import type { PaginationMeta } from "@/types/pagination";
import { Clock, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface PopularGamesProps {
  className?: string;
}

function GameCard({ game }: { game: PublicGame }) {
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

export function PopularGames({ className }: PopularGamesProps) {
  const [popularGames, setPopularGames] = useState<PopularGamesResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"topRated" | "mostPlayed">(
    "topRated"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const loadPopularGames = async (
    page: number = 1,
    type: "both" | "topRated" | "mostPlayed" = "both"
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params =
        page > 1 && type !== "both"
          ? { page, type }
          : type !== "both"
          ? { type }
          : {};
      const response = await apiClient.getPopularGames(params);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const data = response.data as PopularGamesResponse & {
          pagination?: PaginationMeta;
        };
        setPopularGames(data);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load popular games"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPopularGames();
  }, []);

  // Load paginated data when switching tabs or pages
  useEffect(() => {
    if (activeTab === "topRated" || activeTab === "mostPlayed") {
      loadPopularGames(currentPage, activeTab);
    }
  }, [activeTab, currentPage]);

  const handleTabChange = (tab: "topRated" | "mostPlayed") => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when switching tabs
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading popular games...</p>
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

  if (!popularGames) {
    return null;
  }

  const currentGames =
    activeTab === "topRated" ? popularGames.topRated : popularGames.mostPlayed;

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Popular Games</h2>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "topRated" ? "default" : "outline"}
            onClick={() => handleTabChange("topRated")}
            className="flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Top Rated
          </Button>
          <Button
            variant={activeTab === "mostPlayed" ? "default" : "outline"}
            onClick={() => handleTabChange("mostPlayed")}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Most Played
          </Button>
        </div>
      </div>

      {currentGames.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No games found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {currentGames.map((game) => (
              <GameCard key={game.id} game={game} />
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
