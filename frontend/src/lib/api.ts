const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Try to get token from localStorage on initialization
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      this.accessToken = storedToken;
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }

  getAccessToken() {
    return this.accessToken || localStorage.getItem("accessToken");
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add authentication header if token exists
    const token = this.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        } as ApiResponse<T>;
      }

      return {
        data,
        message: data.message,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Network error occurred",
      } as ApiResponse<T>;
    }
  }

  // Authentication endpoints
  async register(email: string, username: string, password: string) {
    return this.makeRequest<{
      user: {
        id: string;
        email: string;
        username: string;
        isPublic: boolean;
        createdAt: string;
      };
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
  }

  async login(email: string, password: string) {
    return this.makeRequest<{
      user: {
        id: string;
        email: string;
        username: string;
        isPublic: boolean;
        createdAt: string;
      };
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.makeRequest<{
      user: {
        id: string;
        email: string;
        username: string;
        isPublic: boolean;
        createdAt: string;
        updatedAt: string;
        _count: {
          games: number;
        };
      };
    }>("/auth/me");
  }

  async updateProfile(data: { username?: string; isPublic?: boolean }) {
    return this.makeRequest<{
      user: {
        id: string;
        email: string;
        username: string;
        isPublic: boolean;
        updatedAt: string;
      };
    }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await this.makeRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    // Clear tokens regardless of response
    this.setAccessToken(null);
    localStorage.removeItem("refreshToken");

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return { error: "No refresh token available" } as ApiResponse;
    }

    const response = await this.makeRequest<{
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    if (response.data?.tokens) {
      this.setAccessToken(response.data.tokens.accessToken);
      localStorage.setItem("refreshToken", response.data.tokens.refreshToken);
    }

    return response;
  }

  // Game management endpoints
  async getGames(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    const endpoint = `/games${query ? `?${query}` : ""}`;

    return this.makeRequest(endpoint);
  }

  async createGame(gameData: {
    title: string;
    rating?: number;
    hoursPlayed?: number;
    status?: string;
    imageUrl?: string;
    notes?: string;
  }) {
    return this.makeRequest("/games", {
      method: "POST",
      body: JSON.stringify(gameData),
    });
  }

  async updateGame(
    gameId: string,
    gameData: Partial<{
      title: string;
      rating: number;
      hoursPlayed: number;
      status: string;
      imageUrl: string;
      notes: string;
    }>
  ) {
    return this.makeRequest(`/games/${gameId}`, {
      method: "PATCH",
      body: JSON.stringify(gameData),
    });
  }

  async deleteGame(gameId: string) {
    return this.makeRequest(`/games/${gameId}`, {
      method: "DELETE",
    });
  }

  // Public endpoints
  async getPopularGames(params?: {
    page?: number;
    limit?: number;
    type?: "both" | "topRated" | "mostPlayed";
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.type) searchParams.append("type", params.type);

    const query = searchParams.toString();
    const endpoint = `/public/games/popular${query ? `?${query}` : ""}`;

    return this.makeRequest(endpoint);
  }

  async getRecentGames(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/public/games/recent${query ? `?${query}` : ""}`;

    return this.makeRequest(endpoint);
  }

  async searchPublicGames(
    params:
      | {
          q: string;
          page?: number;
          limit?: number;
        }
      | { q: string }
      | string
  ) {
    const searchParams = new URLSearchParams();

    if (typeof params === "string") {
      // Handle legacy string parameter
      searchParams.append("q", params);
    } else {
      searchParams.append("q", params.q);
      if ("page" in params && params.page) {
        searchParams.append("page", params.page.toString());
      }
      if ("limit" in params && params.limit) {
        searchParams.append("limit", params.limit.toString());
      }
    }

    return this.makeRequest(`/public/games/search?${searchParams.toString()}`);
  }

  async getPublicStats() {
    return this.makeRequest("/public/stats");
  }

  // User search endpoints
  async searchUsers(params: {
    q: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append("q", params.q);
    if (params.page) {
      searchParams.append("page", params.page.toString());
    }
    if (params.limit) {
      searchParams.append("limit", params.limit.toString());
    }

    return this.makeRequest(`/users/search?${searchParams.toString()}`);
  }

  async getUserProfile(userId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) {
      searchParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      searchParams.append("limit", params.limit.toString());
    }

    const query = searchParams.toString();
    const endpoint = `/users/${userId}/profile${query ? `?${query}` : ""}`;

    return this.makeRequest(endpoint);
  }

  async getUserGameStats(userId: string) {
    return this.makeRequest(`/users/${userId}/games/stats`);
  }

  // Steam integration endpoints
  async getSteamAuthUrl() {
    return this.makeRequest<{
      authUrl: string;
      state: string;
    }>("/steam/auth/url");
  }

  async linkSteamAccount(steamId: string) {
    return this.makeRequest<{
      user: {
        id: string;
        email: string;
        username: string;
        isPublic: boolean;
        steamId: string;
        steamUsername: string;
        steamAvatarUrl: string;
        steamLinkedAt: string;
        steamSyncEnabled: boolean;
        createdAt: string;
      };
    }>("/steam/link", {
      method: "POST",
      body: JSON.stringify({ steamId }),
    });
  }

  async unlinkSteamAccount(keepGames: boolean = true) {
    const searchParams = new URLSearchParams();
    searchParams.append("keepGames", keepGames.toString());
    
    return this.makeRequest<{
      user: {
        id: string;
        email: string;
        username: string;
        isPublic: boolean;
        createdAt: string;
      };
      gamesRemoved: boolean;
    }>(`/steam/unlink?${searchParams.toString()}`, {
      method: "DELETE",
    });
  }

  async syncSteamLibrary(options: {
    skipExisting?: boolean;
    updatePlaytime?: boolean;
    minimumPlaytime?: number;
    maxGamesToProcess?: number;
  } = {}) {
    return this.makeRequest<{
      result: {
        success: boolean;
        gamesProcessed: number;
        gamesImported: number;
        gamesUpdated: number;
        gamesSkipped: number;
        errors: string[];
      };
    }>("/steam/sync", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async getSteamSyncStatus() {
    return this.makeRequest<{
      canSync: boolean;
      nextSyncTime?: string;
      lastSync?: string;
      syncEnabled: boolean;
      steamGameCount: number;
      history: Array<{
        id: string;
        status: 'PENDING' | 'SUCCESS' | 'ERROR';
        gamesProcessed?: number;
        gamesImported?: number;
        gamesUpdated?: number;
        gamesSkipped?: number;
        errorMessage?: string;
        startedAt: string;
        completedAt?: string;
      }>;
    }>("/steam/sync/status");
  }

  async updateSteamSettings(settings: { steamSyncEnabled: boolean }) {
    return this.makeRequest<{
      user: {
        id: string;
        steamSyncEnabled: boolean;
      };
    }>("/steam/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  async getSteamProfile(refresh: boolean = false) {
    const searchParams = new URLSearchParams();
    if (refresh) searchParams.append("refresh", "true");
    
    return this.makeRequest<{
      profile: {
        steamId: string;
        steamUsername: string;
        steamAvatarUrl: string;
        steamLinkedAt: string;
        steamSyncEnabled: boolean;
        lastSteamSync?: string;
        steamGameCount: number;
        profileUrl: string;
      };
    }>(`/steam/profile${refresh ? `?${searchParams.toString()}` : ""}`);
  }

  async cacheSteamGame(steamAppId: string) {
    return this.makeRequest<{
      game: {
        steamAppId: string;
        name: string;
        headerImage?: string;
        shortDescription?: string;
        developers: string[];
        publishers: string[];
        genres: string[];
        releaseDate?: string;
        price?: string;
        metacritic?: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/steam/games/${steamAppId}/cache`, {
      method: "POST",
    });
  }

  async fixSteamImages() {
    return this.makeRequest<{
      message: string;
      updatedCount: number;
      totalFound: number;
    }>("/steam/fix-images", {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
