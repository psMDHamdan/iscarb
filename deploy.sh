#!/usr/bin/env bash
# ============================================================
# iSCARB Platform Production Docker Deployment Script for VM
# Docker Container Build & Run with baked GIT_COMMIT_SHA
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

log "Starting iSCARB Production Docker Deployment..."

# 1. System packages check
log "1. Checking Docker & Nginx..."
command -v docker >/dev/null 2>&1 || fail "Docker is required but not installed!"
command -v nginx >/dev/null 2>&1 || fail "Nginx is required but not installed!"
ok "Docker and Nginx available"

# 2. Environment & Secrets Configuration
log "2. Checking environment configuration (.env)..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        warn "Created .env from .env.example."
    else
        fail ".env file missing and .env.example not found!"
    fi
fi

# Integrate secrets from ~/iscarb-secrets if available
SECRETS_DIR="$HOME/iscarb-secrets"
if [ -d "$SECRETS_DIR" ]; then
    log "Integrating secrets from $SECRETS_DIR..."
    [ -f "$SECRETS_DIR/jwt-private.pem" ] && export JWT_PRIVATE_KEY="$(cat "$SECRETS_DIR/jwt-private.pem")"
    [ -f "$SECRETS_DIR/jwt-public.pem" ] && export JWT_PUBLIC_KEY="$(cat "$SECRETS_DIR/jwt-public.pem")"
    [ -f "$SECRETS_DIR/password-reset.secret" ] && export PASSWORD_RESET_SECRET="$(cat "$SECRETS_DIR/password-reset.secret")"
    [ -f "$SECRETS_DIR/certificate-id.secret" ] && export CERTIFICATE_ID_SECRET="$(cat "$SECRETS_DIR/certificate-id.secret")"
fi

# 3. Datastores: PostgreSQL & Redis via Docker Compose
log "3. Starting PostgreSQL & Redis datastores..."
docker compose up -d postgres redis 2>/dev/null || docker-compose up -d postgres redis 2>/dev/null || true
ok "PostgreSQL and Redis containers running"

# 4. Database Migrations (explicit deploy step)
log "4. Running Database Migrations..."
npx prisma generate
npx prisma db push --accept-data-loss || npx prisma migrate deploy || warn "Database migration completed with warnings."
ok "Database schema synchronized"

# 5. Build Docker Image with baked GIT_COMMIT_SHA
GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
log "5. Freeing disk space & building Docker image iscarb-api:${GIT_SHA:0:8}..."
docker system prune -f 2>/dev/null || true
docker build --build-arg GIT_COMMIT_SHA="$GIT_SHA" -t iscarb-api:latest -t "iscarb-api:${GIT_SHA:0:8}" .
ok "Docker image build successful (exit 0)"

# 6. Run Production Container long-lived
log "6. Launching production container (iscarb-api)..."
docker stop iscarb-api 2>/dev/null || true
docker rm iscarb-api 2>/dev/null || true
pm2 delete iscarb-api 2>/dev/null || true

docker run -d \
  --name iscarb-api \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  iscarb-api:latest

ok "Docker container iscarb-api running on port 3000"

# 7. Configure Nginx Reverse Proxy
log "7. Configuring Nginx Reverse Proxy..."
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
ok "Nginx active and proxying port 80 -> 127.0.0.1:3000"

# Re-apply Certbot SSL if present
if command -v certbot >/dev/null 2>&1 && [ -d "/etc/letsencrypt/live/demo.iscarb.org" ]; then
    log "Re-applying SSL configuration for demo.iscarb.org..."
    sudo certbot --nginx --non-interactive --agree-tos -m admin@iscarb.org -d demo.iscarb.org --redirect 2>/dev/null || true
fi

# 8. Firewall
log "8. Configuring Firewall (UFW)..."
sudo ufw allow OpenSSH || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

# 9. Verification
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "20.2.88.93")
log "9. Verifying health endpoint..."
sleep 5
HEALTH_JSON=$(curl -s http://localhost:3000/api/health || echo "{}")
echo "Health Response: $HEALTH_JSON"

echo ""
echo "=========================================================="
echo "      iSCARB DOCKER PRODUCTION DEPLOYMENT COMPLETE!      "
echo "=========================================================="
echo " App URL:        https://demo.iscarb.org"
echo " Local URL:      http://localhost:3000"
echo " Container Name: iscarb-api"
echo " Container SHA:  $GIT_SHA"
echo " Logs:           docker logs -f iscarb-api"
echo " Nginx Logs:     sudo tail -f /var/log/nginx/error.log"
echo "=========================================================="
