import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    res.status(400).json({
      error: "Validation failed",
      details: validationErrors,
    });
    return;
  }

  // Handle known API errors
  if (err.statusCode) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;

    switch (prismaError.code) {
      case "P2002":
        res.status(409).json({
          error: "A record with this information already exists",
          code: "DUPLICATE_ENTRY",
        });
        return;
      case "P2025":
        res.status(404).json({
          error: "Record not found",
          code: "NOT_FOUND",
        });
        return;
      default:
        res.status(400).json({
          error: "Database operation failed",
          code: "DATABASE_ERROR",
        });
        return;
    }
  }

  // Default server error
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    code: "INTERNAL_ERROR",
  });
}
