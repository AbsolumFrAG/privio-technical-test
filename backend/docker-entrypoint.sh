#!/bin/sh
set -e

echo "🔧 Starting GameTracker Backend initialization..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until nc -z database 5432; do
  echo "Database is not ready yet..."
  sleep 2
done

echo "✅ Database is ready!"

# Run Prisma migrations
echo "🗃️ Running Prisma migrations..."
pnpm exec prisma migrate deploy

echo "✅ Migrations completed!"

# Generate Prisma client (in case it's not already done)
echo "🔧 Ensuring Prisma client is generated..."
pnpm exec prisma generate

echo "🚀 Starting application..."
exec "$@"