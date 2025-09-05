import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { apiClient } from "@/lib/api";
import type { 
  PublicUserProfile, 
  UserProfileResponse, 
  UserProfileGame,
  UserGameStats 
} from "@/types/user";
import type { PaginationMeta } from "@/types/pagination";
import { 
  User, 
  Calendar, 
  Gamepad2, 
  Clock, 
  Star, 
  ArrowLeft,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Archive
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UserProfileViewProps {
  userId: string;
  onBack?: () => void;
  className?: string;
}

// Helper function to safely render any value as string
function safeRender(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    console.warn("Attempting to render object:", value);
    return JSON.stringify(value);
  }
  return String(value);
}

function GameCard({ game }: { game: UserProfileGame }) {
  // Debug log to check game object structure
  console.log("GameCard received game:", game);
  
  const statusColors: Record<string, string> = {
    PLAYING: "bg-green-100 text-green-800 border-green-300",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
    DROPPED: "bg-red-100 text-red-800 border-red-300",
    BACKLOG: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const statusIcons: Record<string, any> = {
    PLAYING: Target,
    COMPLETED: CheckCircle,
    DROPPED: XCircle,
    BACKLOG: Archive,
  };

  const StatusIcon = statusIcons[game.status || "BACKLOG"] || Archive;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {game.imageUrl && (
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2" title={safeRender(game.title)}>
          {safeRender(game.title)}
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${statusColors[game.status || "BACKLOG"] || statusColors.BACKLOG}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {safeRender(game.status?.toLowerCase().replace('_', ' ') || "backlog")}
            </Badge>
            
            {game.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{safeRender(game.rating)}</span>
              </div>
            )}
          </div>
          
          {(game.hoursPlayed && game.hoursPlayed > 0) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{safeRender(Number(game.hoursPlayed || 0).toFixed(1))}h played</span>
            </div>
          )}
          
          {game.lastPlayedAt && (
            <div className="text-sm text-muted-foreground">
              Last played: {safeRender(game.lastPlayedAt ? new Date(game.lastPlayedAt).toLocaleDateString() : "Never")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileStats({ user }: { user: PublicUserProfile }) {
  if (!user.stats) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl font-bold">{safeRender(user.stats.totalGames || 0)}</div>
          <div className="text-sm text-muted-foreground">Total Games</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl font-bold">{safeRender(Number(user.stats.totalHours || 0).toFixed(1))}h</div>
          <div className="text-sm text-muted-foreground">Total Hours</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {safeRender(user.stats.averageRating ? user.stats.averageRating.toFixed(1) : "N/A")}
          </div>
          <div className="text-sm text-muted-foreground">Avg Rating</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl font-bold">{safeRender(user.stats.statusCounts?.COMPLETED || 0)}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBreakdown({ user }: { user: PublicUserProfile }) {
  if (!user.stats || !user.stats.statusCounts) return null;
  
  const total = user.stats.totalGames || 0;
  
  if (total === 0) return null;
  
  const statusData = [
    { 
      status: "Playing", 
      count: user.stats.statusCounts.PLAYING || 0, 
      color: "bg-green-500",
      icon: Target 
    },
    { 
      status: "Completed", 
      count: user.stats.statusCounts.COMPLETED || 0, 
      color: "bg-blue-500",
      icon: CheckCircle 
    },
    { 
      status: "Dropped", 
      count: user.stats.statusCounts.DROPPED || 0, 
      color: "bg-red-500",
      icon: XCircle 
    },
    { 
      status: "Backlog", 
      count: user.stats.statusCounts.BACKLOG || 0, 
      color: "bg-gray-500",
      icon: Archive 
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusData.map(({ status, count, color, icon: Icon }) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{safeRender(status)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium min-w-[3rem] text-right">
                    {safeRender(count)} ({safeRender(percentage.toFixed(0))}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserProfileView({ 
  userId, 
  onBack, 
  className 
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [games, setGames] = useState<UserProfileGame[]>([]);
  const [gameStats, setGameStats] = useState<UserGameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const loadUserProfile = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, statsResponse] = await Promise.all([
        apiClient.getUserProfile(userId, { page, limit: 12 }),
        page === 1 ? apiClient.getUserGameStats(userId) : Promise.resolve({ data: null })
      ]);

      if (profileResponse.error) {
        setError(profileResponse.error);
        return;
      }

      if (profileResponse.data) {
        const data = profileResponse.data as UserProfileResponse & {
          pagination?: PaginationMeta;
        };
        setProfile(data.user);
        setGames(data.games || []);
        setPagination(data.pagination || null);
      }

      if (statsResponse.data && page === 1) {
        setGameStats(statsResponse.data as UserGameStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile(currentPage);
  }, [loadUserProfile, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && !profile) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-destructive mb-4">Error: {error}</p>
        <div className="space-x-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          )}
          <Button variant="outline" onClick={() => loadUserProfile()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            <div className="flex items-center gap-4">
              {profile.steamAvatarUrl ? (
                <img
                  src={profile.steamAvatarUrl}
                  alt={`${profile.username}'s avatar`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold">{safeRender(profile.username)}</h1>
                {profile.steamUsername && (
                  <p className="text-muted-foreground">Steam: {safeRender(profile.steamUsername)}</p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {safeRender(new Date(profile.joinedAt).toLocaleDateString())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProfileStats user={profile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Game Library</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading games...</p>
              </div>
            ) : games.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {games.map((game) => (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No games in this user's library</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StatusBreakdown user={profile} />
          
          {gameStats && (
            <>
              {gameStats.topGamesByHours.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Most Played Games</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gameStats.topGamesByHours.slice(0, 5).map((game, index) => (
                        <div key={`${game.title}-${index}`} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {game.imageUrl && (
                              <img 
                                src={game.imageUrl} 
                                alt={safeRender(game.title)}
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm truncate" title={safeRender(game.title)}>
                              {safeRender(game.title)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {safeRender(Number(game.hoursPlayed || 0).toFixed(1))}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {gameStats.topRatedGames.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Rated Games</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gameStats.topRatedGames.slice(0, 5).map((game, index) => (
                        <div key={`${game.title}-${index}`} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {game.imageUrl && (
                              <img 
                                src={game.imageUrl} 
                                alt={safeRender(game.title)}
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm truncate" title={safeRender(game.title)}>
                              {safeRender(game.title)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{safeRender(game.rating)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}