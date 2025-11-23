#!/bin/bash

echo "🔴 COINBASE LOGIN REDIRECT FIX - Simple Version"
echo "================================================"
echo ""

cd "$(dirname "$0")"

# Stop containers
echo "🛑 Stopping containers..."
docker compose down
echo ""

# Remove old web images
echo "🗑️  Removing old web images..."
docker rmi $(docker images 'onyx*web*' -q) -f 2>/dev/null || true
docker rmi onyx-web-server-custom:latest -f 2>/dev/null || true
echo ""

# Build with legacy peer deps (bypass React version warnings)
echo "🔨 Building web_server..."
docker compose build --no-cache --build-arg NODE_OPTIONS="--max-old-space-size=4096" web_server
echo ""

# Start services  
echo "🚀 Starting services..."
docker compose up -d
echo ""

echo "✅ Done! Wait 30 seconds then test: curl -I http://localhost:3000/auth/login"