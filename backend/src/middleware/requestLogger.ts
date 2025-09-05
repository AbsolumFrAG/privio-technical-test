import { NextFunction, Request, Response } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Skip logging for health checks in production
  if (process.env.NODE_ENV === "production" && req.path === "/health") {
    next();
    return;
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "ERROR" : "INFO";

    console.log(
      `[${logLevel}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get("User-Agent"),
        ip: req.ip || req.socket.remoteAddress,
        timestamp: new Date().toISOString(),
      }
    );
  });

  next();
}
