import { Response, Router } from "express";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpirationDate,
  hashPassword,
  loginSchema,
  registerSchema,
  verifyPassword,
  verifyRefreshToken,
} from "../lib/auth";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";

export const authRouter: Router = Router();

// Register new user
authRouter.post("/register", async (req, res: Response, next) => {
  try {
    // Validate request body
    const { email, username, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      res.status(409).json({
        error: `User with this ${field} already exists`,
        code: "USER_EXISTS",
      });
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isPublic: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpirationDate(),
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login user
authRouter.post("/login", async (req, res: Response, next) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        isPublic: true,
        steamId: true,
        steamUsername: true,
        steamAvatarUrl: true,
        steamLinkedAt: true,
        steamSyncEnabled: true,
        lastSteamSync: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token in database (cleanup old ones first)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpirationDate(),
      },
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      isPublic: user.isPublic,
      steamId: user.steamId,
      steamUsername: user.steamUsername,
      steamAvatarUrl: user.steamAvatarUrl,
      steamLinkedAt: user.steamLinkedAt,
      steamSyncEnabled: user.steamSyncEnabled,
      lastSteamSync: user.lastSteamSync,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh access token
authRouter.post("/refresh", async (req, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        error: "Refresh token required",
        code: "REFRESH_TOKEN_REQUIRED",
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
      return;
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      res.status(401).json({
        error: "Refresh token expired or not found",
        code: "REFRESH_TOKEN_EXPIRED",
      });
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: storedToken.userId,
      email: storedToken.user.email,
    });
    const newRefreshToken = generateRefreshToken({
      userId: storedToken.userId,
    });

    // Replace refresh token in database
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: getRefreshTokenExpirationDate(),
      },
    });

    res.json({
      message: "Tokens refreshed successfully",
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
authRouter.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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
          lastSteamSync: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              games: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
);

// Logout user (invalidate refresh token)
authRouter.post(
  "/logout",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Delete specific refresh token
        await prisma.refreshToken.deleteMany({
          where: {
            token: refreshToken,
            userId: req.user!.id,
          },
        });
      } else {
        // Delete all refresh tokens for user (logout from all devices)
        await prisma.refreshToken.deleteMany({
          where: { userId: req.user!.id },
        });
      }

      res.json({ message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  }
);

// Update user profile
authRouter.patch(
  "/profile",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { username, isPublic } = req.body;

      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: "No fields to update",
          code: "NO_UPDATE_FIELDS",
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          isPublic: true,
          updatedAt: true,
        },
      });

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);
