import { z } from "zod";

// Steam configuration schema
const steamConfigSchema = z.object({
  apiKey: z.string().min(1, "Steam API key is required"),
  baseUrl: z.url().default("http://localhost:3001"),
  authRealm: z.url().default("http://localhost:3001"),
});

// Environment variable validation
const envSchema = z.object({
  STEAM_API_KEY: z.string().optional(),
  STEAM_BASE_URL: z.string().optional(),
  STEAM_AUTH_REALM: z.string().optional(),
});

const env = envSchema.parse(process.env);

// Steam configuration
export const steamConfig = steamConfigSchema.parse({
  apiKey: env.STEAM_API_KEY || "",
  baseUrl: env.STEAM_BASE_URL || "http://localhost:3001",
  authRealm: env.STEAM_AUTH_REALM || "http://localhost:3001",
});

// Steam API endpoints
export const STEAM_API_ENDPOINTS = {
  PLAYER_SUMMARIES:
    "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
  OWNED_GAMES:
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/",
  APP_DETAILS: "https://store.steampowered.com/api/appdetails",
  OPENID_ENDPOINT: "https://steamcommunity.com/openid/login",
} as const;

// Steam OpenID configuration
export const STEAM_OPENID_CONFIG = {
  identifier: "https://steamcommunity.com/openid",
  realm: steamConfig.authRealm,
  returnUrl: `${steamConfig.baseUrl}/api/steam/auth/callback`,
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  STEAM_API_PER_MINUTE: 200,
  USER_REQUESTS_PER_MINUTE: 30,
  SYNC_COOLDOWN_MINUTES: 5,
} as const;

// Steam ID utilities
export const STEAM_ID_REGEX = /^76561[0-9]{12}$/;

export function isValidSteamId(steamId: string): boolean {
  return STEAM_ID_REGEX.test(steamId);
}

export function extractSteamIdFromUrl(openIdUrl: string): string | null {
  const match = openIdUrl.match(/\/id\/([0-9]{17})/);
  return match ? match[1] : null;
}
