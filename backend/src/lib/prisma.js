const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

async function connectWithRetry(maxRetries = 5, delayMs = 3000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await prisma.$connect();
      return prisma;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.connectWithRetry = connectWithRetry;
module.exports.disconnect = disconnect;
