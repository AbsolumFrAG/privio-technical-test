import axios, { AxiosInstance } from "axios";
import { STEAM_API_ENDPOINTS, steamConfig } from "../config/steam";

// Rate limiting
const apiCallTimes: number[] = [];

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate: number;
  lastlogoff: number;
  commentpermission?: number;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  rtime_last_played?: number;
}

export interface SteamOwnedGamesResponse {
  game_count: number;
  games: SteamGame[];
}

export interface SteamAppDetails {
  success: boolean;
  data?: {
    name: string;
    short_description: string;
    header_image: string;
    developers: string[];
    publishers: string[];
    genres: { description: string }[];
    release_date: { date: string };
    price_overview?: {
      currency: string;
      initial: number;
      final: number;
      discount_percent: number;
      initial_formatted: string;
      final_formatted: string;
    };
    metacritic?: {
      score: number;
    };
  };
}

export class SteamApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        "User-Agent": "GameTracker/1.0",
      },
    });
  }

  /**
   * Check rate limit (200 requests per minute for Steam API)
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Remove old timestamps
    while (apiCallTimes.length > 0 && apiCallTimes[0] < oneMinuteAgo) {
      apiCallTimes.shift();
    }

    // Check if we're over the limit
    if (apiCallTimes.length >= 200) {
      return false;
    }

    // Add current timestamp
    apiCallTimes.push(now);
    return true;
  }

  /**
   * Get player summary information
   */
  async getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
    if (!this.checkRateLimit()) {
      throw new Error("Rate limit exceeded");
    }

    try {
      const response = await this.client.get(
        STEAM_API_ENDPOINTS.PLAYER_SUMMARIES,
        {
          params: {
            key: steamConfig.apiKey,
            steamids: steamId,
          },
        }
      );

      const players = response.data?.response?.players;
      if (!players || players.length === 0) {
        return null;
      }

      return players[0] as SteamPlayerSummary;
    } catch (error) {
      console.error("Error fetching Steam player summary:", error);
      throw new Error("Failed to fetch Steam player data");
    }
  }

  /**
   * Get user's owned games
   */
  async getOwnedGames(
    steamId: string,
    includeAppInfo = true
  ): Promise<SteamOwnedGamesResponse | null> {
    if (!this.checkRateLimit()) {
      throw new Error("Rate limit exceeded");
    }

    try {
      const response = await this.client.get(STEAM_API_ENDPOINTS.OWNED_GAMES, {
        params: {
          key: steamConfig.apiKey,
          steamid: steamId,
          include_appinfo: includeAppInfo ? 1 : 0,
          include_played_free_games: 1,
        },
      });

      return response.data?.response as SteamOwnedGamesResponse | null;
    } catch (error) {
      console.error("Error fetching Steam owned games:", error);
      throw new Error("Failed to fetch Steam games");
    }
  }

  /**
   * Get detailed app information from Steam Store
   */
  async getAppDetails(appId: string | number): Promise<SteamAppDetails | null> {
    try {
      // Steam Store API doesn't require API key but has different rate limits
      const response = await this.client.get(STEAM_API_ENDPOINTS.APP_DETAILS, {
        params: {
          appids: appId,
          filters: "basic",
        },
      });

      const appData = response.data?.[appId];
      return appData as SteamAppDetails | null;
    } catch (error) {
      console.error(`Error fetching Steam app details for ${appId}:`, error);
      return null;
    }
  }

  /**
   * Batch fetch app details with delay to avoid rate limiting
   */
  async getBatchAppDetails(
    appIds: (string | number)[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, SteamAppDetails>> {
    const results = new Map<string, SteamAppDetails>();
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < appIds.length; i++) {
      const appId = appIds[i];

      try {
        const details = await this.getAppDetails(appId);
        if (details && details.success) {
          results.set(String(appId), details);
        }
      } catch (error) {
        console.error(`Failed to fetch details for app ${appId}:`, error);
      }

      // Progress callback
      if (onProgress) {
        onProgress(i + 1, appIds.length);
      }

      // Delay between requests to avoid overwhelming the API
      if (i < appIds.length - 1) {
        await delay(1000); // 1 second delay
      }
    }

    return results;
  }

  /**
   * Validate Steam API connectivity
   */
  async validateApiKey(): Promise<boolean> {
    if (!steamConfig.apiKey) {
      return false;
    }

    try {
      // Try to fetch player summaries with a known Steam ID (Gabe Newell's)
      const response = await this.client.get(
        STEAM_API_ENDPOINTS.PLAYER_SUMMARIES,
        {
          params: {
            key: steamConfig.apiKey,
            steamids: "76561197960287930",
          },
        }
      );

      return response.data?.response?.players?.length > 0;
    } catch (error) {
      console.error("Steam API validation failed:", error);
      return false;
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): { remaining: number; resetTime: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Remove old timestamps
    while (apiCallTimes.length > 0 && apiCallTimes[0] < oneMinuteAgo) {
      apiCallTimes.shift();
    }

    const remaining = Math.max(0, 200 - apiCallTimes.length);
    const resetTime =
      apiCallTimes.length > 0 ? apiCallTimes[0] + 60 * 1000 : now;

    return { remaining, resetTime };
  }
}

// Singleton instance
export const steamApiService = new SteamApiService();
