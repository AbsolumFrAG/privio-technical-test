import { useMemo } from 'react';
import { useGames } from '@/contexts/games-context';
import { GameStatus, GAME_STATUS_LABELS } from '@/types/game';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Star, 
  Trophy, 
  Gamepad2, 
  BarChart3,
  TrendingUp,
  Hash,
  Calendar
} from 'lucide-react';

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
    const activeGames = games.filter(game => !game.isDeleted);
    
    // Calculate total hours played
    const totalHoursPlayed = activeGames.reduce((total, game) => {
      return total + (game.hoursPlayed || 0);
    }, 0);

    // Calculate average rating
    const gamesWithRatings = activeGames.filter(game => game.rating && game.rating > 0);
    const averageRating = gamesWithRatings.length > 0 
      ? gamesWithRatings.reduce((sum, game) => sum + (game.rating || 0), 0) / gamesWithRatings.length
      : 0;

    // Status breakdown
    const statusBreakdown = activeGames.reduce((acc, game) => {
      const status = game.status || GameStatus.BACKLOG;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<GameStatus, number>);

    // Ensure all statuses are represented
    Object.values(GameStatus).forEach(status => {
      if (!(status in statusBreakdown)) {
        statusBreakdown[status] = 0;
      }
    });

    // Average hours per game
    const gamesWithHours = activeGames.filter(game => game.hoursPlayed && game.hoursPlayed > 0);
    const averageHoursPerGame = gamesWithHours.length > 0
      ? totalHoursPlayed / gamesWithHours.length
      : 0;

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
    const recentlyAddedCount = activeGames.filter(game => 
      new Date(game.createdAt) > thirtyDaysAgo
    ).length;

    // Completion rate
    const completedGames = statusBreakdown[GameStatus.COMPLETED] || 0;
    const completionRate = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;

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
      completionRate
    };
  }, [games]);

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 10) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours)}h`;
  };

  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Game Statistics</h2>
        <p className="text-muted-foreground">
          Insights into your gaming journey and preferences
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGames}</div>
            <p className="text-xs text-muted-foreground">
              Games in your library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Play Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(stats.totalHoursPlayed)}</div>
            <p className="text-xs text-muted-foreground">
              Time spent gaming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? formatRating(stats.averageRating) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.gamesWithRatings} rated games
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Games completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Game Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Game Status Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of games by play status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                const percentage = stats.totalGames > 0 ? (count / stats.totalGames) * 100 : 0;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {GAME_STATUS_LABELS[status as GameStatus]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} games
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gaming Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Gaming Insights
            </CardTitle>
            <CardDescription>
              Key statistics and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Average Hours per Game:</span>
                <span>{formatHours(stats.averageHoursPerGame)}</span>
              </div>
              
              {stats.mostPlayedGame && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Most Played:</span>
                  <span className="truncate">
                    {stats.mostPlayedGame.title} ({formatHours(stats.mostPlayedGame.hours)})
                  </span>
                </div>
              )}
              
              {stats.highestRatedGame && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Highest Rated:</span>
                  <span className="truncate">
                    {stats.highestRatedGame.title} ({formatRating(stats.highestRatedGame.rating)}★)
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Added Recently:</span>
                <span>{stats.recentlyAddedCount} games (last 30 days)</span>
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
                <div className="text-sm text-muted-foreground">
                  Games rated
                </div>
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
              Start adding games to your library to see detailed statistics about your gaming habits and preferences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}