import {
  GameSource,
  GameStatus,
  Prisma,
  SteamSyncStatus,
} from "@prisma/client";
import { prisma } from "./prisma";
import { steamApiService } from "./steam-api";

export interface SteamSyncOptions {
  skipExisting: boolean;
  updatePlaytime: boolean;
  minimumPlaytime: number; // in minutes
  maxGamesToProcess?: number;
}

export interface SteamSyncResult {
  success: boolean;
  gamesProcessed: number;
  gamesImported: number;
  gamesUpdated: number;
  gamesSkipped: number;
  errors: string[];
}

export class SteamSyncService {
  private readonly DEFAULT_OPTIONS: SteamSyncOptions = {
    skipExisting: true,
    updatePlaytime: true,
    minimumPlaytime: 0,
    maxGamesToProcess: 1000,
  };

  /**
   * Sync user's Steam library with their GameTracker library
   */
  async syncUserLibrary(
    userId: string,
    options: Partial<SteamSyncOptions> = {}
  ): Promise<SteamSyncResult> {
    const syncOptions = { ...this.DEFAULT_OPTIONS, ...options };

    // Create sync log entry
    const syncLog = await prisma.steamSyncLog.create({
      data: {
        userId,
        status: SteamSyncStatus.PENDING,
      },
    });

    try {
      // Get user with Steam ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { steamId: true, steamSyncEnabled: true },
      });

      if (!user?.steamId) {
        throw new Error("User does not have a linked Steam account");
      }

      if (!user.steamSyncEnabled) {
        throw new Error("Steam sync is disabled for this user");
      }

      // Fetch owned games from Steam
      const ownedGamesResponse = await steamApiService.getOwnedGames(
        user.steamId
      );
      if (!ownedGamesResponse) {
        throw new Error("Failed to fetch Steam games or profile is private");
      }

      const steamGames = ownedGamesResponse.games || [];
      const result: SteamSyncResult = {
        success: true,
        gamesProcessed: 0,
        gamesImported: 0,
        gamesUpdated: 0,
        gamesSkipped: 0,
        errors: [],
      };

      // Process games in batches
      const batchSize = 50;
      const maxGames = syncOptions.maxGamesToProcess || steamGames.length;
      const gamesToProcess = steamGames.slice(0, maxGames);

      for (let i = 0; i < gamesToProcess.length; i += batchSize) {
        const batch = gamesToProcess.slice(i, i + batchSize);

        for (const steamGame of batch) {
          try {
            const processResult = await this.processSteamGame(
              userId,
              steamGame,
              syncOptions
            );

            result.gamesProcessed++;

            if (processResult === "imported") {
              result.gamesImported++;
            } else if (processResult === "updated") {
              result.gamesUpdated++;
            } else if (processResult === "skipped") {
              result.gamesSkipped++;
            }
          } catch (error) {
            const errorMessage = `Failed to process game ${steamGame.name}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
            result.errors.push(errorMessage);
            console.error(errorMessage);
          }
        }

        // Small delay between batches
        if (i + batchSize < gamesToProcess.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Update last sync time
      await prisma.user.update({
        where: { id: userId },
        data: { lastSteamSync: new Date() },
      });

      // Update sync log with success
      await prisma.steamSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SteamSyncStatus.SUCCESS,
          gamesProcessed: result.gamesProcessed,
          gamesImported: result.gamesImported,
          gamesUpdated: result.gamesUpdated,
          gamesSkipped: result.gamesSkipped,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      // Update sync log with error
      await prisma.steamSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SteamSyncStatus.ERROR,
          errorMessage,
          completedAt: new Date(),
        },
      });

      return {
        success: false,
        gamesProcessed: 0,
        gamesImported: 0,
        gamesUpdated: 0,
        gamesSkipped: 0,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Process a single Steam game
   */
  private async processSteamGame(
    userId: string,
    steamGame: any,
    options: SteamSyncOptions
  ): Promise<"imported" | "updated" | "skipped"> {
    const steamAppId = String(steamGame.appid);
    const playtimeMinutes = steamGame.playtime_forever || 0;

    // Skip if below minimum playtime
    if (playtimeMinutes < options.minimumPlaytime) {
      return "skipped";
    }

    // Check if game already exists
    const existingGame = await prisma.game.findFirst({
      where: {
        userId,
        steamAppId,
        isDeleted: false,
      },
      select: {
        id: true,
        hoursPlayed: true,
        steamPlaytime: true,
        imageUrl: true,
        steamImageUrl: true,
      },
    });

    if (existingGame) {
      if (options.skipExisting && !options.updatePlaytime) {
        return "skipped";
      }

      // Update existing game if needed
      if (options.updatePlaytime) {
        const updateData: Prisma.GameUpdateInput = {
          steamPlaytime: playtimeMinutes,
          steamLastPlayed: steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : undefined,
        };

        // Update hours played if Steam has more playtime
        if (playtimeMinutes > (existingGame.steamPlaytime || 0)) {
          updateData.hoursPlayed = Math.max(
            existingGame.hoursPlayed,
            playtimeMinutes / 60
          );
        }

        // Update image URL if game doesn't have one
        if (!existingGame.imageUrl || !existingGame.steamImageUrl) {
          const imageUrl = this.generateSteamImageUrl(steamAppId, steamGame);
          updateData.imageUrl = imageUrl;
          updateData.steamImageUrl = imageUrl;
        }

        await prisma.game.update({
          where: { id: existingGame.id },
          data: updateData,
        });

        return "updated";
      }

      return "skipped";
    }

    // Create new game from Steam data
    const gameData: Prisma.GameCreateInput = {
      title: steamGame.name || "Unknown Game",
      source: GameSource.STEAM,
      steamAppId,
      steamName: steamGame.name,
      steamPlaytime: playtimeMinutes,
      hoursPlayed: playtimeMinutes / 60,
      steamLastPlayed: steamGame.rtime_last_played
        ? new Date(steamGame.rtime_last_played * 1000)
        : undefined,
      steamImageUrl: this.generateSteamImageUrl(steamAppId, steamGame),
      imageUrl: this.generateSteamImageUrl(steamAppId, steamGame),
      status: this.inferGameStatus(
        playtimeMinutes,
        steamGame.rtime_last_played
      ),
      lastPlayedAt: steamGame.rtime_last_played
        ? new Date(steamGame.rtime_last_played * 1000)
        : undefined,
      user: {
        connect: { id: userId },
      },
    };

    await prisma.game.create({ data: gameData });

    return "imported";
  }

  /**
   * Generate Steam image URL with fallback options
   */
  private generateSteamImageUrl(steamAppId: string, steamGame: any): string | null {
    // Priority 1: Steam header image (best quality, most consistent)
    const headerImageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
    
    // For most games, header image exists and is the best quality
    // We'll use this as primary choice since it's more consistent than logo/icon URLs
    return headerImageUrl;
  }

  /**
   * Get best available image URL for a Steam game, preferring cached data
   */
  private async getBestSteamImageUrl(steamAppId: string, steamGame: any): Promise<string | null> {
    try {
      // Check if we have cached Steam game data with header image
      const cachedGame = await prisma.steamGame.findUnique({
        where: { steamAppId },
        select: { headerImage: true }
      });

      // Use cached header image if available
      if (cachedGame?.headerImage) {
        return cachedGame.headerImage;
      }
    } catch (error) {
      console.error(`Failed to fetch cached image for ${steamAppId}:`, error);
    }

    // Fallback to generated URL
    return this.generateSteamImageUrl(steamAppId, steamGame);
  }

  /**
   * Infer game status based on Steam data
   */
  private inferGameStatus(
    playtimeMinutes: number,
    lastPlayedTimestamp?: number
  ): GameStatus {
    if (playtimeMinutes === 0) {
      return GameStatus.BACKLOG;
    }

    if (!lastPlayedTimestamp) {
      return GameStatus.BACKLOG;
    }

    const lastPlayedDate = new Date(lastPlayedTimestamp * 1000);
    const daysSinceLastPlayed =
      (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24);

    // Recently played (within 7 days)
    if (daysSinceLastPlayed < 7) {
      return GameStatus.PLAYING;
    }

    // Played for a significant amount (more than 10 hours) but not recently
    if (playtimeMinutes > 600) {
      return GameStatus.COMPLETED;
    }

    // Default to backlog
    return GameStatus.BACKLOG;
  }

  /**
   * Get sync history for a user
   */
  async getSyncHistory(userId: string, limit = 10) {
    return await prisma.steamSyncLog.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Check if user can sync (rate limiting)
   */
  async canUserSync(
    userId: string
  ): Promise<{ canSync: boolean; nextSyncTime?: Date }> {
    const lastSync = await prisma.steamSyncLog.findFirst({
      where: {
        userId,
        status: { in: [SteamSyncStatus.SUCCESS, SteamSyncStatus.PENDING] },
      },
      orderBy: { startedAt: "desc" },
    });

    if (!lastSync) {
      return { canSync: true };
    }

    const cooldownMinutes = 5;
    const nextSyncTime = new Date(
      lastSync.startedAt.getTime() + cooldownMinutes * 60 * 1000
    );

    if (Date.now() < nextSyncTime.getTime()) {
      return {
        canSync: false,
        nextSyncTime,
      };
    }

    return { canSync: true };
  }

  /**
   * Cache Steam game metadata
   */
  async cacheSteamGameMetadata(steamAppId: string): Promise<void> {
    try {
      // Check if already cached and recent
      const existing = await prisma.steamGame.findUnique({
        where: { steamAppId },
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (existing && existing.updatedAt > oneDayAgo) {
        return; // Already cached recently
      }

      // Fetch from Steam Store API
      const appDetails = await steamApiService.getAppDetails(steamAppId);
      if (!appDetails?.success || !appDetails.data) {
        return;
      }

      const data = appDetails.data;
      const steamGameData: Prisma.SteamGameCreateInput = {
        steamAppId,
        name: data.name,
        headerImage: data.header_image,
        shortDescription: data.short_description,
        developers: data.developers || [],
        publishers: data.publishers || [],
        genres: data.genres?.map((g) => g.description) || [],
        releaseDate: data.release_date?.date,
        price: data.price_overview?.final_formatted,
        metacritic: data.metacritic?.score,
      };

      await prisma.steamGame.upsert({
        where: { steamAppId },
        create: steamGameData,
        update: {
          ...steamGameData,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        `Failed to cache Steam game metadata for ${steamAppId}:`,
        error
      );
    }
  }
}

// Singleton instance
export const steamSyncService = new SteamSyncService();
