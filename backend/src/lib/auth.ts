import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const SALT_ROUNDS = 12;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRES_IN = "7d"; // 7 days as per PRD
const REFRESH_TOKEN_EXPIRES_IN = "30d"; // 30 days as per PRD

// Validation schemas
export const registerSchema = z.object({
  email: z.email("Invalid email format"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// JWT token generation
export function generateAccessToken(payload: {
  userId: string;
  email: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: "gametracker-api",
    audience: "gametracker-client",
  });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: "gametracker-api",
    audience: "gametracker-client",
  });
}

// JWT token verification
export function verifyAccessToken(
  token: string
): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "gametracker-api",
      audience: "gametracker-client",
    }) as jwt.JwtPayload;

    if (typeof decoded === "object" && decoded.userId && decoded.email) {
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "gametracker-api",
      audience: "gametracker-client",
    }) as jwt.JwtPayload;

    if (typeof decoded === "object" && decoded.userId) {
      return { userId: decoded.userId };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Token expiration dates
export function getAccessTokenExpirationDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
}

export function getRefreshTokenExpirationDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
}
