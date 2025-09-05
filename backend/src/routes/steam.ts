import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { steamApiService } from "../lib/steam-api";
import { steamAuthService } from "../lib/steam-auth";
import { steamSyncService } from "../lib/steam-sync";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";

export const steamRouter: Router = Router();

// Apply authentication to all routes EXCEPT the callback
steamRouter.use((req, res, next) => {
  // Skip authentication for the callback route
  if (req.path === '/auth/callback') {
    return next();
  }
  // Apply authentication for all other routes
  return authenticateToken(req, res, next);
});

// Validation schemas
const linkSteamSchema = z.object({
  steamId: z.string().regex(/^76561[0-9]{12}$/, "Invalid Steam ID format"),
});

const syncOptionsSchema = z.object({
  skipExisting: z.boolean().default(true),
  updatePlaytime: z.boolean().default(true),
  minimumPlaytime: z.number().min(0).default(0),
  maxGamesToProcess: z.number().min(1).max(2000).optional(),
});

/**
 * GET /api/steam/auth/url
 * Generate Steam authentication URL
 */
steamRouter.get(
  "/auth/url",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { url, state } = await steamAuthService.generateAuthUrl(req.user!.id);

      res.json({
        authUrl: url,
        state, // Frontend should store this for validation
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/steam/auth/callback
 * Handle Steam authentication callback
 */
steamRouter.get(
  "/auth/callback",
  async (req: Request, res: Response, next) => {
    try {
      const authResult = await steamAuthService.verifyCallback(req);

      if (!authResult.success || !authResult.userId) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const errorMessage = authResult.error || "Steam authentication failed";
        
        const errorPage = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Steam Authentication Failed</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                backdrop-filter: blur(10px);
                max-width: 400px;
              }
              .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">❌</div>
              <h2>Steam Authentication Failed</h2>
              <p>${errorMessage}</p>
              <p>This window will close automatically...</p>
            </div>
            <script>
              // Send error message to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'STEAM_AUTH_ERROR',
                  error: '${errorMessage}'
                }, '${frontendUrl}');
              }
              // Close the popup after a short delay
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
          </html>
        `;
        
        res.send(errorPage);
        return;
      }

      // Get Steam player data
      const playerSummary = await steamApiService.getPlayerSummary(
        authResult.steamId
      );
      if (!playerSummary) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = new URL('/settings', frontendUrl);
        redirectUrl.searchParams.set('steamError', "Failed to fetch Steam player data");
        res.redirect(redirectUrl.toString());
        return;
      }

      // Check if Steam account is already linked to another user
      const existingSteamUser = await prisma.user.findFirst({
        where: {
          steamId: authResult.steamId,
          id: { not: authResult.userId },
        },
      });

      if (existingSteamUser) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = new URL('/settings', frontendUrl);
        redirectUrl.searchParams.set('steamError', "This Steam account is already linked to another user");
        res.redirect(redirectUrl.toString());
        return;
      }

      // Link Steam account to user
      const updatedUser = await prisma.user.update({
        where: { id: authResult.userId },
        data: {
          steamId: authResult.steamId,
          steamUsername: playerSummary.personaname,
          steamAvatarUrl: playerSummary.avatarfull,
          steamLinkedAt: new Date(),
          steamSyncEnabled: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          isPublic: true,
          steamId: true,
          steamUsername: true,
          steamAvatarUrl: true,
          steamLinkedAt: true,
          steamSyncEnabled: true,
          createdAt: true,
        },
      });

      // Create a success page that communicates with the parent window
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      const successPage = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Steam Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .success-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h2>Steam Account Linked!</h2>
            <p>Your Steam account "${updatedUser.steamUsername}" has been successfully linked.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            // Send success message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'STEAM_AUTH_SUCCESS',
                data: {
                  steamLinked: true,
                  steamUsername: '${updatedUser.steamUsername || ''}',
                  user: ${JSON.stringify(updatedUser)}
                }
              }, '${frontendUrl}');
            }
            // Close the popup after a short delay
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `;
      
      res.send(successPage);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/steam/link
 * Link Steam account manually (alternative to OAuth)
 */
steamRouter.post(
  "/link",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { steamId } = linkSteamSchema.parse(req.body);

      // Check if Steam account is already linked
      const existingSteamUser = await prisma.user.findFirst({
        where: {
          steamId,
          id: { not: req.user!.id },
        },
      });

      if (existingSteamUser) {
        res.status(409).json({
          error: "This Steam account is already linked to another user",
          code: "STEAM_ALREADY_LINKED",
        });
        return;
      }

      // Fetch Steam player data to validate
      const playerSummary = await steamApiService.getPlayerSummary(steamId);
      if (!playerSummary) {
        res.status(400).json({
          error: "Invalid Steam ID or profile is private",
          code: "STEAM_PROFILE_INVALID",
        });
        return;
      }

      // Link Steam account
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          steamId,
          steamUsername: playerSummary.personaname,
          steamAvatarUrl: playerSummary.avatarfull,
          steamLinkedAt: new Date(),
          steamSyncEnabled: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          isPublic: true,
          steamId: true,
          steamUsername: true,
          steamAvatarUrl: true,
          steamLinkedAt: true,
          steamSyncEnabled: true,
          createdAt: true,
        },
      });

      res.json({
        message: "Steam account linked successfully",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/steam/unlink
 * Unlink Steam account
 */
steamRouter.delete(
  "/unlink",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { steamId: true },
      });

      if (!user?.steamId) {
        res.status(400).json({
          error: "No Steam account linked",
          code: "NO_STEAM_ACCOUNT",
        });
        return;
      }

      // Option to keep or remove Steam games
      const keepGames = req.query.keepGames === "true";

      if (!keepGames) {
        // Mark Steam games as deleted (soft delete)
        await prisma.game.updateMany({
          where: {
            userId: req.user!.id,
            source: "STEAM",
          },
          data: {
            isDeleted: true,
          },
        });
      }

      // Unlink Steam account
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          steamId: null,
          steamUsername: null,
          steamAvatarUrl: null,
          steamLinkedAt: null,
          steamSyncEnabled: false,
          lastSteamSync: null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          isPublic: true,
          createdAt: true,
        },
      });

      res.json({
        message: "Steam account unlinked successfully",
        user: updatedUser,
        gamesRemoved: !keepGames,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/steam/sync
 * Sync Steam library
 */
steamRouter.post(
  "/sync",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const options = syncOptionsSchema.parse(req.body);

      // Check rate limiting
      const syncCheck = await steamSyncService.canUserSync(req.user!.id);
      if (!syncCheck.canSync) {
        res.status(429).json({
          error: "Sync rate limited. Please wait before syncing again.",
          code: "SYNC_RATE_LIMITED",
          nextSyncTime: syncCheck.nextSyncTime,
        });
        return;
      }

      // Start sync process (this runs in background)
      const syncResult = await steamSyncService.syncUserLibrary(
        req.user!.id,
        options
      );

      res.json({
        message: "Steam library sync completed",
        result: syncResult,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/steam/sync/status
 * Get sync status and history
 */
steamRouter.get(
  "/sync/status",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const syncHistory = await steamSyncService.getSyncHistory(
        req.user!.id,
        5
      );
      const syncCheck = await steamSyncService.canUserSync(req.user!.id);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          lastSteamSync: true,
          steamSyncEnabled: true,
          _count: {
            select: {
              games: {
                where: {
                  source: "STEAM",
                  isDeleted: false,
                },
              },
            },
          },
        },
      });

      res.json({
        canSync: syncCheck.canSync,
        nextSyncTime: syncCheck.nextSyncTime,
        lastSync: user?.lastSteamSync,
        syncEnabled: user?.steamSyncEnabled,
        steamGameCount: user?._count.games || 0,
        history: syncHistory,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/steam/settings
 * Update Steam sync settings
 */
steamRouter.patch(
  "/settings",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { steamSyncEnabled } = z
        .object({
          steamSyncEnabled: z.boolean(),
        })
        .parse(req.body);

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: { steamSyncEnabled },
        select: {
          id: true,
          steamSyncEnabled: true,
        },
      });

      res.json({
        message: "Steam settings updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/steam/games/:steamAppId
 * Get cached Steam game metadata
 */
steamRouter.get(
  "/games/:steamAppId",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { steamAppId } = req.params;

      const steamGame = await prisma.steamGame.findUnique({
        where: { steamAppId },
      });

      if (!steamGame) {
        res.status(404).json({
          error: "Steam game not found in cache",
          code: "STEAM_GAME_NOT_CACHED",
        });
        return;
      }

      res.json({ game: steamGame });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/steam/games/:steamAppId/cache
 * Cache Steam game metadata
 */
steamRouter.post(
  "/games/:steamAppId/cache",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { steamAppId } = req.params;

      await steamSyncService.cacheSteamGameMetadata(steamAppId);

      const cachedGame = await prisma.steamGame.findUnique({
        where: { steamAppId },
      });

      if (!cachedGame) {
        res.status(404).json({
          error: "Failed to cache Steam game or game not found",
          code: "CACHE_FAILED",
        });
        return;
      }

      res.json({
        message: "Steam game cached successfully",
        game: cachedGame,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/steam/fix-images
 * Fix missing images for existing Steam games
 */
steamRouter.post(
  "/fix-images",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      // Find games without image URLs
      const gamesNeedingImages = await prisma.game.findMany({
        where: {
          userId: req.user!.id,
          source: "STEAM",
          isDeleted: false,
          OR: [
            { imageUrl: null },
            { steamImageUrl: null },
            { imageUrl: "" },
            { steamImageUrl: "" }
          ]
        },
        select: {
          id: true,
          steamAppId: true,
        }
      });

      let updatedCount = 0;

      for (const game of gamesNeedingImages) {
        if (!game.steamAppId) continue;

        const headerImageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`;
        
        await prisma.game.update({
          where: { id: game.id },
          data: {
            imageUrl: headerImageUrl,
            steamImageUrl: headerImageUrl,
          }
        });
        
        updatedCount++;
      }

      res.json({
        message: `Fixed images for ${updatedCount} Steam games`,
        updatedCount,
        totalFound: gamesNeedingImages.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/steam/profile
 * Get current user's Steam profile info
 */
steamRouter.get(
  "/profile",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          steamId: true,
          steamUsername: true,
          steamAvatarUrl: true,
          steamLinkedAt: true,
          steamSyncEnabled: true,
          lastSteamSync: true,
          _count: {
            select: {
              games: {
                where: {
                  source: "STEAM",
                  isDeleted: false,
                },
              },
            },
          },
        },
      });

      if (!user?.steamId) {
        res.status(404).json({
          error: "No Steam account linked",
          code: "NO_STEAM_ACCOUNT",
        });
        return;
      }

      // Optionally fetch fresh Steam profile data
      let freshProfile = null;
      if (req.query.refresh === "true") {
        try {
          freshProfile = await steamApiService.getPlayerSummary(user.steamId);

          if (freshProfile) {
            // Update cached profile data
            await prisma.user.update({
              where: { id: req.user!.id },
              data: {
                steamUsername: freshProfile.personaname,
                steamAvatarUrl: freshProfile.avatarfull,
              },
            });
          }
        } catch (error) {
          console.error("Failed to refresh Steam profile:", error);
        }
      }

      res.json({
        profile: {
          steamId: user.steamId,
          steamUsername: freshProfile?.personaname || user.steamUsername,
          steamAvatarUrl: freshProfile?.avatarfull || user.steamAvatarUrl,
          steamLinkedAt: user.steamLinkedAt,
          steamSyncEnabled: user.steamSyncEnabled,
          lastSteamSync: user.lastSteamSync,
          steamGameCount: user._count.games,
          profileUrl: `https://steamcommunity.com/profiles/${user.steamId}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
