import { apiClient } from "@/lib/api";
import type {
  CreateGameData,
  Game,
  GameFilters,
  GameSortOptions,
  GamesResponse,
  UpdateGameData,
} from "@/types/game";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface GamesContextType {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  filters: GameFilters;
  sortOptions: GameSortOptions;
  totalGames: number;
  currentPage: number;
  totalPages: number;

  // Actions
  loadGames: () => Promise<void>;
  createGame: (gameData: CreateGameData) => Promise<Game | null>;
  updateGame: (
    gameId: string,
    gameData: UpdateGameData
  ) => Promise<Game | null>;
  deleteGame: (gameId: string) => Promise<boolean>;
  setFilters: (filters: Partial<GameFilters>) => void;
  setSortOptions: (sortOptions: GameSortOptions) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

const GamesContext = createContext<GamesContextType | null>(null);

export function useGames() {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
}

interface GamesProviderProps {
  children: ReactNode;
}

export function GamesProvider({ children }: GamesProviderProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalGames, setTotalGames] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFiltersState] = useState<GameFilters>({});
  const [sortOptions, setSortOptionsState] = useState<GameSortOptions>({
    field: "createdAt",
    direction: "desc",
  });

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...filters,
        sortBy: sortOptions.field,
        sortOrder: sortOptions.direction,
      };

      const response = await apiClient.getGames(params);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const gamesData = response.data as GamesResponse;
        setGames(gamesData.games || []);
        setTotalGames(gamesData.total || 0);
        setCurrentPage(gamesData.page || 1);
        setTotalPages(gamesData.totalPages || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, sortOptions]);

  const createGame = useCallback(
    async (gameData: CreateGameData): Promise<Game | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.createGame(gameData);

        if (response.error) {
          setError(response.error);
          return null;
        }

        if (response.data) {
          const newGame = response.data as Game;
          setGames((prevGames) => [newGame, ...prevGames]);
          setTotalGames((prev) => prev + 1);
          return newGame;
        }

        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create game");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateGame = useCallback(
    async (gameId: string, gameData: UpdateGameData): Promise<Game | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.updateGame(gameId, gameData);

        if (response.error) {
          setError(response.error);
          return null;
        }

        if (response.data) {
          const updatedGame = response.data as Game;
          setGames((prevGames) =>
            prevGames.map((game) => (game.id === gameId ? updatedGame : game))
          );
          return updatedGame;
        }

        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update game");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteGame = useCallback(async (gameId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.deleteGame(gameId);

      if (response.error) {
        setError(response.error);
        return false;
      }

      setGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
      setTotalGames((prev) => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete game");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<GameFilters>) => {
    setFiltersState((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const setSortOptions = useCallback((newSortOptions: GameSortOptions) => {
    setSortOptionsState(newSortOptions);
    setCurrentPage(1); // Reset to first page when sort changes
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      games,
      isLoading,
      error,
      filters,
      sortOptions,
      totalGames,
      currentPage,
      totalPages,
      loadGames,
      createGame,
      updateGame,
      deleteGame,
      setFilters,
      setSortOptions,
      setPage,
      clearError,
    }),
    [
      games,
      isLoading,
      error,
      filters,
      sortOptions,
      totalGames,
      currentPage,
      totalPages,
      loadGames,
      createGame,
      updateGame,
      deleteGame,
      setFilters,
      setSortOptions,
      setPage,
      clearError,
    ]
  );

  return (
    <GamesContext.Provider value={contextValue}>
      {children}
    </GamesContext.Provider>
  );
}
