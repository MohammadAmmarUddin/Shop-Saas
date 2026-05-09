require('dotenv').config();
const { execSync } = require('child_process');
const logger = require('./logger');

async function migrate() {
  try {
    logger.info('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname + '/../..' });
    logger.info('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
