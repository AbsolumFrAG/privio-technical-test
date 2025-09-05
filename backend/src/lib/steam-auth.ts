import { Request } from "express";
import { RelyingParty } from "openid";
import crypto from "crypto";
import {
  STEAM_OPENID_CONFIG,
  extractSteamIdFromUrl,
  isValidSteamId,
} from "../config/steam";

// In-memory store for CSRF tokens (in production, use Redis or session store)
const csrfTokens = new Map<
  string,
  { token: string; expires: number; userId: string }
>();

// Cleanup expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface SteamAuthResult {
  steamId: string;
  success: boolean;
  error?: string;
  userId?: string; // The user ID associated with this auth attempt
}

export class SteamAuthService {
  constructor() {
    // We'll create the RelyingParty dynamically with the state parameter
  }

  private createRelyingParty(returnUrl: string): RelyingParty {
    return new RelyingParty(
      returnUrl,
      STEAM_OPENID_CONFIG.realm,
      true, // Use stateless verification
      false, // Don't use extensions
      [] // Extensions array
    );
  }

  /**
   * Generate authentication URL for Steam OpenID
   */
  async generateAuthUrl(
    userId: string
  ): Promise<{ url: string; state: string }> {
    return new Promise((resolve, reject) => {
      // Generate CSRF token
      const state = crypto.randomBytes(32).toString("hex");
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      csrfTokens.set(state, { token: state, expires, userId });

      // Include the state in the return_to URL
      const returnUrl = `${STEAM_OPENID_CONFIG.returnUrl}?state=${state}`;
      const relyingParty = this.createRelyingParty(returnUrl);

      relyingParty.authenticate(
        STEAM_OPENID_CONFIG.identifier,
        false,
        (error, authUrl) => {
          if (error) {
            reject(
              new Error(`Steam auth URL generation failed: ${error.message}`)
            );
            return;
          }

          if (!authUrl) {
            reject(new Error("No auth URL generated"));
            return;
          }

          resolve({
            url: authUrl,
            state,
          });
        }
      );
    });
  }

  /**
   * Verify Steam OpenID response
   */
  async verifyCallback(req: Request): Promise<SteamAuthResult> {
    try {
      // First check if this is an OpenID response
      if (!req.query['openid.mode'] || req.query['openid.mode'] !== 'id_res') {
        return {
          steamId: "",
          success: false,
          error: "Invalid OpenID response - missing or invalid mode",
        };
      }

      // Extract state from return_to URL in the OpenID response
      const returnToUrl = req.query['openid.return_to'] as string;
      if (!returnToUrl) {
        return {
          steamId: "",
          success: false,
          error: "Missing return_to URL in OpenID response",
        };
      }

      // Parse state from the return_to URL
      const returnToUrlParsed = new URL(returnToUrl);
      const state = returnToUrlParsed.searchParams.get('state');

      if (!state) {
        return {
          steamId: "",
          success: false,
          error: "Missing CSRF token in return_to URL",
        };
      }

      // Validate CSRF token
      const storedToken = csrfTokens.get(state);
      if (!storedToken || storedToken.expires < Date.now()) {
        csrfTokens.delete(state);
        return {
          steamId: "",
          success: false,
          error: "Invalid or expired CSRF token",
        };
      }

      // Clean up used token
      csrfTokens.delete(state);

      const { userId } = storedToken;

      // Create RelyingParty with the same return_to URL that was used for generation
      const relyingParty = this.createRelyingParty(returnToUrl);

      return new Promise((resolve) => {
        relyingParty.verifyAssertion(req, (error, result) => {
          if (error) {
            resolve({
              steamId: "",
              success: false,
              error: `Verification failed: ${error.message}`,
            });
            return;
          }

          if (!result || !result.authenticated) {
            resolve({
              steamId: "",
              success: false,
              error: "Authentication failed",
            });
            return;
          }

          // Extract Steam ID from the claimed identifier
          const claimedId = result.claimedIdentifier;
          if (!claimedId) {
            resolve({
              steamId: "",
              success: false,
              error: "No claimed identifier found",
            });
            return;
          }

          const steamId = extractSteamIdFromUrl(claimedId);
          if (!steamId || !isValidSteamId(steamId)) {
            resolve({
              steamId: "",
              success: false,
              error: "Invalid Steam ID format",
            });
            return;
          }

          resolve({
            steamId,
            success: true,
            userId,
          });
        });
      });
    } catch (error) {
      return {
        steamId: "",
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown verification error",
      };
    }
  }

  /**
   * Clean up expired CSRF tokens manually
   */
  cleanupTokens(): void {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expires < now) {
        csrfTokens.delete(key);
      }
    }
  }
}

// Singleton instance
export const steamAuthService = new SteamAuthService();
