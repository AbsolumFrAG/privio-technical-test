import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type {
  CreateGameData,
  GameSortOptions,
  GameSource,
  GameStatus,
} from "@/types/game";
import {
  GAME_SOURCE_LABELS,
  GAME_STATUS_LABELS,
  GameSource as GameSourceConstants,
  GameStatus as GameStatusConstants,
} from "@/types/game";
import {
  Filter,
  Gamepad2,
  Plus,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
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
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  My Gaming Library
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {totalGames} {totalGames === 1 ? "game" : "games"}
                  </span>
                  {games.some((g) => g.rating) && (
                    <span>
                      • ★{" "}
                      {(
                        games
                          .filter((g) => g.rating)
                          .reduce((acc, g) => acc + (g.rating || 0), 0) /
                        games.filter((g) => g.rating).length
                      ).toFixed(1)}{" "}
                      avg rating
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Game
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        {totalGames > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(GameStatusConstants).reduce((acc, status) => {
                    return (
                      acc +
                      games.filter(
                        (g) =>
                          g.status === status &&
                          status === GameStatusConstants.COMPLETED
                      ).length
                    );
                  }, 0)}
                </div>
                <div className="text-xs text-green-600/80 font-medium">
                  Completed
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    games.filter(
                      (g) => g.status === GameStatusConstants.PLAYING
                    ).length
                  }
                </div>
                <div className="text-xs text-blue-600/80 font-medium">
                  Currently Playing
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    games.reduce((acc, g) => acc + (g.hoursPlayed || 0), 0)
                  )}
                </div>
                <div className="text-xs text-purple-600/80 font-medium">
                  Hours Played
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    games.filter(
                      (g) => g.status === GameStatusConstants.BACKLOG
                    ).length
                  }
                </div>
                <div className="text-xs text-orange-600/80 font-medium">
                  In Backlog
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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

      {/* Enhanced Filters and Search */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search your games... (title, genre, notes)"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 text-base bg-background/50 border-border/50 focus:bg-background transition-all duration-200"
              />
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {games.length} found
                </Badge>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger className="sm:w-[200px] h-10 bg-background/50 border-border/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(GameStatusConstants).map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {GAME_STATUS_LABELS[status]}
                        <Badge variant="outline" className="text-xs">
                          {games.filter((g) => g.status === status).length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSource} onValueChange={handleSourceFilter}>
                <SelectTrigger className="sm:w-[200px] h-10 bg-background/50 border-border/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {Object.values(GameSourceConstants).map((source) => (
                    <SelectItem key={source} value={source}>
                      <div className="flex items-center gap-2">
                        {GAME_SOURCE_LABELS[source]}
                        <Badge variant="outline" className="text-xs">
                          {games.filter((g) => g.source === source).length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(selectedStatus !== "all" ||
                selectedSource !== "all" ||
                searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                    setSelectedSource("all");
                    setFilters({});
                  }}
                  className="h-10 px-4 text-sm bg-background/50 border-border/50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-muted-foreground mr-2 flex items-center">
            Sort by:
          </span>
          {[
            { key: "title", label: "Title" },
            { key: "rating", label: "Rating" },
            { key: "hoursPlayed", label: "Hours" },
            { key: "createdAt", label: "Added" },
            { key: "lastPlayedAt", label: "Last Played" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={sortOptions.field === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange(key)}
              className={`flex items-center gap-2 transition-all duration-200 ${
                sortOptions.field === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/50 border-border/50 hover:bg-accent/50"
              }`}
            >
              {label}
              {getSortIcon(key)}
            </Button>
          ))}
        </div>
      </div>

      {/* Games Grid/List */}
      {isLoading ? (
        <Card className="bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary"></div>
              <Gamepad2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
            </div>
            <p className="mt-6 text-lg font-medium text-muted-foreground">
              Loading your games...
            </p>
            <p className="text-sm text-muted-foreground">
              Organizing your digital library
            </p>
          </CardContent>
        </Card>
      ) : games.length === 0 ? (
        <Card className="bg-gradient-to-br from-card/50 to-muted/20 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
              {filters.search || filters.status ? (
                <Search className="w-8 h-8 text-primary" />
              ) : (
                <Gamepad2 className="w-8 h-8 text-primary" />
              )}
            </div>

            <h3 className="text-xl font-semibold mb-3">
              {filters.search || filters.status
                ? "No games found"
                : "Welcome to GameTracker!"}
            </h3>

            <p className="text-muted-foreground mb-6 max-w-md">
              {filters.search || filters.status
                ? "Try adjusting your search terms or filters to find the games you're looking for."
                : "Start building your gaming library by adding your first game. Track your progress, rate your favorites, and discover new experiences."}
            </p>

            <div className="flex gap-3">
              {filters.search || filters.status ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                    setSelectedSource("all");
                    setFilters({});
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-primary to-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Game
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {games.length} of {totalGames} games
              {(filters.search || filters.status || filters.source) &&
                " (filtered)"}
            </span>
          </div>

          {/* Games Grid */}
          <div className="grid gap-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {games.map((game, index) => (
              <div
                key={game.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GameItem
                  game={game}
                  onEdit={() => setEditingGame(game.id)}
                  onDelete={() => setDeletingGameId(game.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          </CardContent>
        </Card>
      )}

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
