#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Setting up local database...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
  else
    echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
    exit 1
  fi
fi

# Check if container already exists and is running
CONTAINER_RUNNING=false
NEED_RECREATE=false

if docker ps --format '{{.Names}}' | grep -q '^recall-postgres$'; then
  echo -e "${GREEN}✅ PostgreSQL container is already running${NC}"
  CONTAINER_RUNNING=true
elif docker ps -a --format '{{.Names}}' | grep -q '^recall-postgres$'; then
  echo -e "${YELLOW}⚠️  PostgreSQL container exists but is stopped. Attempting to start...${NC}"
  # Try to start the container
  if ! docker start recall-postgres 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Failed to start existing container (likely old port mapping). Recreating...${NC}"
    docker rm recall-postgres
    NEED_RECREATE=true
  fi
else
  NEED_RECREATE=true
fi

# Create new container with ephemeral port if needed
if [ "$NEED_RECREATE" = true ]; then
  echo -e "${CYAN}📦 Starting PostgreSQL container with ephemeral port...${NC}"
  docker compose up -d postgres
fi

# Wait for PostgreSQL to be ready (only if we just started/recreated it)
if [ "$CONTAINER_RUNNING" = false ] || [ "$NEED_RECREATE" = true ]; then
echo -e "${CYAN}⏳ Waiting for PostgreSQL to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if docker compose exec -T postgres pg_isready -U recall > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

  if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ PostgreSQL failed to start after ${max_attempts} seconds${NC}"
    exit 1
  fi
fi

# Get the actual port assigned by Docker
DB_PORT=$(docker port recall-postgres 5432/tcp 2>/dev/null | cut -d: -f2 || echo "")
if [ -z "$DB_PORT" ]; then
  echo -e "${RED}❌ Failed to get database port${NC}"
  exit 1
fi

# Update .env file with the actual port
if [ -f .env ]; then
  # Update DATABASE_URL in .env file
  if grep -q "^DATABASE_URL=" .env; then
    # Replace the port in DATABASE_URL (cross-platform sed)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS (BSD sed) requires empty extension for in-place editing
      sed -i '' "s|DATABASE_URL=postgresql://recall:recall@localhost:[0-9]*/recall|DATABASE_URL=postgresql://recall:recall@localhost:${DB_PORT}/recall|" .env
    else
      # Linux (GNU sed) can use -i without extension
      sed -i "s|DATABASE_URL=postgresql://recall:recall@localhost:[0-9]*/recall|DATABASE_URL=postgresql://recall:recall@localhost:${DB_PORT}/recall|" .env
    fi
  else
    # Add DATABASE_URL if it doesn't exist
    echo "DATABASE_URL=postgresql://recall:recall@localhost:${DB_PORT}/recall" >> .env
  fi
  echo -e "${GREEN}✅ Updated .env with database port: ${DB_PORT}${NC}"
fi

# Run migrations if drizzle directory exists
if [ -d "drizzle" ] && [ "$(ls -A drizzle 2>/dev/null)" ]; then
  echo -e "${CYAN}🔄 Running database migrations...${NC}"
  bun run db:migrate || echo -e "${YELLOW}⚠️  No migrations to run or migration failed${NC}"
else
  echo -e "${YELLOW}ℹ️  No migrations found. Run 'bun run db:generate' to create migrations.${NC}"
fi

echo -e "${GREEN}✨ Database setup complete!${NC}"
echo -e "${CYAN}📊 Connection string:${NC}"
echo -e "   ${GREEN}postgresql://recall:recall@localhost:${DB_PORT}/recall${NC}"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo -e "   ${GREEN}bun run db:studio${NC}    - Open Drizzle Studio"
echo -e "   ${GREEN}bun run db:generate${NC}  - Generate migrations from schema"
echo -e "   ${GREEN}bun run db:push${NC}      - Push schema changes directly"
echo -e "   ${GREEN}bun run db:down${NC}      - Stop database container"
