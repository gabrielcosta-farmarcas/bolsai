import { AppError } from '../../shared/errors/app-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { canViewDirectReport, canViewSession } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import type { DirectReportRecord } from '../direct-reports/direct-reports.service.js';

export type SessionStatus = 'draft' | 'analysed' | 'reviewed';

export type SessionRecord = {
  id: string;
  leaderId: string;
  directReportId: string;
  heldOn: Date;
  transcript: string;
  status: SessionStatus;
  summaryExportedAt: Date | null;
  createdAt: Date;
};

export type SessionListItem = Omit<SessionRecord, 'transcript'>;

export type SessionsRepository = {
  create: (
    leaderId: string,
    directReportId: string,
    data: { heldOn: string; transcript: string },
  ) => Promise<SessionRecord>;
  // Só devolve sessões de liderado do líder e não excluído.
  listByReport: (leaderId: string, directReportId: string) => Promise<SessionListItem[]>;
  findById: (leaderId: string, id: string) => Promise<SessionRecord | null>;
  update: (
    leaderId: string,
    id: string,
    data: { heldOn?: string; transcript?: string },
  ) => Promise<SessionRecord>;
};

type ReportsLookup = {
  findById: (
    leaderId: string,
    id: string,
  ) => Promise<Pick<DirectReportRecord, 'id' | 'leaderId'> | null>;
};

export type CreateSessionInput =
  | { kind: 'text'; heldOn: string; transcript: string }
  | { kind: 'file'; heldOn: string; fileName: string; buffer: Buffer };

type Deps = {
  repo: SessionsRepository;
  reports: ReportsLookup;
  parse: (buffer: Buffer, fileName: string) => Promise<string>;
  config: { maxTranscriptChars: number };
};

export type SessionDto = {
  id: string;
  directReportId: string;
  heldOn: string;
  status: SessionStatus;
  summaryExportedAt: string | null;
  createdAt: string;
};

const toListDto = (record: SessionListItem): SessionDto => ({
  id: record.id,
  directReportId: record.directReportId,
  heldOn: record.heldOn.toISOString().slice(0, 10),
  status: record.status,
  summaryExportedAt: record.summaryExportedAt?.toISOString() ?? null,
  createdAt: record.createdAt.toISOString(),
});

const toDetailDto = (record: SessionRecord): SessionDto & { transcript: string } => ({
  ...toListDto(record),
  transcript: record.transcript,
});

export const makeSessionsService = ({ repo, reports, parse, config }: Deps) => {
  const requireReport = async (user: CurrentUser, directReportId: string) => {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
  };

  const requireSession = async (user: CurrentUser, id: string) => {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewSession(user, record)) {
      throw new NotFoundError('Encontro não encontrado', 'SESSION_NOT_FOUND');
    }
    return record;
  };

  const checkTranscript = (raw: string) => {
    const transcript = raw.trim();
    if (transcript.length === 0) {
      throw new AppError('Cole ou envie a transcrição do encontro.', 422, 'EMPTY_TRANSCRIPT');
    }
    if (transcript.length > config.maxTranscriptChars) {
      throw new AppError(
        `A transcrição passa do limite de ${config.maxTranscriptChars} caracteres.`,
        422,
        'TRANSCRIPT_TOO_LONG',
      );
    }
    return transcript;
  };

  return {
    async create(user: CurrentUser, directReportId: string, input: CreateSessionInput) {
      await requireReport(user, directReportId);
      const raw =
        input.kind === 'file' ? await parse(input.buffer, input.fileName) : input.transcript;
      const transcript = checkTranscript(raw);
      const created = await repo.create(user.leaderId, directReportId, {
        heldOn: input.heldOn,
        transcript,
      });
      return toDetailDto(created);
    },

    async listByReport(user: CurrentUser, directReportId: string) {
      await requireReport(user, directReportId);
      return (await repo.listByReport(user.leaderId, directReportId)).map(toListDto);
    },

    async getById(user: CurrentUser, id: string) {
      return toDetailDto(await requireSession(user, id));
    },

    async update(user: CurrentUser, id: string, input: { heldOn?: string; transcript?: string }) {
      await requireSession(user, id);
      const data = {
        ...(input.heldOn ? { heldOn: input.heldOn } : {}),
        ...(input.transcript !== undefined
          ? { transcript: checkTranscript(input.transcript) }
          : {}),
      };
      return toDetailDto(await repo.update(user.leaderId, id, data));
    },
  };
};

export type SessionsService = ReturnType<typeof makeSessionsService>;
