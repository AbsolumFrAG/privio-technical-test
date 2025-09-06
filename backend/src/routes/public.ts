import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router: Router = Router();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
});

/**
 * GET /api/public/games/popular
 * Get popular games (top rated and most played) with pagination
 */
router.get("/games/popular", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type = "both" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 20)
    );
    const offset = (pageNum - 1) * limitNum;

    let topRatedGames: any[] = [];
    let mostPlayedGames: any[] = [];

    if (type === "both" || type === "topRated") {
      // Get top rated games (average rating >= 4.0, minimum 2 ratings)
      const topRatedLimit = type === "topRated" ? limitNum : Math.ceil(limitNum / 2);
      const topRatedOffset = type === "topRated" ? offset : Math.floor(offset / 2);
      
      topRatedGames = await (prisma.game.groupBy as any)({
        by: ["title"],
        where: {
          isDeleted: false,
          rating: {
            not: null,
          },
          user: {
            isPublic: true,
          },
        },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
        _sum: {
          hoursPlayed: true,
        },
        having: {
          rating: {
            _avg: {
              gte: 4.0,
            },
          },
          id: {
            _count: {
              gte: 2,
            },
          },
        },
        orderBy: {
          _avg: {
            rating: "desc",
          },
        },
        skip: topRatedOffset,
        take: topRatedLimit,
      });
    }

    if (type === "both" || type === "mostPlayed") {
      // Get most played games (minimum 10 total hours)
      mostPlayedGames = await (prisma.game.groupBy as any)({
        by: ["title"],
        where: {
          isDeleted: false,
          user: {
            isPublic: true,
          },
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
        having: {
          hoursPlayed: {
            _sum: {
              gte: 10,
            },
          },
        },
        orderBy: {
          _sum: {
            hoursPlayed: "desc",
          },
        },
        skip: type === "mostPlayed" ? offset : 0,
        take: type === "mostPlayed" ? limitNum : 10,
      });
    }

    // For each game group, get additional details (first occurrence for imageUrl, etc.)
    const getGameDetails = async (
      gameGroups: any[],
      type: "topRated" | "mostPlayed"
    ) => {
      const games = await Promise.all(
        gameGroups.map(async (group) => {
          const sampleGame = await prisma.game.findFirst({
            where: {
              title: group.title,
              isDeleted: false,
              user: {
                isPublic: true,
              },
            },
            select: {
              id: true,
              imageUrl: true,
            },
          });

          return {
            id: sampleGame?.id || `${group.title}-${type}`,
            title: group.title,
            averageRating: group._avg.rating
              ? Number(group._avg.rating.toFixed(1))
              : null,
            totalHoursPlayed: group._sum.hoursPlayed
              ? Number(group._sum.hoursPlayed.toFixed(1))
              : 0,
            totalPlayers: group._count.id,
            imageUrl: sampleGame?.imageUrl || null,
          };
        })
      );

      return games;
    };

    const topRated = await getGameDetails(topRatedGames, "topRated");
    const mostPlayed = await getGameDetails(mostPlayedGames, "mostPlayed");

    // Get total counts for pagination (only when specific type is requested)
    let pagination = undefined;
    if (type !== "both") {
      const totalCountQuery =
        type === "topRated"
          ? (prisma.game.groupBy as any)({
              by: ["title"],
              where: {
                isDeleted: false,
                rating: { not: null },
                user: { isPublic: true },
              },
              having: {
                rating: { _avg: { gte: 4.0 } },
                id: { _count: { gte: 2 } },
              },
            })
          : (prisma.game.groupBy as any)({
              by: ["title"],
              where: {
                isDeleted: false,
                user: { isPublic: true },
              },
              having: {
                hoursPlayed: { _sum: { gte: 10 } },
              },
            });

      const totalItems = await totalCountQuery;
      const totalCount = totalItems.length;
      const totalPages = Math.ceil(totalCount / limitNum);

      pagination = {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      };
    }

    const response: any = {
      topRated,
      mostPlayed,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching popular games:", error);
    res.status(500).json({ error: "Failed to fetch popular games" });
  }
});

/**
 * GET /api/public/games/recent
 * Get recently added games (last 30 days) with pagination
 */
router.get("/games/recent", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 20)
    );
    const offset = (pageNum - 1) * limitNum;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause = {
      isDeleted: false,
      createdAt: {
        gte: thirtyDaysAgo,
      },
      user: {
        isPublic: true,
      },
    };

    const [recentGames, totalCount] = await Promise.all([
      prisma.game.findMany({
        where: whereClause as any,
        select: {
          id: true,
          title: true,
          rating: true,
          hoursPlayed: true,
          imageUrl: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.game.count({ where: whereClause }),
    ]);

    // Group by title and aggregate stats
    const gameGroups = new Map();

    recentGames.forEach((game) => {
      if (!gameGroups.has(game.title)) {
        gameGroups.set(game.title, {
          id: game.id,
          title: game.title,
          imageUrl: game.imageUrl,
          recentlyAddedAt: game.createdAt.toISOString(),
          ratings: [],
          totalHours: 0,
          playerCount: 0,
          latestDate: game.createdAt,
        });
      }

      const group = gameGroups.get(game.title);
      if (game.rating) group.ratings.push(game.rating);
      group.totalHours += game.hoursPlayed || 0;
      group.playerCount += 1;

      // Keep the most recent date
      if (game.createdAt > group.latestDate) {
        group.latestDate = game.createdAt;
        group.recentlyAddedAt = game.createdAt.toISOString();
      }
    });

    const games = Array.from(gameGroups.values())
      .map((group) => ({
        id: group.id,
        title: group.title,
        averageRating:
          group.ratings.length > 0
            ? Number(
                (
                  group.ratings.reduce(
                    (sum: number, rating: number) => sum + rating,
                    0
                  ) / group.ratings.length
                ).toFixed(1)
              )
            : null,
        totalHoursPlayed: Number(group.totalHours.toFixed(1)),
        totalPlayers: group.playerCount,
        recentlyAddedAt: group.recentlyAddedAt,
        imageUrl: group.imageUrl,
      }))
      .sort(
        (a, b) =>
          new Date(b.recentlyAddedAt).getTime() -
          new Date(a.recentlyAddedAt).getTime()
      );

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      games,
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
    console.error("Error fetching recent games:", error);
    res.status(500).json({ error: "Failed to fetch recent games" });
  }
});

/**
 * GET /api/public/games/search?q=query&page=1&limit=20
 * Search for games by title with pagination
 */
router.get("/games/search", async (req: Request, res: Response) => {
  try {
    const validation = searchQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid search query",
        details: validation.error.issues,
      });
    }

    const { q: query } = validation.data;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 20)
    );
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {
      isDeleted: false,
      title: {
        contains: query,
        mode: "insensitive" as any,
      },
      user: {
        isPublic: true,
      },
    };

    // Search for games matching the query (case-insensitive, partial match)
    const [searchResults, totalCount] = await Promise.all([
      prisma.game.findMany({
        where: whereClause as any,
        select: {
          id: true,
          title: true,
          rating: true,
          hoursPlayed: true,
          imageUrl: true,
        },
        orderBy: [
          {
            title: "asc",
          },
        ],
        skip: offset,
        take: limitNum,
      }),
      prisma.game.count({ where: whereClause }),
    ]);

    // Group by title and aggregate stats
    const gameGroups = new Map();

    searchResults.forEach((game) => {
      if (!gameGroups.has(game.title)) {
        gameGroups.set(game.title, {
          id: game.id,
          title: game.title,
          imageUrl: game.imageUrl,
          ratings: [],
          totalHours: 0,
          playerCount: 0,
        });
      }

      const group = gameGroups.get(game.title);
      if (game.rating) group.ratings.push(game.rating);
      group.totalHours += game.hoursPlayed || 0;
      group.playerCount += 1;
    });

    const games = Array.from(gameGroups.values())
      .map((group) => ({
        id: group.id,
        title: group.title,
        averageRating:
          group.ratings.length > 0
            ? Number(
                (
                  group.ratings.reduce(
                    (sum: number, rating: number) => sum + rating,
                    0
                  ) / group.ratings.length
                ).toFixed(1)
              )
            : null,
        totalHoursPlayed: Number(group.totalHours.toFixed(1)),
        totalPlayers: group.playerCount,
        imageUrl: group.imageUrl,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      games,
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
    console.error("Error searching games:", error);
    res.status(500).json({ error: "Failed to search games" });
  }
});

/**
 * GET /api/public/stats
 * Get global platform statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Get total unique games (by title)
    const uniqueGames = await (prisma.game.groupBy as any)({
      by: ["title"],
      where: {
        isDeleted: false,
        user: {
          isPublic: true,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get total public players
    const totalPlayers = await prisma.user.count({
      where: {
        isPublic: true,
      },
    });

    // Get total hours played (across all public games)
    const totalHoursResult = await prisma.game.aggregate({
      where: {
        isDeleted: false,
        user: {
          isPublic: true,
        },
      },
      _sum: {
        hoursPlayed: true,
      },
    });

    // Get average rating across all rated games
    const averageRatingResult = await prisma.game.aggregate({
      where: {
        isDeleted: false,
        rating: {
          not: null,
        },
        user: {
          isPublic: true,
        },
      },
      _avg: {
        rating: true,
      },
    });

    const stats = {
      totalGames: uniqueGames.length,
      totalPlayers,
      totalHoursPlayed: Number(
        (totalHoursResult._sum?.hoursPlayed || 0).toFixed(1)
      ),
      averageRating: averageRatingResult._avg?.rating
        ? Number(averageRatingResult._avg.rating.toFixed(1))
        : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching public stats:", error);
    res.status(500).json({ error: "Failed to fetch public stats" });
  }
});

export { router as publicRouter };
