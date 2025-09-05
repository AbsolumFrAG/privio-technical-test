import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { useGames } from "@/contexts/games-context";
import type { CreateGameData, GameSortOptions, GameStatus, GameSource } from "@/types/game";
import {
  GAME_STATUS_LABELS,
  GAME_SOURCE_LABELS,
  GameStatus as GameStatusConstants,
  GameSource as GameSourceConstants,
} from "@/types/game";
import { Filter, Plus, Search, SortAsc, SortDesc } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";
import { GameForm } from "./game-form";
import { GameItem } from "./game-item";

export function GameList() {
  const {
    games,
    isLoading,
    error,
    filters,
    sortOptions,
    totalGames,
    currentPage,
    totalPages,
    createGame,
    updateGame,
    deleteGame,
    setFilters,
    setSortOptions,
    setPage,
    clearError,
  } = useGames();

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | "all">(
    filters.status || "all"
  );
  const [selectedSource, setSelectedSource] = useState<GameSource | "all">(
    filters.source || "all"
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value || undefined });
  };

  const handleStatusFilter = (status: string) => {
    const statusValue = status === "all" ? undefined : (status as GameStatus);
    setSelectedStatus(status as GameStatus | "all");
    setFilters({ status: statusValue });
  };

  const handleSourceFilter = (source: string) => {
    const sourceValue = source === "all" ? undefined : (source as GameSource);
    setSelectedSource(source as GameSource | "all");
    setFilters({ source: sourceValue });
  };

  const handleSortChange = (field: string) => {
    const newDirection =
      sortOptions.field === field && sortOptions.direction === "asc"
        ? "desc"
        : "asc";
    setSortOptions({
      field: field as GameSortOptions["field"],
      direction: newDirection,
    });
  };

  const handleCreateGame = async (gameData: CreateGameData) => {
    setIsSubmitting(true);
    try {
      await createGame(gameData);
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGame = async (gameData: CreateGameData) => {
    if (!editingGame) return;

    setIsSubmitting(true);
    try {
      await updateGame(editingGame, gameData);
      setEditingGame(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!deletingGameId) return;

    setIsSubmitting(true);
    try {
      await deleteGame(deletingGameId);
      setDeletingGameId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortOptions.field !== field) return null;
    return sortOptions.direction === "asc" ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    );
  };

  const editingGameData = editingGame
    ? games.find((g) => g.id === editingGame)
    : undefined;
  const deletingGameData = deletingGameId
    ? games.find((g) => g.id === deletingGameId)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Games</h2>
          <p className="text-muted-foreground">
            {totalGames} {totalGames === 1 ? "game" : "games"} in your library
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Game
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            ×
          </Button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedStatus} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.values(GameStatusConstants).map((status) => (
              <SelectItem key={status} value={status}>
                {GAME_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={handleSourceFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {Object.values(GameSourceConstants).map((source) => (
              <SelectItem key={source} value={source}>
                {GAME_SOURCE_LABELS[source]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange("title")}
          className="flex items-center gap-1"
        >
          Title {getSortIcon("title")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange("rating")}
          className="flex items-center gap-1"
        >
          Rating {getSortIcon("rating")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange("hoursPlayed")}
          className="flex items-center gap-1"
        >
          Hours Played {getSortIcon("hoursPlayed")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange("createdAt")}
          className="flex items-center gap-1"
        >
          Date Added {getSortIcon("createdAt")}
        </Button>
      </div>

      {/* Games List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading games...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎮</div>
          <h3 className="text-lg font-semibold mb-2">No games found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.status
              ? "Try adjusting your filters or search terms."
              : "Start building your game library by adding your first game."}
          </p>
          {!filters.search && !filters.status && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Game
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <GameItem
              key={game.id}
              game={game}
              onEdit={() => setEditingGame(game.id)}
              onDelete={() => setDeletingGameId(game.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={isLoading}
      />

      {/* Add Game Form */}
      <GameForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreateGame}
        isLoading={isSubmitting}
      />

      {/* Edit Game Form */}
      <GameForm
        game={editingGameData}
        isOpen={!!editingGame}
        onClose={() => setEditingGame(null)}
        onSubmit={handleUpdateGame}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGameId}
        onClose={() => setDeletingGameId(null)}
        onConfirm={handleDeleteGame}
        title="Delete Game"
        description={
          deletingGameData
            ? `Are you sure you want to delete "${deletingGameData.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this game?"
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
