import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Game } from "@/types/game";
import { GAME_STATUS_LABELS, GameSource } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Edit,
  MoreVertical,
  Star,
  Gamepad2,
  Trash2,
} from "lucide-react";

interface GameItemProps {
  game: Game;
  onEdit: () => void;
  onDelete: () => void;
}

export function GameItem({ game, onEdit, onDelete }: GameItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatHours = (hours?: number) => {
    if (!hours || hours === 0) return "Not tracked";
    return hours === 1 ? "1 hour" : `${hours} hours`;
  };

  const getRatingStars = (rating?: number) => {
    if (!rating || rating === 0) return "No rating";

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex items-center gap-1">
        {"★".repeat(fullStars)}
        {hasHalfStar && "☆"}
        {"☆".repeat(emptyStars)}
        <span className="ml-1 text-sm">({rating})</span>
      </div>
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PLAYING":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "DROPPED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "BACKLOG":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex items-start justify-between">
        {/* Game Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            {/* Cover Image */}
            {game.imageUrl ? (
              <div className="relative w-16 h-20 flex-shrink-0">
                <img
                  src={game.imageUrl}
                  alt={`${game.title} cover`}
                  className="w-full h-full object-cover rounded border"
                  onError={(e) => {
                    // Replace with fallback on error
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-16 h-20 bg-muted rounded border flex items-center justify-center text-2xl">
                        🎮
                      </div>
                    `;
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-20 bg-muted rounded border flex items-center justify-center text-2xl flex-shrink-0">
                🎮
              </div>
            )}

            {/* Game Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 truncate">
                {game.title}
              </h3>

              {/* Status and Source Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    game.status
                  )}`}
                >
                  {game.status ? GAME_STATUS_LABELS[game.status] : "Unknown"}
                </span>
                
                {game.source === GameSource.STEAM && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Gamepad2 className="h-3 w-3" />
                    Steam
                  </Badge>
                )}
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>
                    {typeof game.rating === "number"
                      ? getRatingStars(game.rating)
                      : "No rating"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatHours(game.hoursPlayed)}
                    {game.source === GameSource.STEAM && game.steamPlaytime && (
                      <span className="text-xs ml-1 opacity-75">
                        (Steam: {Math.round(game.steamPlaytime / 60)}h)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(game.createdAt)}</span>
                </div>

                {game.lastPlayedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Last: {formatDate(game.lastPlayedAt)}</span>
                  </div>
                )}
              </div>

              {/* Notes Preview */}
              {game.notes && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {game.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {game.source === GameSource.STEAM && game.steamAppId && (
              <DropdownMenuItem
                onClick={() => window.open(`https://store.steampowered.com/app/${game.steamAppId}`, '_blank')}
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                View on Steam
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
