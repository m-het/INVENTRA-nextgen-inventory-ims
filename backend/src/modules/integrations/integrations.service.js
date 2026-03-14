const { PrismaClient } = require('@prisma/client');
const { NotFoundError } = require('../../shared/errors');

const prisma = new PrismaClient();

async function handleWebhook(provider, payload) {
  await prisma.integrationsConfig.upsert({
    where: { provider },
    create: { provider, config: { lastWebhook: new Date().toISOString(), sample: payload } },
    update: { config: { lastWebhook: new Date().toISOString(), sample: payload } },
  }).catch(() => {});
  return { received: true, provider };
}

module.exports = { handleWebhook };
