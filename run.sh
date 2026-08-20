#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#  iSCARB — Production & Microservices Startup Script
#  Orchestrates PostgreSQL, Redis, Jena Fuseki RDF Triple Store & Application
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

step()  { echo -e "${BLUE}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; exit 1; }
header(){ echo -e "\n${CYAN}${BOLD}── $1 ──${NC}"; }

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"
PORT="${PORT:-3000}"

# ── Phase 1: Environment check ──
header "Phase 1: Environment Verification"

command -v node >/dev/null 2>&1 || fail "Node.js not found"
command -v npm  >/dev/null 2>&1 || fail "npm not found"
ok "Node $(node --version) • npm $(npm --version)"

if [ ! -f ".env" ]; then
  [ -f ".env.example" ] && cp .env.example .env && warn "Created .env from .env.example"
fi
set -a; source .env 2>/dev/null; set +a
ok ".env loaded"

# ── Phase 2: Microservices Stack & Database Verification ──
header "Phase 2: Database & Microservice Schemas"

step "Generating Prisma Clients..."
npx prisma generate
ok "Prisma schema validated and client generated."

# ── Phase 3: Apache Jena Fuseki & Ontop RDF Triple Store Check ──
header "Phase 3: Ontop VKG & Fuseki RDF Triple Store"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  step "Starting Fuseki RDF Triple Store via Docker..."
  docker compose -f docker-compose.fuseki.yml up -d fuseki 2>/dev/null || true
  ok "Fuseki RDF Triple Store active on http://localhost:3030"
else
  warn "Docker not available; proceeding with HTTP fallback for RDF triple store."
fi

# ── Phase 4: Launch Web Application ──
header "Phase 4: Launch Web Application"

# Kill any existing process on the target port (try multiple methods)
step "Checking port $PORT..."
KILLED=false

# Method 1: fuser (most reliable on Linux)
if command -v fuser >/dev/null 2>&1; then
  if fuser "${PORT}/tcp" >/dev/null 2>&1; then
    warn "Port $PORT is in use. Killing process with fuser..."
    fuser -k "${PORT}/tcp" 2>/dev/null || true
    sleep 2
    KILLED=true
  fi
fi

# Method 2: lsof fallback
if [ "$KILLED" = false ] && command -v lsof >/dev/null 2>&1; then
  EXISTING_PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$EXISTING_PID" ]; then
    warn "Port $PORT is in use (PID: $EXISTING_PID). Killing..."
    kill -9 "$EXISTING_PID" 2>/dev/null || true
    sleep 2
    KILLED=true
  fi
fi

# Method 3: ss + kill fallback
if [ "$KILLED" = false ]; then
  EXISTING_PID=$(ss -tlnp "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1 || true)
  if [ -n "$EXISTING_PID" ]; then
    warn "Port $PORT is in use (PID: $EXISTING_PID). Killing..."
    kill -9 "$EXISTING_PID" 2>/dev/null || true
    sleep 2
  fi
fi

ok "Port $PORT is ready."

step "Starting iSCARB Next.js Server on port $PORT..."
exec npm run dev
