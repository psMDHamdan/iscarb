const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    dbUrl = trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    break;
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const db = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
});

async function main() {
  const result = await db.assessmentAttempt.deleteMany();
  console.log(`Deleted ${result.count} assessment attempt(s) successfully!`);
}

main()
  .catch((err) => {
    console.error('Failed to clear attempts:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
