/**
 * PM2 ecosystem — alternative to Docker for a long-lived VM deployment.
 *
 * Prerequisites:
 *   1. npm ci && IS_DOCKER=true npm run build
 *   2. Copy .next/static → .next/standalone/.next/static
 *   3. Copy public → .next/standalone/public
 *   4. npx prisma migrate deploy   (explicit deploy step — NOT in PM2 start)
 *   5. cd .next/standalone && pm2 start ../../ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: "iscarb-api",
      script: "server.js",
      cwd: ".next/standalone",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "3G",
      listen_timeout: 120000,
      kill_timeout: 30000,
      env_production: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3000",
        // Set before start: export GIT_COMMIT_SHA=$(git rev-parse HEAD)
        GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA || "unknown",
      },
    },
  ],
};
