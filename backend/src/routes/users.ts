import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router: Router = Router();

// Validation schemas
const userSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
});

/**
 * GET /api/users/search?q=query&page=1&limit=20
 * Search for public users by username with pagination
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const validation = userSearchQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid search query",
        details: validation.error.issues,
      });
    }

    const { q: query } = validation.data;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {
      isPublic: true,
      username: {
        contains: query,
        mode: "insensitive" as any,
      },
    };

    // Search for users matching the query (case-insensitive, partial match)
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          steamUsername: true,
          steamAvatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              games: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: [
          {
            username: "asc",
          },
        ],
        skip: offset,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        steamUsername: user.steamUsername,
        steamAvatarUrl: user.steamAvatarUrl,
        gameCount: user._count.games,
        joinedAt: user.createdAt.toISOString(),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

/**
 * GET /api/users/:id/profile
 * Get public user profile with their game library
 */
router.get("/:id/profile", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Find the user and check if they're public
    const user = await prisma.user.findFirst({
      where: {
        id,
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        steamUsername: true,
        steamAvatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            games: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found or profile is private",
        code: "USER_NOT_FOUND",
      });
    }

    // Get user's public games with pagination
    const [games, totalGameCount] = await Promise.all([
      prisma.game.findMany({
        where: {
          userId: id,
          isDeleted: false,
        },
        select: {
          id: true,
          title: true,
          rating: true,
          hoursPlayed: true,
          status: true,
          imageUrl: true,
          lastPlayedAt: true,
          createdAt: true,
        },
        orderBy: [
          {
            lastPlayedAt: {
              sort: "desc",
              nulls: "last",
            },
          },
          {
            updatedAt: "desc",
          },
        ],
        skip: offset,
        take: limitNum,
      }),
      prisma.game.count({
        where: {
          userId: id,
          isDeleted: false,
        },
      }),
    ]);

    // Get user stats
    const stats = await prisma.game.aggregate({
      where: {
        userId: id,
        isDeleted: false,
      },
      _sum: {
        hoursPlayed: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // Get status breakdown
    const statusBreakdown = await prisma.game.groupBy({
      by: ["status"],
      where: {
        userId: id,
        isDeleted: false,
      },
      _count: {
        id: true,
      },
    });

    const statusCounts = statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const totalPages = Math.ceil(totalGameCount / limitNum);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        steamUsername: user.steamUsername,
        steamAvatarUrl: user.steamAvatarUrl,
        joinedAt: user.createdAt.toISOString(),
        stats: {
          totalGames: stats._count.id || 0,
          totalHours: Number((stats._sum.hoursPlayed || 0).toFixed(1)),
          averageRating: stats._avg.rating
            ? Number(stats._avg.rating.toFixed(1))
            : null,
          statusCounts: {
            PLAYING: statusCounts.PLAYING || 0,
            COMPLETED: statusCounts.COMPLETED || 0,
            DROPPED: statusCounts.DROPPED || 0,
            BACKLOG: statusCounts.BACKLOG || 0,
          },
        },
      },
      games,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount: totalGameCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

/**
 * GET /api/users/:id/games/stats
 * Get detailed statistics for a public user's game library
 */
router.get("/:id/games/stats", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists and is public
    const user = await prisma.user.findFirst({
      where: {
        id,
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found or profile is private",
        code: "USER_NOT_FOUND",
      });
    }

    // Get top games by hours played
    const topGamesByHours = await prisma.game.findMany({
      where: {
        userId: id,
        isDeleted: false,
        hoursPlayed: {
          gt: 0,
        },
      },
      select: {
        title: true,
        hoursPlayed: true,
        imageUrl: true,
      },
      orderBy: {
        hoursPlayed: "desc",
      },
      take: 10,
    });

    // Get top rated games
    const topRatedGames = await prisma.game.findMany({
      where: {
        userId: id,
        isDeleted: false,
        rating: {
          not: null,
        },
      },
      select: {
        title: true,
        rating: true,
        imageUrl: true,
      },
      orderBy: {
        rating: "desc",
      },
      take: 10,
    });

    // Get recent activity
    const recentGames = await prisma.game.findMany({
      where: {
        userId: id,
        isDeleted: false,
        lastPlayedAt: {
          not: null,
        },
      },
      select: {
        title: true,
        lastPlayedAt: true,
        status: true,
        imageUrl: true,
      },
      orderBy: {
        lastPlayedAt: "desc",
      },
      take: 10,
    });

    res.json({
      topGamesByHours: topGamesByHours.map((game) => ({
        title: game.title,
        hoursPlayed: Number(game.hoursPlayed.toFixed(1)),
        imageUrl: game.imageUrl,
      })),
      topRatedGames: topRatedGames.map((game) => ({
        title: game.title,
        rating: game.rating,
        imageUrl: game.imageUrl,
      })),
      recentActivity: recentGames.map((game) => ({
        title: game.title,
        lastPlayedAt: game.lastPlayedAt?.toISOString(),
        status: game.status,
        imageUrl: game.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching user game stats:", error);
    res.status(500).json({ error: "Failed to fetch user game statistics" });
  }
});

export { router as usersRouter };
