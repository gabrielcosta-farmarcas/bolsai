import { prisma } from '../../shared/database/prisma.js';

export type SessionRow = {
  id: string;
  subject: string;
  leaderId: string | null;
  kcSid: string | null;
  roles: string[];
  email: string | null;
  name: string | null;
  tokensEnc: string;
  createdAt: Date;
  lastUsedAt: Date;
  refreshedAt: Date;
  expiresAt: Date;
};

export type NewSession = Omit<SessionRow, 'createdAt'>;

export type SessionRepository = {
  create(data: NewSession): Promise<void>;
  findById(id: string): Promise<SessionRow | null>;
  update(
    id: string,
    data: Partial<
      Pick<SessionRow, 'leaderId' | 'roles' | 'tokensEnc' | 'lastUsedAt' | 'refreshedAt'>
    >,
  ): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteByKeycloakSession(sid: string): Promise<number>;
  deleteBySubject(subject: string): Promise<number>;
  deleteExpired(now: Date): Promise<number>;
};

export const sessionRepository: SessionRepository = {
  async create(data) {
    await prisma.authSession.create({ data });
  },
  findById: (id) => prisma.authSession.findUnique({ where: { id } }),
  async update(id, data) {
    await prisma.authSession.updateMany({ where: { id }, data });
  },
  async deleteById(id) {
    await prisma.authSession.deleteMany({ where: { id } });
  },
  async deleteByKeycloakSession(sid) {
    return (await prisma.authSession.deleteMany({ where: { kcSid: sid } })).count;
  },
  async deleteBySubject(subject) {
    return (await prisma.authSession.deleteMany({ where: { subject } })).count;
  },
  async deleteExpired(now) {
    return (await prisma.authSession.deleteMany({ where: { expiresAt: { lte: now } } })).count;
  },
};
