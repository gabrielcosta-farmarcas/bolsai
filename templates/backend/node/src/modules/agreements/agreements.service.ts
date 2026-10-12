import { NotFoundError } from '../../shared/errors/not-found-error.js';
import {
  fromCalendarDate,
  isOverdue,
  toCalendarDate,
  todayInSaoPaulo,
} from '../../shared/dates.js';
import { normalizePage, toPage } from '../../shared/pagination.js';
import { canViewAgreement, canViewDirectReport } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import type { OpenAgreementContext } from '../analyses/analysis-input.js';
import type {
  AgreementOwner,
  AgreementStatus,
  AgreementStatusFilter,
} from './agreements.schemas.js';

export type AgreementRecord = {
  id: string;
  leaderId: string;
  directReportId: string;
  directReportName: string;
  originSessionId: string | null;
  analysisId: string | null;
  description: string;
  owner: AgreementOwner;
  dueDate: Date | null;
  status: AgreementStatus;
  evidenceExcerpt: string | null;
  origin: 'ai' | 'leader';
  confirmedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
};

export type AgreementFilter = {
  status?: AgreementStatus;
  // Aberto com prazo anterior a este dia (AAAA-MM-DD).
  overdueBefore?: string;
  directReportId?: string;
};

export type AgreementChanges = {
  description?: string;
  owner?: AgreementOwner;
  dueDate?: Date | null;
  status?: AgreementStatus;
  closedAt?: Date | null;
  confirmedAt?: Date;
};

export type AgreementsRepository = {
  // Todas as leituras só enxergam combinados de liderado do líder e não excluído.
  list: (
    leaderId: string,
    filter: AgreementFilter,
    page: { skip: number; take: number },
  ) => Promise<{ data: AgreementRecord[]; total: number }>;
  listByReport: (leaderId: string, directReportId: string) => Promise<AgreementRecord[]>;
  listBySession: (leaderId: string, sessionId: string) => Promise<AgreementRecord[]>;
  findById: (leaderId: string, id: string) => Promise<AgreementRecord | null>;
  create: (
    leaderId: string,
    directReportId: string,
    data: {
      description: string;
      owner: AgreementOwner;
      dueDate: Date | null;
      originSessionId: string | null;
      confirmedAt: Date;
    },
  ) => Promise<AgreementRecord>;
  update: (leaderId: string, id: string, changes: AgreementChanges) => Promise<AgreementRecord>;
  // Abertos que a próxima análise deve ver: do liderado, até a data do encontro, fora o próprio encontro.
  listOpen: (
    leaderId: string,
    directReportId: string,
    filter: { onOrBefore: Date; excludeSessionId: string },
  ) => Promise<OpenAgreementContext[]>;
};

type Deps = {
  repo: AgreementsRepository;
  reports: {
    findById: (leaderId: string, id: string) => Promise<{ id: string; leaderId: string } | null>;
  };
  sessions: {
    findById: (
      leaderId: string,
      id: string,
    ) => Promise<{ id: string; directReportId: string } | null>;
  };
  now?: () => Date;
};

export type AgreementDto = {
  id: string;
  directReportId: string;
  directReportName: string;
  originSessionId: string | null;
  analysisId: string | null;
  description: string;
  owner: AgreementOwner;
  dueDate: string | null;
  status: AgreementStatus;
  isOverdue: boolean;
  evidenceExcerpt: string | null;
  origin: 'ai' | 'leader';
  // Falso enquanto o combinado é da IA e o líder ainda não editou nem revisou.
  isConfirmed: boolean;
  closedAt: string | null;
  createdAt: string;
};

export const makeAgreementsService = ({
  repo,
  reports,
  sessions,
  now = () => new Date(),
}: Deps) => {
  const toDto = (record: AgreementRecord): AgreementDto => {
    const dueDate = toCalendarDate(record.dueDate);
    return {
      id: record.id,
      directReportId: record.directReportId,
      directReportName: record.directReportName,
      originSessionId: record.originSessionId,
      analysisId: record.analysisId,
      description: record.description,
      owner: record.owner,
      dueDate,
      status: record.status,
      isOverdue: isOverdue(dueDate, record.status, todayInSaoPaulo(now())),
      evidenceExcerpt: record.evidenceExcerpt,
      origin: record.origin,
      isConfirmed: record.confirmedAt !== null,
      closedAt: record.closedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    };
  };

  const requireReport = async (user: CurrentUser, directReportId: string) => {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
  };

  const requireAgreement = async (user: CurrentUser, id: string) => {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewAgreement(user, record)) {
      throw new NotFoundError('Combinado não encontrado', 'AGREEMENT_NOT_FOUND');
    }
    return record;
  };

  return {
    async list(
      user: CurrentUser,
      query: {
        page?: number;
        pageSize?: number;
        status?: AgreementStatusFilter;
        directReportId?: string;
      },
    ) {
      const { page, pageSize, skip, take } = normalizePage(query.page, query.pageSize);
      const filter: AgreementFilter = {
        directReportId: query.directReportId,
        ...(query.status === 'overdue'
          ? { status: 'open' as const, overdueBefore: todayInSaoPaulo(now()) }
          : query.status
            ? { status: query.status }
            : {}),
      };
      const { data, total } = await repo.list(user.leaderId, filter, { skip, take });
      return toPage(data.map(toDto), total, page, pageSize);
    },

    async listByReport(user: CurrentUser, directReportId: string) {
      await requireReport(user, directReportId);
      return (await repo.listByReport(user.leaderId, directReportId)).map(toDto);
    },

    async listBySession(user: CurrentUser, sessionId: string) {
      const session = await sessions.findById(user.leaderId, sessionId);
      if (!session) throw new NotFoundError('Encontro não encontrado', 'SESSION_NOT_FOUND');
      return (await repo.listBySession(user.leaderId, sessionId)).map(toDto);
    },

    // Combinado criado à mão: já nasce confirmado (é decisão do líder).
    async create(
      user: CurrentUser,
      directReportId: string,
      input: {
        description: string;
        owner: AgreementOwner;
        dueDate?: string | null;
        sessionId?: string;
      },
    ) {
      await requireReport(user, directReportId);
      if (input.sessionId) {
        const session = await sessions.findById(user.leaderId, input.sessionId);
        if (!session || session.directReportId !== directReportId) {
          throw new NotFoundError('Encontro não encontrado', 'SESSION_NOT_FOUND');
        }
      }
      const created = await repo.create(user.leaderId, directReportId, {
        description: input.description,
        owner: input.owner,
        dueDate: input.dueDate ? fromCalendarDate(input.dueDate) : null,
        originSessionId: input.sessionId ?? null,
        confirmedAt: now(),
      });
      return toDto(created);
    },

    // Editar confirma o combinado (a IA não o substitui mais ao reanalisar o encontro).
    async update(
      user: CurrentUser,
      id: string,
      input: {
        description?: string;
        owner?: AgreementOwner;
        dueDate?: string | null;
        status?: AgreementStatus;
      },
    ) {
      const current = await requireAgreement(user, id);
      const moment = now();
      const changes: AgreementChanges = { confirmedAt: current.confirmedAt ?? moment };

      if (input.description !== undefined) changes.description = input.description;
      if (input.owner !== undefined) changes.owner = input.owner;
      if (input.dueDate !== undefined) {
        changes.dueDate = input.dueDate ? fromCalendarDate(input.dueDate) : null;
      }
      if (input.status !== undefined && input.status !== current.status) {
        changes.status = input.status;
        changes.closedAt = input.status === 'open' ? null : moment;
      }
      return toDto(await repo.update(user.leaderId, id, changes));
    },

    listOpenForAnalysis: repo.listOpen,
  };
};

export type AgreementsService = ReturnType<typeof makeAgreementsService>;
