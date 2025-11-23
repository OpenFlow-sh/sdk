#!/bin/bash

# ===========================================================================
# COINBASE LOGIN REDIRECT - COMPLETE REBUILD SCRIPT v2
# ===========================================================================
# This script completely rebuilds the web_server with the Coinbase redirect
# Includes fix for React version dependency conflict
# ===========================================================================

set -e  # Exit on error

echo "🔴 COINBASE LOGIN REDIRECT FIX v2"
echo "================================"
echo ""
echo "Root causes identified:"
echo "  1. docker-compose.yml was using a pre-built image ✅ FIXED"
echo "  2. React 19.2.0 conflicts with Coinbase CDP packages ✅ FIXED"
echo ""
echo "Solutions applied:"
echo "  - Changed docker-compose to build from source"
echo "  - Downgraded React from 19.2.0 to 19.1.1"
echo ""

# Navigate to docker-compose directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"
echo ""

# Step 1: Stop all services
echo "🛑 Step 1/7: Stopping all containers..."
docker compose down
echo "✅ Containers stopped"
echo ""

# Step 2: Remove old web_server images
echo "🗑️  Step 2/7: Removing old web_server images..."
docker rmi $(docker images 'onyx*web*' -q) -f 2>/dev/null || echo "No old images to remove"
docker rmi $(docker images 'onyx-web-server-custom' -q) -f 2>/dev/null || echo "No custom image to remove"
echo "✅ Old images removed"
echo ""

# Step 3: Clean .next cache and node_modules in source
echo "🧹 Step 3/7: Cleaning build artifacts..."
rm -rf ../../web/.next
rm -rf ../../web/node_modules
rm -rf ../../web/package-lock.json
echo "✅ Build artifacts cleaned"
echo ""

# Step 4: Regenerate package-lock.json with correct React version
echo "📦 Step 4/7: Regenerating package-lock.json with React 19.1.1..."
cd ../../web
npm install --package-lock-only
cd -
echo "✅ package-lock.json regenerated"
echo ""

# Step 5: Full rebuild with no cache
echo "🔨 Step 5/7: Building web_server from source (this may take 5-10 minutes)..."
docker compose build --no-cache --pull web_server
echo "✅ Build complete"
echo ""

# Step 6: Start services
echo "🚀 Step 6/7: Starting services..."
docker compose up -d
echo "✅ Services started"
echo ""

# Step 7: Wait for services to be ready
echo "⏳ Step 7/7: Waiting for services to be ready (30 seconds)..."
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
echo "4. Verify React version in build:"
echo "   docker compose exec web_server cat /app/package.json | grep '\"react\"'"
echo "   Expected: React 19.1.1"
echo ""
echo "================================"
echo "🎯 The redirect should now work!"
echo "================================"