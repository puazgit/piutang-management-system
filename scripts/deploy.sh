#!/bin/bash
# Deployment script for Vercel
# This script will be automatically run during the build process

echo "🚀 Starting deployment setup..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Apply database migrations (if using managed database)
if [ "$DATABASE_URL" != "" ]; then
  echo "🗃️ Applying database migrations..."
  npx prisma migrate deploy
fi

echo "✅ Deployment setup completed!"