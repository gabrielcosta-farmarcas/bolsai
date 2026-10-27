import { fromCalendarDate, toCalendarDate, todayInSaoPaulo } from '../../shared/dates.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { canViewDirectReport, canViewNote } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import type { AgreementOwner, NoteKind, NoteStatus } from './notes.schemas.js';

export type NoteAgreementRecord = {
  id: string;
  description: string;
  owner: AgreementOwner;
  dueDate: Date | null;
  status: 'open' | 'done' | 'cancelled';
};

export type NoteRecord = {
  id: string;
  leaderId: string;
  directReportId: string;
  kind: NoteKind;
  description: string;
  notedAt: Date;
  resolvedAt: Date | null;
  bringToNextSession: boolean;
  createdAt: Date;
  agreements: NoteAgreementRecord[];
};

export type NoteChanges = {
  kind?: NoteKind;
  description?: string;
  notedAt?: Date;
  resolvedAt?: Date | null;
  bringToNextSession?: boolean;
};

export type NotesRepository = {
  // Todas as leituras só enxergam anotações da líder, não excluídas, de pessoa não excluída.
  listByReport: (leaderId: string, directReportId: string) => Promise<NoteRecord[]>;
  findById: (leaderId: string, id: string) => Promise<NoteRecord | null>;
  create: (
    leaderId: string,
    directReportId: string,
    data: { kind: NoteKind; description: string; notedAt: Date },
  ) => Promise<NoteRecord>;
  update: (leaderId: string, id: string, changes: NoteChanges) => Promise<NoteRecord>;
  remove: (leaderId: string, id: string, deletedAt: Date) => Promise<void>;
  // Cria o Combinado da pessoa já ligado à anotação.
  addAgreement: (
    leaderId: string,
    noteId: string,
    data: { description: string; owner: AgreementOwner; dueDate: Date | null },
    confirmedAt: Date,
  ) => Promise<NoteRecord>;
};

type Deps = {
  repo: NotesRepository;
  reports: {
    findById: (leaderId: string, id: string) => Promise<{ id: string; leaderId: string } | null>;
  };
  now?: () => Date;
};

export type NoteAgreementDto = {
  id: string;
  description: string;
  owner: AgreementOwner;
  dueDate: string | null;
  status: 'open' | 'done';
  isOverdue: boolean;
};

export type NoteDto = {
  id: string;
  directReportId: string;
  kind: NoteKind;
  description: string;
  notedAt: string;
  status: NoteStatus;
  bringToNextSession: boolean;
  resolvedAt: string | null;
  createdAt: string;
  agreements: NoteAgreementDto[];
};

export type NotesService = ReturnType<typeof makeNotesService>;

export const makeNotesService = ({ repo, reports, now = () => new Date() }: Deps) => {
  const toDto = (record: NoteRecord): NoteDto => {
    const today = todayInSaoPaulo(now());
    const agreements = record.agreements
      .filter((item) => item.status !== 'cancelled')
      .map((item): NoteAgreementDto => {
        const dueDate = toCalendarDate(item.dueDate);
        const status = item.status === 'done' ? 'done' : 'open';
        return {
          id: item.id,
          description: item.description,
          owner: item.owner,
          dueDate,
          status,
          isOverdue: status === 'open' && dueDate !== null && dueDate < today,
        };
      });
    return {
      id: record.id,
      directReportId: record.directReportId,
      kind: record.kind,
      description: record.description,
      notedAt: toCalendarDate(record.notedAt) ?? '',
      status: record.resolvedAt ? 'resolved' : 'open',
      bringToNextSession: record.bringToNextSession,
      resolvedAt: record.resolvedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      agreements,
    };
  };

  const requireReport = async (user: CurrentUser, directReportId: string) => {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
  };

  const requireNote = async (user: CurrentUser, id: string) => {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewNote(user, record)) {
      throw new NotFoundError('Anotação não encontrada', 'NOTE_NOT_FOUND');
    }
    return record;
  };

  const sortNewestFirst = (records: NoteRecord[]) =>
    [...records].sort(
      (a, b) =>
        b.notedAt.getTime() - a.notedAt.getTime() || b.createdAt.getTime() - a.createdAt.getTime(),
    );

  return {
    async list(user: CurrentUser, directReportId: string, query: { status?: NoteStatus }) {
      await requireReport(user, directReportId);
      const all = sortNewestFirst(await repo.listByReport(user.leaderId, directReportId)).map(
        toDto,
      );
      const counts = {
        all: all.length,
        open: all.filter((note) => note.status === 'open').length,
        resolved: all.filter((note) => note.status === 'resolved').length,
      };
      const data = query.status ? all.filter((note) => note.status === query.status) : all;
      return { data, counts };
    },

    // Anotações que a líder quer lembrar no próximo encontro: marcadas e ainda não resolvidas.
    async listForNextSession(user: CurrentUser, directReportId: string) {
      await requireReport(user, directReportId);
      return sortNewestFirst(await repo.listByReport(user.leaderId, directReportId))
        .filter((note) => note.bringToNextSession && note.resolvedAt === null)
        .map(toDto);
    },

    async create(
      user: CurrentUser,
      directReportId: string,
      input: { kind: NoteKind; description: string; notedAt?: string },
    ) {
      await requireReport(user, directReportId);
      const created = await repo.create(user.leaderId, directReportId, {
        kind: input.kind,
        description: input.description,
        notedAt: fromCalendarDate(input.notedAt ?? todayInSaoPaulo(now())),
      });
      return toDto(created);
    },

    async update(
      user: CurrentUser,
      id: string,
      input: {
        kind?: NoteKind;
        description?: string;
        notedAt?: string;
        resolved?: boolean;
        bringToNextSession?: boolean;
      },
    ) {
      const current = await requireNote(user, id);
      const resolvedAt =
        input.resolved === undefined ? current.resolvedAt : input.resolved ? now() : null;
      const bring = input.bringToNextSession ?? current.bringToNextSession;
      const changes: NoteChanges = {
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.notedAt ? { notedAt: fromCalendarDate(input.notedAt) } : {}),
        resolvedAt,
        // Resolvida deixa de ser lembrete do próximo encontro.
        bringToNextSession: resolvedAt ? false : bring,
      };
      return toDto(await repo.update(user.leaderId, id, changes));
    },

    async remove(user: CurrentUser, id: string) {
      await requireNote(user, id);
      await repo.remove(user.leaderId, id, now());
    },

    // Combinado a partir da anotação: aparece aqui e na aba Combinados da pessoa.
    async addAgreement(
      user: CurrentUser,
      noteId: string,
      input: { description: string; owner: AgreementOwner; dueDate?: string | null },
    ) {
      await requireNote(user, noteId);
      return toDto(
        await repo.addAgreement(
          user.leaderId,
          noteId,
          {
            description: input.description,
            owner: input.owner,
            dueDate: input.dueDate ? fromCalendarDate(input.dueDate) : null,
          },
          now(),
        ),
      );
    },
  };
};
