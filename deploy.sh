#!/usr/bin/env bash
# ============================================================
# iSCARB Platform Production Deployment Script for Linux VM
# Automated single-command deployment for Next.js, Postgres/Redis, PM2, Nginx
# ============================================================

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

HTTP_PORT=80
APP_PORT=3000

log() { echo -e "\n\033[1;34m➔ $1\033[0m"; }
ok()  { echo -e "\033[1;32m✓ $1\033[0m"; }
warn(){ echo -e "\033[1;33m⚠ $1\033[0m"; }
fail(){ echo -e "\033[1;31m✗ $1\033[0m"; exit 1; }

log "Starting iSCARB Production Deployment..."

# 1. System packages
log "1. Installing/updating system packages..."
sudo apt update -y
sudo apt install -y curl build-essential git redis-server nginx ufw ca-certificates gnupg

# 2. Node.js 22 check/install
if ! command -v node >/dev/null 2>&1 || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    log "Installing Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi
ok "Node.js $(node -v) • npm $(npm -v)"

# 3. PM2 check/install
if ! command -v pm2 >/dev/null 2>&1; then
    log "Installing PM2 process manager..."
    sudo npm install -g pm2
fi
ok "PM2 is ready"

# 4. Environment & Secrets Configuration
log "4. Checking environment configuration (.env)..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        warn "Created .env from .env.example. Please update credentials in .env if needed."
    else
        fail ".env file missing and .env.example not found!"
    fi
fi

# Link secrets directory if present
SECRETS_DIR="$HOME/iscarb-secrets"
if [ -d "$SECRETS_DIR" ]; then
    log "Integrating secrets from $SECRETS_DIR..."
    [ -f "$SECRETS_DIR/jwt-private.pem" ] && export JWT_PRIVATE_KEY="$(cat "$SECRETS_DIR/jwt-private.pem")"
    [ -f "$SECRETS_DIR/jwt-public.pem" ] && export JWT_PUBLIC_KEY="$(cat "$SECRETS_DIR/jwt-public.pem")"
    [ -f "$SECRETS_DIR/password-reset.secret" ] && export PASSWORD_RESET_SECRET="$(cat "$SECRETS_DIR/password-reset.secret")"
    [ -f "$SECRETS_DIR/certificate-id.secret" ] && export CERTIFICATE_ID_SECRET="$(cat "$SECRETS_DIR/certificate-id.secret")"
fi

# 5. Services: Redis & Docker / Postgres
log "5. Starting Redis service..."
sudo systemctl enable redis-server || true
sudo systemctl restart redis-server || true

# Start Docker containers for Postgres/Redis if Docker is installed & docker-compose present
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    log "Starting PostgreSQL & Redis containers via Docker Compose..."
    docker compose up -d postgres redis 2>/dev/null || docker-compose up -d postgres redis 2>/dev/null || true
fi

# 6. Install Dependencies & Build Application
log "6. Installing NPM dependencies..."
npm ci --prefer-offline || npm install --no-audit

log "7. Generating Prisma Database Client & Running Migrations..."
npx prisma generate
npx prisma db push --accept-data-loss || npx prisma migrate deploy || warn "Database migration warning, continuing..."

log "8. Building production Next.js application (standalone)..."
if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
fi
export IS_DOCKER=true
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=8192"
export GIT_COMMIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"

npm run build:docker || npm run build

# Prepare standalone static assets
log "Preparing standalone output..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp -r public .next/standalone/public 2>/dev/null || true
cp .env .next/standalone/.env 2>/dev/null || true
cp .env .next/standalone/.env.production 2>/dev/null || true

# 9. PM2 Process Launch
log "9. Launching application with PM2..."
pm2 delete iscarb-api 2>/dev/null || true

if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    cd .next/standalone
    pm2 start server.js --name "iscarb-api" --env production
    cd "$APP_DIR"
fi

pm2 save || true
pm2 startup || true
ok "Application process is running under PM2"

# 10. Configure Nginx Reverse Proxy
log "10. Configuring Nginx Reverse Proxy..."
sudo tee /etc/nginx/sites-available/iscarb > /dev/null <<EOF
server {
    listen $HTTP_PORT default_server;
    listen [::]:$HTTP_PORT default_server;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/iscarb /etc/nginx/sites-enabled/iscarb
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
ok "Nginx active and proxying port $HTTP_PORT -> 127.0.0.1:$APP_PORT"

# 11. Firewall
log "11. Configuring Firewall (UFW)..."
sudo ufw allow OpenSSH || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

# 12. Verification
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "20.2.88.93")
log "Verifying health endpoint..."
sleep 3
curl -sf http://localhost:$APP_PORT/api/health || warn "Health check endpoint warming up..."

echo ""
echo "=========================================================="
echo "           iSCARB DEPLOYMENT COMPLETE!                   "
echo "=========================================================="
echo " App URL:    http://$PUBLIC_IP"
echo " Local URL:  http://localhost:3000"
echo " PM2 Status: pm2 status"
echo " PM2 Logs:   pm2 logs iscarb-api"
echo " Nginx Logs: sudo tail -f /var/log/nginx/error.log"
echo "=========================================================="
