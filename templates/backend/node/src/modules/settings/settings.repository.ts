import { prisma } from '../../shared/database/prisma.js';
import type { SettingsRepository } from './settings.service.js';

const select = {
  apiKeyEnc: true,
  apiKeyLast4: true,
  apiKeyUpdatedAt: true,
  model: true,
  analysisPrompt: true,
} as const;

// Cada alteração mexe só no próprio campo; a linha nasce na primeira configuração da líder.
export const settingsRepository: SettingsRepository = {
  get(leaderId) {
    return prisma.leaderSettings.findUnique({ where: { leaderId }, select });
  },

  async saveApiKey(leaderId, data) {
    const fields = {
      apiKeyEnc: data.enc,
      apiKeyLast4: data.last4,
      apiKeyUpdatedAt: data.at,
    };
    await prisma.leaderSettings.upsert({
      where: { leaderId },
      create: { leaderId, ...fields },
      update: fields,
    });
  },

  async clearApiKey(leaderId) {
    await prisma.leaderSettings.updateMany({
      where: { leaderId },
      data: { apiKeyEnc: null, apiKeyLast4: null, apiKeyUpdatedAt: null },
    });
  },

  async saveModel(leaderId, model) {
    await prisma.leaderSettings.upsert({
      where: { leaderId },
      create: { leaderId, model },
      update: { model },
    });
  },

  async savePrompt(leaderId, text) {
    await prisma.leaderSettings.upsert({
      where: { leaderId },
      create: { leaderId, analysisPrompt: text },
      update: { analysisPrompt: text },
    });
  },
};
