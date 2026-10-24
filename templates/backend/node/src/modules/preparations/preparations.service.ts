import type { ZodError } from 'zod';
import { AiResponseError, type AiClient } from '../../shared/ai/ai-client.js';
import { isOverdue, toCalendarDate, todayInSaoPaulo } from '../../shared/dates.js';
import { AppError } from '../../shared/errors/app-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { logger } from '../../shared/logger.js';
import { canViewDirectReport } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import { reviewedAnalysisSchema } from '../analyses/analysis.schema.js';
import type { AgreementRecord } from '../agreements/agreements.service.js';
import {
  MAX_RESPONSIBILITIES,
  MIN_RESPONSIBILITIES,
} from '../responsibilities/responsibilities.schemas.js';
import type { ResponsibilityRecord } from '../responsibilities/responsibilities.service.js';
import { computeMapGaps } from './map-gaps.js';
import { buildPreparationInput } from './preparation-input.js';
import {
  MAX_QUESTIONS,
  MAX_THEMES,
  MIN_QUESTIONS,
  preparationOutputSchema,
  storedPreparationSchema,
  type PreparationOutput,
  type StoredPreparation,
} from './preparation.schema.js';

// Quantos encontros revisados a IA lê (os mais recentes). As lacunas do responsograma olham todos.
const HISTORY_LIMIT = 5;
const STUCK_MESSAGE = 'O roteiro foi interrompido porque a API foi reiniciada. Gere de novo.';
const FORMAT_FAILED_MESSAGE =
  'A IA não devolveu o roteiro no formato esperado, mesmo após uma nova tentativa. Gere de novo.';
const AI_FAILED_MESSAGE = 'Não foi possível obter a resposta da IA. Tente de novo em instantes.';

export type PreparationStatus = 'processing' | 'completed' | 'failed';

export type PreparationRecord = {
  id: string;
  leaderId: string;
  directReportId: string;
  model: string | null;
  status: PreparationStatus;
  errorMessage: string | null;
  mapVersionUsed: number | null;
  content: unknown;
  createdAt: Date;
};

export type ReviewedHistoryRow = { heldOn: Date; reviewedJson: unknown };

export type PreparationsRepository = {
  create: (
    leaderId: string,
    directReportId: string,
    data: { mapVersionUsed: number | null },
  ) => Promise<PreparationRecord>;
  markCompleted: (
    id: string,
    data: { content: StoredPreparation; model: string; inputTokens: number; outputTokens: number },
  ) => Promise<void>;
  markFailed: (id: string, message: string) => Promise<void>;
  // O último roteiro da pessoa, qualquer que seja o estado; nulo se nunca houve.
  findLatest: (leaderId: string, directReportId: string) => Promise<PreparationRecord | null>;
  // Versões finais (revisadas) dos encontros da pessoa, do mais recente para o mais antigo.
  reviewedHistory: (leaderId: string, directReportId: string) => Promise<ReviewedHistoryRow[]>;
  failStuck: (message: string) => Promise<number>;
};

type Deps = {
  repo: PreparationsRepository;
  reports: {
    findById: (leaderId: string, id: string) => Promise<{ id: string; leaderId: string } | null>;
  };
  maps: {
    findCurrent: (
      leaderId: string,
      directReportId: string,
    ) => Promise<{
      version: number;
      text: string;
      mission: string | null;
      behaviors?: string | null;
    } | null>;
  };
  responsibilities: {
    listAll: (leaderId: string, directReportId: string) => Promise<ResponsibilityRecord[]>;
  };
  agreements: {
    listByReport: (leaderId: string, directReportId: string) => Promise<AgreementRecord[]>;
  };
  // Lança AiNotConfiguredError quando falta chave ou modelo.
  getAiClient: (leaderId: string) => AiClient | Promise<AiClient>;
  prompts: { load: () => Promise<string> };
  // Como rodar a geração em segundo plano (testes executam na hora).
  schedule?: (job: () => Promise<void>) => void;
  now?: () => Date;
};

export type PreparationDto = {
  id: string;
  directReportId: string;
  model: string | null;
  status: PreparationStatus;
  errorMessage: string | null;
  mapVersionUsed: number | null;
  createdAt: string;
  content: StoredPreparation | null;
};

const toDto = (record: PreparationRecord): PreparationDto => {
  const parsed =
    record.status === 'completed' ? storedPreparationSchema.safeParse(record.content) : null;
  return {
    id: record.id,
    directReportId: record.directReportId,
    model: record.model,
    status: record.status,
    errorMessage: record.errorMessage,
    mapVersionUsed: record.mapVersionUsed,
    createdAt: record.createdAt.toISOString(),
    content: parsed?.success ? parsed.data : null,
  };
};

const describeZodError = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'raiz'}: ${issue.message}`).join('; ');

// Converte o texto da IA em saída válida ou devolve o motivo (sem conteúdo da conversa).
const validateOutput = (
  text: string,
): { ok: true; value: PreparationOutput } | { ok: false; reason: string } => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'o texto não era um JSON válido' };
  }
  const parsed = preparationOutputSchema.safeParse(json);
  if (!parsed.success) return { ok: false, reason: describeZodError(parsed.error) };
  const count = parsed.data.questions.length;
  if (count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
    return {
      ok: false,
      reason: `questions tem ${count} itens; use de ${MIN_QUESTIONS} a ${MAX_QUESTIONS}`,
    };
  }
  return { ok: true, value: { ...parsed.data, themes: parsed.data.themes.slice(0, MAX_THEMES) } };
};

export const makePreparationsService = (deps: Deps) => {
  const { repo, reports, maps, responsibilities, agreements } = deps;
  const now = deps.now ?? (() => new Date());
  const schedule =
    deps.schedule ??
    ((job: () => Promise<void>) => {
      void job();
    });

  const requireReport = async (user: CurrentUser, directReportId: string) => {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
    return report;
  };

  // Uma chamada à IA, com uma nova tentativa se a saída vier inválida.
  const callAi = async (ai: AiClient, system: string, userMessage: string) => {
    let message = userMessage;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await ai.generateStructured({
        system,
        user: message,
        outputSchema: preparationOutputSchema,
      });
      const checked = validateOutput(response.text);
      if (checked.ok) return { value: checked.value, response };
      message = `${userMessage}\n\nA resposta anterior foi inválida (${checked.reason}). Gere novamente o roteiro completo corrigindo isso.`;
    }
    return null;
  };

  return {
    async start(user: CurrentUser, directReportId: string) {
      await requireReport(user, directReportId);
      const ai = await deps.getAiClient(user.leaderId);

      const [map, allResponsibilities, agreementRecords, reviewed, system] = await Promise.all([
        maps.findCurrent(user.leaderId, directReportId),
        responsibilities.listAll(user.leaderId, directReportId),
        agreements.listByReport(user.leaderId, directReportId),
        repo.reviewedHistory(user.leaderId, directReportId),
        deps.prompts.load(),
      ]);

      const active = allResponsibilities
        .filter((item) => !item.retired)
        .sort((left, right) => left.position - right.position);
      if (!map || active.length < MIN_RESPONSIBILITIES || active.length > MAX_RESPONSIBILITIES) {
        throw new AppError(
          `O responsograma da pessoa precisa ter de ${MIN_RESPONSIBILITIES} a ${MAX_RESPONSIBILITIES} responsabilidades. Atualize na aba Responsograma e tente de novo.`,
          422,
          'RESPONSIBILITIES_REQUIRED',
        );
      }

      const today = todayInSaoPaulo(now());
      const openAgreements = agreementRecords
        .filter((item) => item.status === 'open')
        .map((item) => {
          const dueDate = toCalendarDate(item.dueDate);
          return {
            id: item.id,
            description: item.description,
            owner: item.owner,
            due_date: dueDate,
            is_overdue: isOverdue(dueDate, item.status, today),
          };
        });

      // Só entram os encontros cuja versão final é válida (formato antigo é ignorado).
      const history = reviewed.flatMap((row) => {
        const parsed = reviewedAnalysisSchema.safeParse(row.reviewedJson);
        return parsed.success
          ? [{ heldOn: toCalendarDate(row.heldOn) ?? '', content: parsed.data }]
          : [];
      });
      const gaps = computeMapGaps(
        active.map((item) => ({ id: item.id, title: item.title })),
        history.map((item) => ({
          heldOn: item.heldOn,
          discussedIds: new Set(
            item.content.development_signals.flatMap((signal) =>
              signal.responsibility_id ? [signal.responsibility_id] : [],
            ),
          ),
        })),
      );
      const textById = new Map(active.map((item) => [item.id, item.text]));
      const hasHistory = history.length > 0;

      const record = await repo.create(user.leaderId, directReportId, {
        mapVersionUsed: map.version,
      });

      const userMessage = buildPreparationInput({
        today,
        map: {
          version: map.version,
          mission: map.mission,
          behaviors: map.behaviors,
          responsibilities: active.map((item, index) => ({
            ref: `R${index + 1}`,
            text: item.text,
          })),
        },
        history: history.slice(0, HISTORY_LIMIT).map((item) => ({
          heldOn: item.heldOn,
          summary: item.content.summary,
          themes: item.content.themes,
          attentionPoints: item.content.attention_points,
          leaderNotes: item.content.private_leader_notes,
        })),
        openAgreements: openAgreements.map((item) => ({
          description: item.description,
          owner: item.owner,
          dueDate: item.due_date,
          isOverdue: item.is_overdue,
        })),
        gaps: gaps.map((item) => ({
          title: item.title,
          text: textById.get(item.responsibilityId) ?? '',
          lastDiscussedOn: item.lastDiscussedOn,
        })),
      });

      schedule(async () => {
        try {
          const result = await callAi(ai, system, userMessage);
          if (!result) {
            await repo.markFailed(record.id, FORMAT_FAILED_MESSAGE);
            return;
          }
          await repo.markCompleted(record.id, {
            content: {
              ...result.value,
              open_agreements: openAgreements,
              map_gaps: gaps.map((item) => ({
                responsibility_id: item.responsibilityId,
                title: item.title,
                last_discussed_on: item.lastDiscussedOn,
              })),
              has_history: hasHistory,
            },
            model: result.response.model,
            inputTokens: result.response.inputTokens,
            outputTokens: result.response.outputTokens,
          });
        } catch (error) {
          // Só o tipo do erro vai para o log: nunca conteúdo da conversa.
          logger.warn(
            { preparationId: record.id, errorName: (error as Error).name },
            'preparation failed',
          );
          const message = error instanceof AiResponseError ? error.message : AI_FAILED_MESSAGE;
          try {
            await repo.markFailed(record.id, message);
          } catch {
            logger.error({ preparationId: record.id }, 'could not mark preparation as failed');
          }
        }
      });

      return toDto(record);
    },

    async getLatest(user: CurrentUser, directReportId: string) {
      await requireReport(user, directReportId);
      const record = await repo.findLatest(user.leaderId, directReportId);
      return record ? toDto(record) : null;
    },

    // Chamado ao iniciar a API: roteiros que ficaram em processamento viram falha.
    failStuckPreparations() {
      return repo.failStuck(STUCK_MESSAGE);
    },
  };
};

export type PreparationsService = ReturnType<typeof makePreparationsService>;
