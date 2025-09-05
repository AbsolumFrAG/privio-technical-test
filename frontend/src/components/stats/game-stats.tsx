import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGames } from "@/contexts/games-context";
import { GAME_STATUS_LABELS, GameStatus } from "@/types/game";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Gamepad2,
  Hash,
  Pause,
  Play,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

interface GameStats {
  totalGames: number;
  totalHoursPlayed: number;
  averageRating: number;
  gamesWithRatings: number;
  statusBreakdown: Record<GameStatus, number>;
  averageHoursPerGame: number;
  mostPlayedGame: { title: string; hours: number } | null;
  highestRatedGame: { title: string; rating: number } | null;
  recentlyAddedCount: number;
  completionRate: number;
}

export function GameStats() {
  const { games } = useGames();

  const stats = useMemo((): GameStats => {
    const totalGames = games.length;

    // Filter out soft-deleted games
    const activeGames = games.filter((game) => !game.isDeleted);

    // Calculate total hours played
    const totalHoursPlayed = activeGames.reduce((total, game) => {
      return total + (game.hoursPlayed || 0);
    }, 0);

    // Calculate average rating
    const gamesWithRatings = activeGames.filter(
      (game) => game.rating && game.rating > 0
    );
    const averageRating =
      gamesWithRatings.length > 0
        ? gamesWithRatings.reduce((sum, game) => sum + (game.rating || 0), 0) /
          gamesWithRatings.length
        : 0;

    // Status breakdown
    const statusBreakdown = activeGames.reduce((acc, game) => {
      const status = game.status || GameStatus.BACKLOG;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<GameStatus, number>);

    // Ensure all statuses are represented
    Object.values(GameStatus).forEach((status) => {
      if (!(status in statusBreakdown)) {
        statusBreakdown[status] = 0;
      }
    });

    // Average hours per game
    const gamesWithHours = activeGames.filter(
      (game) => game.hoursPlayed && game.hoursPlayed > 0
    );
    const averageHoursPerGame =
      gamesWithHours.length > 0 ? totalHoursPlayed / gamesWithHours.length : 0;

    // Most played game
    const mostPlayedGame = activeGames.reduce((max, game) => {
      const hours = game.hoursPlayed || 0;
      if (!max || hours > max.hours) {
        return { title: game.title, hours };
      }
      return max;
    }, null as { title: string; hours: number } | null);

    // Highest rated game
    const highestRatedGame = gamesWithRatings.reduce((max, game) => {
      const rating = game.rating || 0;
      if (!max || rating > max.rating) {
        return { title: game.title, rating };
      }
      return max;
    }, null as { title: string; rating: number } | null);

    // Recently added count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAddedCount = activeGames.filter(
      (game) => new Date(game.createdAt) > thirtyDaysAgo
    ).length;

    // Completion rate
    const completedGames = statusBreakdown[GameStatus.COMPLETED] || 0;
    const completionRate =
      totalGames > 0 ? (completedGames / totalGames) * 100 : 0;

    return {
      totalGames: activeGames.length,
      totalHoursPlayed,
      averageRating,
      gamesWithRatings: gamesWithRatings.length,
      statusBreakdown,
      averageHoursPerGame,
      mostPlayedGame,
      highestRatedGame,
      recentlyAddedCount,
      completionRate,
    };
  }, [games]);

  const formatHours = (hours: number): string => {
    if (hours === 0) return "0h";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 10) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours)}h`;
  };

  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Gaming Analytics
            </h1>
            <p className="text-lg text-muted-foreground">
              Deep insights into your gaming journey and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Hero Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Game Library
            </CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalGames}</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Gamepad2 className="w-4 h-4" />
              Games tracked
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Total Playtime
            </CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Timer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {formatHours(stats.totalHoursPlayed)}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {Math.round(stats.totalHoursPlayed / 24)} days of gaming
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Average Rating
            </CardTitle>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400 fill-current" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {stats.averageRating > 0 ? (
                <div className="flex items-center gap-2">
                  {formatRating(stats.averageRating)}
                  <Star className="w-6 h-6 fill-yellow-400 stroke-yellow-400" />
                </div>
              ) : (
                "N/A"
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Award className="w-4 h-4" />
              From {stats.gamesWithRatings} rated games
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Completion Rate
            </CardTitle>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {stats.completionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Achievement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Status Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Game Status Breakdown with Visual Progress */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              Status Distribution
            </CardTitle>
            <CardDescription>
              How your games are distributed across different play states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                const percentage =
                  stats.totalGames > 0 ? (count / stats.totalGames) * 100 : 0;

                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case "PLAYING":
                      return {
                        icon: Play,
                        color: "bg-green-500",
                        lightColor: "bg-green-500/20",
                        textColor: "text-green-600 dark:text-green-400",
                      };
                    case "COMPLETED":
                      return {
                        icon: CheckCircle,
                        color: "bg-blue-500",
                        lightColor: "bg-blue-500/20",
                        textColor: "text-blue-600 dark:text-blue-400",
                      };
                    case "DROPPED":
                      return {
                        icon: XCircle,
                        color: "bg-red-500",
                        lightColor: "bg-red-500/20",
                        textColor: "text-red-600 dark:text-red-400",
                      };
                    case "BACKLOG":
                      return {
                        icon: Pause,
                        color: "bg-orange-500",
                        lightColor: "bg-orange-500/20",
                        textColor: "text-orange-600 dark:text-orange-400",
                      };
                    default:
                      return {
                        icon: Gamepad2,
                        color: "bg-gray-500",
                        lightColor: "bg-gray-500/20",
                        textColor: "text-gray-600 dark:text-gray-400",
                      };
                  }
                };

                const config = getStatusConfig(status);
                const Icon = config.icon;

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.lightColor}`}>
                          <Icon className={`h-4 w-4 ${config.textColor}`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {GAME_STATUS_LABELS[status as GameStatus]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {count} {count === 1 ? "game" : "games"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${config.color} h-2 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Gaming Insights */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              Gaming Insights
            </CardTitle>
            <CardDescription>
              Highlights and achievements from your gaming journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Timer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Average Session
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatHours(stats.averageHoursPerGame)}
                </div>
                <p className="text-sm text-muted-foreground">
                  per game on average
                </p>
              </div>

              {stats.mostPlayedGame && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      Most Played
                    </span>
                  </div>
                  <div className="text-lg font-bold truncate">
                    {stats.mostPlayedGame.title}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatHours(stats.mostPlayedGame.hours)} total playtime
                  </p>
                </div>
              )}

              {stats.highestRatedGame && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400 fill-current" />
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      Highest Rated
                    </span>
                  </div>
                  <div className="text-lg font-bold truncate">
                    {stats.highestRatedGame.title}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {Array(Math.floor(stats.highestRatedGame.rating))
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-yellow-400 stroke-yellow-400"
                        />
                      ))}
                    <span className="ml-1">
                      {formatRating(stats.highestRatedGame.rating)} stars
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Recent Activity
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {stats.recentlyAddedCount}
                </div>
                <p className="text-sm text-muted-foreground">
                  games added in the last 30 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      {stats.totalGames > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Facts</CardTitle>
            <CardDescription>
              Interesting facts about your gaming library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center space-y-2 p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {Math.round(stats.totalHoursPlayed / 24)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Days of gameplay
                </div>
              </div>

              <div className="text-center space-y-2 p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {stats.gamesWithRatings}
                </div>
                <div className="text-sm text-muted-foreground">Games rated</div>
              </div>

              <div className="text-center space-y-2 p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {stats.statusBreakdown[GameStatus.BACKLOG] || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Games in backlog
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalGames === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Games Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Start adding games to your library to see detailed statistics
              about your gaming habits and preferences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
