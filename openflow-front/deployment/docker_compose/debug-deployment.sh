#!/bin/bash

# OpenFlow Deployment Debugging Script
# This script diagnoses environment variable and configuration issues

set -e

echo "=========================================="
echo "OpenFlow Deployment Diagnostic Tool"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
WORKING_LOCAL_ENV="/home/pasho/Documents/pjs/ethglobal-arg/onyx/deployment/docker_compose/.env"
PRODUCTION_ENV="/home/pasho/Documents/pjs/ethglobal-arg-repos/openflow-front/deployment/docker_compose/.env"
ENV_EXAMPLE="/home/pasho/Documents/pjs/ethglobal-arg-repos/openflow-front/web/.env.local.example"
DOCKER_COMPOSE_FILE="/home/pasho/Documents/pjs/ethglobal-arg-repos/openflow-front/deployment/docker_compose/docker-compose.yml"

echo -e "${BLUE}[1/7] Checking File Existence${NC}"
echo "----------------------------------------"

files_exist=true
for file in "$WORKING_LOCAL_ENV" "$PRODUCTION_ENV" "$ENV_EXAMPLE" "$DOCKER_COMPOSE_FILE"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        files_exist=false
    fi
done
echo ""

if [ "$files_exist" = false ]; then
    echo -e "${RED}ERROR: Some required files are missing!${NC}"
    exit 1
fi

echo -e "${BLUE}[2/7] Comparing NEXT_PUBLIC_* Variables${NC}"
echo "----------------------------------------"

echo "Extracting NEXT_PUBLIC_* variables from working local .env..."
LOCAL_NEXT_PUBLIC=$(grep -E '^NEXT_PUBLIC_' "$WORKING_LOCAL_ENV" | sort || echo "")

echo "Extracting NEXT_PUBLIC_* variables from production .env..."
PROD_NEXT_PUBLIC=$(grep -E '^NEXT_PUBLIC_' "$PRODUCTION_ENV" | sort || echo "")

echo ""
echo -e "${YELLOW}Working Local .env (NEXT_PUBLIC_* variables):${NC}"
if [ -z "$LOCAL_NEXT_PUBLIC" ]; then
    echo "  (none found)"
else
    echo "$LOCAL_NEXT_PUBLIC" | while read line; do
        echo "  $line"
    done
fi

echo ""
echo -e "${YELLOW}Production .env (NEXT_PUBLIC_* variables):${NC}"
if [ -z "$PROD_NEXT_PUBLIC" ]; then
    echo "  (none found)"
else
    echo "$PROD_NEXT_PUBLIC" | while read line; do
        echo "  $line"
    done
fi

echo ""
echo -e "${YELLOW}Difference Analysis:${NC}"

# Variables in local but not in production
echo "Variables in LOCAL but MISSING in PRODUCTION:"
if [ -z "$LOCAL_NEXT_PUBLIC" ]; then
    echo "  (no local variables to compare)"
else
    while IFS= read -r line; do
        var_name=$(echo "$line" | cut -d'=' -f1)
        if ! grep -q "^$var_name=" "$PRODUCTION_ENV" 2>/dev/null; then
            echo -e "  ${RED}✗ MISSING: $var_name${NC}"
        fi
    done <<< "$LOCAL_NEXT_PUBLIC"
fi

echo ""

# Variables in production but not in local
echo "Variables in PRODUCTION but NOT in LOCAL:"
if [ -z "$PROD_NEXT_PUBLIC" ]; then
    echo "  (no production variables)"
else
    while IFS= read -r line; do
        var_name=$(echo "$line" | cut -d'=' -f1)
        if ! grep -q "^$var_name=" "$WORKING_LOCAL_ENV" 2>/dev/null; then
            echo -e "  ${YELLOW}⚠ EXTRA: $var_name${NC}"
        fi
    done <<< "$PROD_NEXT_PUBLIC"
fi

echo ""
echo -e "${BLUE}[3/7] Checking CDP-Related Variables${NC}"
echo "----------------------------------------"

CDP_VARS=("NEXT_PUBLIC_CDP_PROJECT_ID" "CDP_API_KEY_NAME" "CDP_API_KEY_PRIVATE_KEY")

for var in "${CDP_VARS[@]}"; do
    echo "Checking $var:"
    
    # Check in local
    if grep -q "^$var=" "$WORKING_LOCAL_ENV" 2>/dev/null; then
        local_val=$(grep "^$var=" "$WORKING_LOCAL_ENV" | cut -d'=' -f2-)
        echo -e "  Local: ${GREEN}✓ Present${NC} (value: ${local_val:0:20}...)"
    else
        echo -e "  Local: ${RED}✗ Missing${NC}"
    fi
    
    # Check in production
    if grep -q "^$var=" "$PRODUCTION_ENV" 2>/dev/null; then
        prod_val=$(grep "^$var=" "$PRODUCTION_ENV" | cut -d'=' -f2-)
        echo -e "  Production: ${GREEN}✓ Present${NC} (value: ${prod_val:0:20}...)"
    else
        echo -e "  Production: ${RED}✗ Missing${NC}"
    fi
    echo ""
done

echo -e "${BLUE}[4/7] Analyzing Docker Compose Build Args${NC}"
echo "----------------------------------------"

echo "Checking web_server service build args in docker-compose.yml..."
if grep -A 30 "web_server:" "$DOCKER_COMPOSE_FILE" | grep -A 20 "build:" | grep -q "args:"; then
    echo -e "${GREEN}✓ Build args section found${NC}"
    echo ""
    echo "Build args defined:"
    grep -A 30 "web_server:" "$DOCKER_COMPOSE_FILE" | grep -A 20 "args:" | grep -E '^\s+[A-Z_]+:' | head -20
else
    echo -e "${YELLOW}⚠ No build args section found for web_server${NC}"
fi

echo ""
echo -e "${BLUE}[5/7] Checking Running Containers${NC}"
echo "----------------------------------------"

if command -v docker &> /dev/null; then
    echo "Checking for running OpenFlow containers..."
    
    # Try to find web container
    WEB_CONTAINER=$(docker ps --filter "name=web" --format "{{.Names}}" | head -1 || echo "")
    
    if [ -n "$WEB_CONTAINER" ]; then
        echo -e "${GREEN}✓ Found web container: $WEB_CONTAINER${NC}"
        echo ""
        echo "Environment variables in container (NEXT_PUBLIC_*):"
        docker exec "$WEB_CONTAINER" env | grep "NEXT_PUBLIC_" || echo "  (none found in running container)"
    else
        echo -e "${YELLOW}⚠ No running web container found${NC}"
        echo "  Available containers:"
        docker ps --format "  {{.Names}}"
    fi
else
    echo -e "${YELLOW}⚠ Docker command not available${NC}"
fi

echo ""
echo -e "${BLUE}[6/7] Checking File Modification Dates${NC}"
echo "----------------------------------------"

echo "Production .env last modified:"
stat -c "  %y" "$PRODUCTION_ENV" 2>/dev/null || stat -f "  %Sm" "$PRODUCTION_ENV" 2>/dev/null || echo "  (unable to determine)"

echo ""
echo "Checking Docker image build date (if image exists)..."
IMAGE_NAME="openflow-front-web_server"
if docker images --format "{{.Repository}}" | grep -q "$IMAGE_NAME"; then
    echo "  Image: $IMAGE_NAME"
    docker images --format "  Created: {{.CreatedAt}}" "$IMAGE_NAME" | head -1
else
    echo -e "  ${YELLOW}⚠ Image not found locally${NC}"
fi

echo ""
echo -e "${BLUE}[7/7] Checking .env.local.example${NC}"
echo "----------------------------------------"

echo "Required NEXT_PUBLIC_* variables from example file:"
if [ -f "$ENV_EXAMPLE" ]; then
    grep -E '^NEXT_PUBLIC_' "$ENV_EXAMPLE" | cut -d'=' -f1 | while read var; do
        echo "  - $var"
        
        # Check if in production
        if grep -q "^$var=" "$PRODUCTION_ENV" 2>/dev/null; then
            echo -e "    Production: ${GREEN}✓${NC}"
        else
            echo -e "    Production: ${RED}✗ MISSING${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠ .env.local.example not found${NC}"
fi

echo ""
echo "=========================================="
echo -e "${BLUE}SUMMARY & RECOMMENDATIONS${NC}"
echo "=========================================="
echo ""

echo -e "${YELLOW}Potential Issues Identified:${NC}"
echo ""

# Check for missing CDP vars in production
missing_cdp=false
for var in "${CDP_VARS[@]}"; do
    if ! grep -q "^$var=" "$PRODUCTION_ENV" 2>/dev/null; then
        if ! $missing_cdp; then
            echo "1. Missing CDP Configuration Variables:"
            missing_cdp=true
        fi
        echo "   - $var"
    fi
done

if $missing_cdp; then
    echo "   ${RED}→ Action: Add CDP variables to production .env${NC}"
    echo ""
fi

# Check for NEXT_PUBLIC_ differences
echo "2. Compare the NEXT_PUBLIC_* variables above"
echo "   ${RED}→ Action: Ensure all required NEXT_PUBLIC_* vars are in production .env${NC}"
echo ""

echo "3. After fixing .env:"
echo "   ${RED}→ Action: Rebuild Docker images with updated environment variables${NC}"
echo "   Commands:"
echo "     cd ~/openflow-front/deployment/docker_compose"
echo "     docker-compose down"
echo "     docker-compose build --no-cache web_server"
echo "     docker-compose up -d"
echo ""

echo -e "${GREEN}Diagnostic complete!${NC}"