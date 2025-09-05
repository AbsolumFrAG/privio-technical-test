import { Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import { deleteImageByUrl } from "../lib/upload";

export const gamesRouter: Router = Router();

// Validation schemas
const createGameSchema = z.object({
  title: z
    .string()
    .min(1, "Game title is required")
    .max(200, "Title must be less than 200 characters"),
  rating: z.number().min(0).max(5).optional(),
  hoursPlayed: z.number().min(0).default(0),
  status: z
    .enum(["PLAYING", "COMPLETED", "DROPPED", "BACKLOG"])
    .default("BACKLOG"),
  imageUrl: z.string().url().optional(),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

const updateGameSchema = createGameSchema.partial();

// Get user's games
gamesRouter.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search, 
        sortBy = "updatedAt", 
        sortOrder = "desc" 
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.max(
        1,
        Math.min(100, parseInt(limit as string) || 20)
      );
      const offset = (pageNum - 1) * limitNum;

      const where: any = {
        userId: req.user!.id,
        isDeleted: false,
      };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.title = {
          contains: search as string,
          mode: "insensitive",
        };
      }

      // Build orderBy clause based on sortBy and sortOrder
      let orderBy: any = [];
      const validSortFields = ["title", "rating", "hoursPlayed", "createdAt", "updatedAt", "lastPlayedAt"];
      const validSortOrders = ["asc", "desc"];
      
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : "updatedAt";
      const sortDirection = validSortOrders.includes(sortOrder as string) ? sortOrder as string : "desc";

      if (sortField === "lastPlayedAt") {
        orderBy.push({ lastPlayedAt: { sort: sortDirection, nulls: sortDirection === "desc" ? "last" : "first" } });
        orderBy.push({ updatedAt: "desc" }); // Secondary sort
      } else if (sortField === "rating") {
        orderBy.push({ rating: { sort: sortDirection, nulls: sortDirection === "desc" ? "last" : "first" } });
        orderBy.push({ updatedAt: "desc" }); // Secondary sort
      } else {
        orderBy.push({ [sortField]: sortDirection });
      }

      const [games, totalCount] = await Promise.all([
        prisma.game.findMany({
          where,
          select: {
            id: true,
            title: true,
            rating: true,
            hoursPlayed: true,
            status: true,
            imageUrl: true,
            lastPlayedAt: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy,
          skip: offset,
          take: limitNum,
        }),
        prisma.game.count({ where }),
      ]);

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
      next(error);
    }
  }
);

// Get single game
gamesRouter.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const game = await prisma.game.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
          isDeleted: false,
        },
      });

      if (!game) {
        res.status(404).json({
          error: "Game not found",
          code: "GAME_NOT_FOUND",
        });
        return;
      }

      res.json({ game });
    } catch (error) {
      next(error);
    }
  }
);

// Create new game
gamesRouter.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const gameData = createGameSchema.parse(req.body);

      const game = await prisma.game.create({
        data: {
          ...gameData,
          userId: req.user!.id,
        },
      });

      res.status(201).json({
        message: "Game added successfully",
        game,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update game
gamesRouter.patch(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const gameData = updateGameSchema.parse(req.body);

      const existingGame = await prisma.game.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
          isDeleted: false,
        },
      });

      if (!existingGame) {
        res.status(404).json({
          error: "Game not found",
          code: "GAME_NOT_FOUND",
        });
        return;
      }

      // Delete old image if a new one is being set
      if (gameData.imageUrl && existingGame.imageUrl && gameData.imageUrl !== existingGame.imageUrl) {
        deleteImageByUrl(existingGame.imageUrl);
      }

      const updateData: any = { ...gameData };

      // Update lastPlayedAt when status changes to PLAYING or COMPLETED
      if (
        gameData.status &&
        ["PLAYING", "COMPLETED"].includes(gameData.status)
      ) {
        updateData.lastPlayedAt = new Date();
      }

      const game = await prisma.game.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({
        message: "Game updated successfully",
        game,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete game (soft delete)
gamesRouter.delete(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const existingGame = await prisma.game.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
          isDeleted: false,
        },
      });

      if (!existingGame) {
        res.status(404).json({
          error: "Game not found",
          code: "GAME_NOT_FOUND",
        });
        return;
      }

      // Delete associated image file if it exists
      if (existingGame.imageUrl) {
        deleteImageByUrl(existingGame.imageUrl);
      }

      await prisma.game.update({
        where: { id: req.params.id },
        data: { isDeleted: true },
      });

      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// Get user stats
gamesRouter.get(
  "/stats/overview",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const stats = await (prisma.game.groupBy as any)({
        by: ["status"],
        where: {
          userId: req.user!.id,
          isDeleted: false,
        },
        _count: {
          status: true,
        },
        _avg: {
          rating: true,
          hoursPlayed: true,
        },
        _sum: {
          hoursPlayed: true,
        },
      });

      const formattedStats = {
        totalGames: stats.reduce(
          (acc: number, stat: any) => acc + stat._count.status,
          0
        ),
        totalHours: stats.reduce(
          (acc: number, stat: any) => acc + (stat._sum.hoursPlayed || 0),
          0
        ),
        averageRating: stats.reduce(
          (acc: number, stat: any, _: any, arr: any[]) =>
            acc + (stat._avg.rating || 0) / arr.length,
          0
        ),
        byStatus: stats.reduce(
          (acc: Record<string, number>, stat: any) => ({
            ...acc,
            [stat.status]: stat._count.status,
          }),
          {} as Record<string, number>
        ),
      };

      res.json({ stats: formattedStats });
    } catch (error) {
      next(error);
    }
  }
);
