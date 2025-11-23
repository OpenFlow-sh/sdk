#!/bin/bash

# ===========================================================================
# COINBASE LOGIN REDIRECT - COMPLETE REBUILD SCRIPT
# ===========================================================================
# This script completely rebuilds the web_server with the Coinbase redirect
# ===========================================================================

set -e  # Exit on error

echo "🔴 COINBASE LOGIN REDIRECT FIX"
echo "================================"
echo ""
echo "Root cause: docker-compose.yml was using a pre-built image"
echo "Solution: Changed to build from source"
echo ""

# Navigate to docker-compose directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"
echo ""

# Step 1: Stop all services
echo "🛑 Step 1/6: Stopping all containers..."
docker compose down
echo "✅ Containers stopped"
echo ""

# Step 2: Remove old web_server images
echo "🗑️  Step 2/6: Removing old web_server images..."
docker rmi $(docker images 'onyx*web*' -q) -f 2>/dev/null || echo "No old images to remove"
docker rmi $(docker images 'onyx-web-server-custom' -q) -f 2>/dev/null || echo "No custom image to remove"
echo "✅ Old images removed"
echo ""

# Step 3: Clean .next cache in source
echo "🧹 Step 3/6: Cleaning .next cache in source..."
rm -rf ../../web/.next
echo "✅ Cache cleaned"
echo ""

# Step 4: Full rebuild with no cache
echo "🔨 Step 4/6: Building web_server from source (this may take 5-10 minutes)..."
docker compose build --no-cache --pull web_server
echo "✅ Build complete"
echo ""

# Step 5: Start services
echo "🚀 Step 5/6: Starting services..."
docker compose up -d
echo "✅ Services started"
echo ""

# Step 6: Wait for services to be ready
echo "⏳ Step 6/6: Waiting for services to be ready (30 seconds)..."
sleep 30
echo "✅ Services should be ready"
echo ""

# Verification
echo "================================"
echo "✅ REBUILD COMPLETE!"
echo "================================"
echo ""
echo "🧪 VERIFICATION STEPS:"
echo ""
echo "1. Test the redirect with curl:"
echo "   curl -I http://localhost:3000/auth/login"
echo "   Expected: Location header with '/auth/coinbase'"
echo ""
echo "2. Test in browser:"
echo "   Open: http://localhost:3000/auth/login"
echo "   Expected: Should redirect to Coinbase CDP login page"
echo ""
echo "3. Check container logs:"
echo "   docker compose logs web_server --tail=50"
echo ""
echo "4. Verify the redirect code is in the build:"
echo "   docker compose exec web_server cat /app/.next/server/app/auth/login/page.js | grep -i redirect"
echo ""
echo "================================"
echo "🎯 The redirect should now work!"
echo "================================"