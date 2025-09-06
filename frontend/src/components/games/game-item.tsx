import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Game } from "@/types/game";
import { GAME_STATUS_LABELS, GameSource } from "@/types/game";
import { t } from "@/lib/translations";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
  Gamepad2,
  MoreVertical,
  Pause,
  Play,
  Star,
  StarHalf,
  Timer,
  Trash2,
  XCircle,
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
    if (!hours || hours === 0) return t("notTracked");
    const roundedHours = Number(hours.toFixed(2));
    return roundedHours === 1 ? `1 ${t("hour")}` : `${roundedHours} ${t("hours")}`;
  };

  const getRatingStars = (rating?: number) => {
    if (!rating || rating === 0) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="w-4 h-4 fill-muted stroke-muted-foreground/50" />
          <span className="text-sm">{t("notRated")}</span>
        </div>
      );
    }

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {Array(fullStars)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 fill-yellow-400 stroke-yellow-400"
              />
            ))}
          {hasHalfStar && (
            <StarHalf className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
          )}
          {Array(emptyStars)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i + fullStars + (hasHalfStar ? 1 : 0)}
                className="w-4 h-4 fill-muted stroke-muted-foreground/30"
              />
            ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground ml-1">
          ({rating})
        </span>
      </div>
    );
  };

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case "PLAYING":
        return {
          color:
            "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30",
          icon: Play,
          gradient: "from-green-500/20 to-green-600/10",
        };
      case "COMPLETED":
        return {
          color:
            "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-400/20 dark:text-blue-400 dark:border-blue-400/30",
          icon: CheckCircle,
          gradient: "from-blue-500/20 to-blue-600/10",
        };
      case "DROPPED":
        return {
          color:
            "bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-400/20 dark:text-red-400 dark:border-red-400/30",
          icon: XCircle,
          gradient: "from-red-500/20 to-red-600/10",
        };
      case "BACKLOG":
        return {
          color:
            "bg-orange-500/20 text-orange-700 border-orange-500/30 dark:bg-orange-400/20 dark:text-orange-400 dark:border-orange-400/30",
          icon: Pause,
          gradient: "from-orange-500/20 to-orange-600/10",
        };
      default:
        return {
          color:
            "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-400/20 dark:text-gray-400 dark:border-gray-400/30",
          icon: Gamepad2,
          gradient: "from-gray-500/20 to-gray-600/10",
        };
    }
  };

  const statusInfo = getStatusInfo(game.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-card/50 to-card border-border/50 hover:border-border backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start">
          {/* Cover Image */}
          <div className="relative w-24 h-32 flex-shrink-0">
            {game.imageUrl ? (
              <>
                <img
                  src={game.imageUrl}
                  alt={`${game.title} cover`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 items-center justify-center text-primary absolute top-0 left-0">
                  <Gamepad2 className="w-8 h-8" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary">
                <Gamepad2 className="w-8 h-8" />
              </div>
            )}

            {/* Status Overlay */}
            <div
              className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${statusInfo.color}`}
            >
              <div className="flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                {game.status ? GAME_STATUS_LABELS[game.status] : "Unknown"}
              </div>
            </div>

            {/* Rating Overlay */}
            {game.rating && (
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
                  {game.rating}
                </div>
              </div>
            )}
          </div>

          {/* Game Details */}
          <div className="flex-1 p-6 min-w-0">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xl mb-2 truncate group-hover:text-primary transition-colors">
                    {game.title}
                  </h3>

                  {/* Source Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {game.source === GameSource.STEAM && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 bg-blue-500/20 text-blue-600 border-blue-500/30"
                      >
                        <Gamepad2 className="h-3 w-3" />
                        {t("steam")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">{t("openMenu")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={onEdit}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-3" />
                      {t("editGame")}
                    </DropdownMenuItem>

                    {game.source === GameSource.STEAM && game.steamAppId && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `https://store.steampowered.com/app/${game.steamAppId}`,
                              "_blank"
                            )
                          }
                          className="cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4 mr-3" />
                          {t("viewOnSteam")}
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      {t("deleteGame")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Rating */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {t("rating")}
                  </div>
                  {getRatingStars(game.rating)}
                </div>

                {/* Play Time */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {t("playTime")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatHours(game.hoursPlayed)}
                    </span>
                  </div>
                  {game.source === GameSource.STEAM && game.steamPlaytime && (
                    <div className="text-xs text-muted-foreground">
                      {t("steam")}: {(game.steamPlaytime / 60).toFixed(2)}h
                    </div>
                  )}
                </div>

                {/* Added Date */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {t("added")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(game.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Last Played */}
                {game.lastPlayedAt && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {t("lastPlayed")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(game.lastPlayedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {game.notes && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                    {t("notes")}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {game.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
