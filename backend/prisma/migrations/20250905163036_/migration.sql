-- CreateEnum
CREATE TYPE "public"."GameStatus" AS ENUM ('PLAYING', 'COMPLETED', 'DROPPED', 'BACKLOG');

-- CreateEnum
CREATE TYPE "public"."GameSource" AS ENUM ('MANUAL', 'STEAM');

-- CreateEnum
CREATE TYPE "public"."SteamSyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "steamId" TEXT,
    "steamUsername" TEXT,
    "steamAvatarUrl" TEXT,
    "steamLinkedAt" TIMESTAMP(3),
    "steamSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSteamSync" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."games" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "hoursPlayed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."GameStatus" NOT NULL DEFAULT 'BACKLOG',
    "imageUrl" TEXT,
    "lastPlayedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" "public"."GameSource" NOT NULL DEFAULT 'MANUAL',
    "steamAppId" TEXT,
    "steamName" TEXT,
    "steamPlaytime" DOUBLE PRECISION,
    "steamLastPlayed" TIMESTAMP(3),
    "steamImageUrl" TEXT,
    "isHiddenOnSteam" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."steam_games" (
    "steamAppId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headerImage" TEXT,
    "shortDescription" TEXT,
    "developers" TEXT[],
    "publishers" TEXT[],
    "genres" TEXT[],
    "releaseDate" TEXT,
    "price" TEXT,
    "metacritic" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steam_games_pkey" PRIMARY KEY ("steamAppId")
);

-- CreateTable
CREATE TABLE "public"."steam_sync_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."SteamSyncStatus" NOT NULL,
    "gamesProcessed" INTEGER,
    "gamesImported" INTEGER,
    "gamesUpdated" INTEGER,
    "gamesSkipped" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "steam_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_steamId_key" ON "public"."users"("steamId");

-- CreateIndex
CREATE INDEX "games_source_idx" ON "public"."games"("source");

-- CreateIndex
CREATE INDEX "games_steamAppId_idx" ON "public"."games"("steamAppId");

-- CreateIndex
CREATE UNIQUE INDEX "games_userId_steamAppId_key" ON "public"."games"("userId", "steamAppId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "steam_sync_logs_userId_idx" ON "public"."steam_sync_logs"("userId");

-- CreateIndex
CREATE INDEX "steam_sync_logs_status_idx" ON "public"."steam_sync_logs"("status");

-- AddForeignKey
ALTER TABLE "public"."games" ADD CONSTRAINT "games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."steam_sync_logs" ADD CONSTRAINT "steam_sync_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
