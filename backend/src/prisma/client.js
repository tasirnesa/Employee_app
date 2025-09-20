const { PrismaClient } = require('@prisma/client');

let prisma;
if (!global.__PRISMA__) {
  global.__PRISMA__ = new PrismaClient({
    log: ['error', 'warn'],
  });
}
prisma = global.__PRISMA__;

module.exports = { prisma };


