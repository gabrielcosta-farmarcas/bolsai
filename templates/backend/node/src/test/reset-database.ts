import { prisma } from '../shared/database/prisma.js';
import { FIXED_LEADER_ID } from '../shared/security/current-user.js';
import { createTestSession, setDefaultTestSession } from './auth.js';

// Só para testes de integração (banco <POSTGRES_DB>_test): apaga os dados na ordem das chaves.
// A líder fixa (criada por migration) não é apagada, mas volta a ficar sem dono do Keycloak.
// Ao final, cria a sessão de teste padrão usada por `authed(app)`.
export const resetDatabase = async () => {
  await prisma.agreement.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.session.deleteMany();
  await prisma.responsibilityMap.deleteMany();
  await prisma.responsibility.deleteMany();
  await prisma.directReport.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.leaderSettings.deleteMany();
  await prisma.leader.deleteMany({ where: { id: { not: FIXED_LEADER_ID } } });
  await prisma.leader.update({ where: { id: FIXED_LEADER_ID }, data: { keycloakSubject: null } });
  setDefaultTestSession(await createTestSession());
};
