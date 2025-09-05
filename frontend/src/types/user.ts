
export interface User {
  id: string;
  username: string;
  email: string;
  isPublic: boolean;
  steamUsername?: string;
  steamAvatarUrl?: string;
  joinedAt: string;
  gameCount?: number;
}

export interface PublicUserProfile extends User {
  stats: {
    totalGames: number;
    totalHours: number;
    averageRating: number | null;
    statusCounts: {
      PLAYING: number;
      COMPLETED: number;
      DROPPED: number;
      BACKLOG: number;
    };
  };
}

export interface UserSearchResult {
  id: string;
  username: string;
  steamUsername?: string;
  steamAvatarUrl?: string;
  gameCount: number;
  joinedAt: string;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
}

export interface UserProfileGame {
  id: string;
  title: string;
  rating?: number;
  hoursPlayed?: number;
  status?: string;
  imageUrl?: string;
  lastPlayedAt?: string;
  createdAt: string;
}

export interface UserProfileResponse {
  user: PublicUserProfile;
  games: UserProfileGame[];
}

export interface UserGameStats {
  topGamesByHours: Array<{
    title: string;
    hoursPlayed: number;
    imageUrl?: string;
  }>;
  topRatedGames: Array<{
    title: string;
    rating: number;
    imageUrl?: string;
  }>;
  recentActivity: Array<{
    title: string;
    lastPlayedAt?: string;
    status: string;
    imageUrl?: string;
  }>;
}