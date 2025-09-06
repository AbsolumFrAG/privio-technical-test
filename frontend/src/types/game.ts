export const GameStatus = {
  PLAYING: "PLAYING",
  COMPLETED: "COMPLETED",
  DROPPED: "DROPPED",
  BACKLOG: "BACKLOG",
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const GameSource = {
  MANUAL: "MANUAL",
  STEAM: "STEAM",
} as const;

export type GameSource = (typeof GameSource)[keyof typeof GameSource];

export interface Game {
  id: string;
  title: string;
  rating?: number;
  hoursPlayed?: number;
  status?: GameStatus;
  imageUrl?: string;
  notes?: string;
  lastPlayedAt?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  userId: string;
  // Steam integration fields
  source: GameSource;
  steamAppId?: string;
  steamName?: string;
  steamPlaytime?: number;
  steamLastPlayed?: string;
  steamImageUrl?: string;
  isHiddenOnSteam?: boolean;
}

export interface CreateGameData {
  title: string;
  rating?: number;
  hoursPlayed?: number;
  status?: GameStatus;
  imageUrl?: string;
  notes?: string;
}

export interface UpdateGameData {
  title?: string;
  rating?: number;
  hoursPlayed?: number;
  status?: GameStatus;
  imageUrl?: string;
  notes?: string;
}

export interface GameFilters {
  search?: string;
  status?: GameStatus;
  source?: GameSource;
  minRating?: number;
  maxRating?: number;
}

export interface GameSortOptions {
  field:
    | "title"
    | "rating"
    | "hoursPlayed"
    | "createdAt"
    | "updatedAt"
    | "lastPlayedAt";
  direction: "asc" | "desc";
}

export interface GamesResponse {
  games: Game[];
  total: number;
  page: number;
  totalPages: number;
}

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  [GameStatus.PLAYING]: "En cours",
  [GameStatus.COMPLETED]: "Terminé",
  [GameStatus.DROPPED]: "Abandonné",
  [GameStatus.BACKLOG]: "En attente",
};

export const GAME_SOURCE_LABELS: Record<GameSource, string> = {
  [GameSource.MANUAL]: "Manuel",
  [GameSource.STEAM]: "Steam",
};

export const RATING_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

// Public game types
export interface PublicGame {
  id: string;
  title: string;
  averageRating?: number;
  totalHoursPlayed?: number;
  totalPlayers?: number;
  recentlyAddedAt?: string;
  imageUrl?: string;
}

export interface PopularGamesResponse {
  topRated: PublicGame[];
  mostPlayed: PublicGame[];
}

export interface RecentGamesResponse {
  games: PublicGame[];
}

export interface PublicGameSearchResult {
  id: string;
  title: string;
  averageRating?: number;
  totalPlayers?: number;
  totalHoursPlayed?: number;
  imageUrl?: string;
}

export interface PublicGameSearchResponse {
  games: PublicGameSearchResult[];
  total: number;
}

export interface PublicStats {
  totalGames: number;
  totalPlayers: number;
  totalHoursPlayed: number;
  averageRating: number;
}
