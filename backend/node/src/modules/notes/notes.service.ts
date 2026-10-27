import { fromCalendarDate, toCalendarDate, todayInSaoPaulo } from '../../shared/dates.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { canViewDirectReport, canViewNote } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import type { NoteKind, NoteStatus, StepOwner } from './notes.schemas.js';
import { computeNoteStatus, isStepOverdue } from './notes.status.js';

export type StepRecord = {
  id: string;
  position: number;
  text: string;
  dueDate: Date | null;
  owner: StepOwner;
  doneAt: Date | null;
  agreementId: string | null;
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
  steps: StepRecord[];
};

export type NoteChanges = {
  kind?: NoteKind;
  description?: string;
  notedAt?: Date;
  resolvedAt?: Date | null;
  bringToNextSession?: boolean;
};

export type StepChanges = {
  text?: string;
  dueDate?: Date | null;
  owner?: StepOwner;
  doneAt?: Date | null;
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
  addStep: (
    leaderId: string,
    noteId: string,
    data: { text: string; dueDate: Date | null; owner: StepOwner },
  ) => Promise<NoteRecord>;
  updateStep: (
    leaderId: string,
    noteId: string,
    stepId: string,
    changes: StepChanges,
  ) => Promise<NoteRecord>;
  removeStep: (leaderId: string, noteId: string, stepId: string) => Promise<NoteRecord>;
  // Cria o Combinado e grava o vínculo no passo, na mesma transação.
  promoteStep: (
    leaderId: string,
    noteId: string,
    stepId: string,
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

export type StepDto = {
  id: string;
  position: number;
  text: string;
  dueDate: string | null;
  owner: StepOwner;
  done: boolean;
  doneAt: string | null;
  isOverdue: boolean;
  agreementId: string | null;
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
  steps: StepDto[];
  progress: { done: number; total: number };
};

export type NotesService = ReturnType<typeof makeNotesService>;

export const makeNotesService = ({ repo, reports, now = () => new Date() }: Deps) => {
  const toDto = (record: NoteRecord): NoteDto => {
    const today = todayInSaoPaulo(now());
    const steps = [...record.steps]
      .sort((a, b) => a.position - b.position)
      .map((step): StepDto => {
        const dueDate = toCalendarDate(step.dueDate);
        const done = step.doneAt !== null;
        return {
          id: step.id,
          position: step.position,
          text: step.text,
          dueDate,
          owner: step.owner,
          done,
          doneAt: step.doneAt?.toISOString() ?? null,
          isOverdue: isStepOverdue({ dueDate, done }, today),
          agreementId: step.agreementId,
        };
      });
    return {
      id: record.id,
      directReportId: record.directReportId,
      kind: record.kind,
      description: record.description,
      notedAt: toCalendarDate(record.notedAt) ?? '',
      status: computeNoteStatus({ resolvedAt: record.resolvedAt, stepCount: steps.length }),
      bringToNextSession: record.bringToNextSession,
      resolvedAt: record.resolvedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      steps,
      progress: { done: steps.filter((step) => step.done).length, total: steps.length },
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

  const requireStep = async (user: CurrentUser, noteId: string, stepId: string) => {
    const note = await requireNote(user, noteId);
    const step = note.steps.find((item) => item.id === stepId);
    if (!step) throw new NotFoundError('Passo não encontrado', 'STEP_NOT_FOUND');
    return { note, step };
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
        no_plan: all.filter((note) => note.status === 'no_plan').length,
        in_progress: all.filter((note) => note.status === 'in_progress').length,
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

    async addStep(
      user: CurrentUser,
      noteId: string,
      input: { text: string; dueDate?: string | null; owner?: StepOwner },
    ) {
      await requireNote(user, noteId);
      return toDto(
        await repo.addStep(user.leaderId, noteId, {
          text: input.text,
          dueDate: input.dueDate ? fromCalendarDate(input.dueDate) : null,
          owner: input.owner ?? 'leader',
        }),
      );
    },

    async updateStep(
      user: CurrentUser,
      noteId: string,
      stepId: string,
      input: { text?: string; dueDate?: string | null; owner?: StepOwner; done?: boolean },
    ) {
      const { step } = await requireStep(user, noteId, stepId);
      const changes: StepChanges = {
        ...(input.text ? { text: input.text } : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate ? fromCalendarDate(input.dueDate) : null }
          : {}),
        ...(input.owner ? { owner: input.owner } : {}),
        ...(input.done === undefined ? {} : { doneAt: input.done ? (step.doneAt ?? now()) : null }),
      };
      return toDto(await repo.updateStep(user.leaderId, noteId, stepId, changes));
    },

    async removeStep(user: CurrentUser, noteId: string, stepId: string) {
      await requireStep(user, noteId, stepId);
      return toDto(await repo.removeStep(user.leaderId, noteId, stepId));
    },

    // Virar combinado: cria o Combinado da pessoa. Repetir devolve a anotação como está, sem duplicar.
    async promoteStep(user: CurrentUser, noteId: string, stepId: string) {
      const { note, step } = await requireStep(user, noteId, stepId);
      if (step.agreementId) return toDto(note);
      return toDto(await repo.promoteStep(user.leaderId, noteId, stepId, now()));
    },
  };
};
