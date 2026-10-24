import type { ZodError } from 'zod';
import { AiResponseError, type AiClient } from '../../shared/ai/ai-client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { logger } from '../../shared/logger.js';
import { canViewAnalysis, canViewSession } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import { buildAnalysisInput, type OpenAgreementContext } from './analysis-input.js';
import {
  MAX_RESPONSIBILITIES,
  MIN_RESPONSIBILITIES,
} from '../responsibilities/responsibilities.schemas.js';
import {
  MAX_SIGNALS,
  OUT_OF_SCOPE_REF,
  analysisOutputSchema,
  reviewedAnalysisSchema,
  type AnalysisOutput,
  type ReviewedAnalysis,
  type StoredAnalysis,
} from './analysis.schema.js';

const HISTORY_LIMIT = 3;
const STUCK_MESSAGE = 'A análise foi interrompida porque a API foi reiniciada. Analise de novo.';
const FORMAT_FAILED_MESSAGE =
  'A IA não devolveu a análise no formato esperado, mesmo após uma nova tentativa. Analise de novo.';
const AI_FAILED_MESSAGE = 'Não foi possível obter a resposta da IA. Tente de novo em instantes.';

export type AnalysisStatus = 'processing' | 'completed' | 'failed';

export type AnalysisRecord = {
  id: string;
  leaderId: string;
  sessionId: string;
  model: string | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  mapVersionUsed: number | null;
  rawJson: unknown;
  reviewedJson: unknown;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type AnalysesRepository = {
  create: (
    leaderId: string,
    sessionId: string,
    data: { mapVersionUsed: number | null },
  ) => Promise<AnalysisRecord>;
  // Conclui a análise e, se a sessão ainda é rascunho, passa a "analisada".
  markCompleted: (
    id: string,
    data: { rawJson: StoredAnalysis; model: string; inputTokens: number; outputTokens: number },
  ) => Promise<void>;
  markFailed: (id: string, message: string) => Promise<void>;
  // Só devolve análise de sessão cujo liderado é do líder e não foi excluído.
  findById: (leaderId: string, id: string) => Promise<AnalysisRecord | null>;
  listBySession: (leaderId: string, sessionId: string) => Promise<AnalysisRecord[]>;
  // Troca a versão final da sessão (no máximo uma) e marca a sessão como revisada.
  saveFinal: (
    leaderId: string,
    sessionId: string,
    analysisId: string,
    reviewedJson: ReviewedAnalysis,
    reviewedAt: Date,
  ) => Promise<AnalysisRecord>;
  failStuck: (message: string) => Promise<number>;
  lastReviewedSummaries: (
    leaderId: string,
    directReportId: string,
    filter: { onOrBefore: Date; excludeSessionId: string; limit: number },
  ) => Promise<Array<{ heldOn: Date; summary: string }>>;
};

type SessionsLookup = {
  findById: (
    leaderId: string,
    id: string,
  ) => Promise<{
    id: string;
    leaderId: string;
    directReportId: string;
    heldOn: Date;
    transcript: string;
  } | null>;
};

type Deps = {
  repo: AnalysesRepository;
  sessions: SessionsLookup;
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
  // Todas as responsabilidades da pessoa (ativas e aposentadas), com a posição no responsograma.
  responsibilities: {
    listAll: (
      leaderId: string,
      directReportId: string,
    ) => Promise<Array<{ id: string; position: number; text: string; retired: boolean }>>;
  };
  agreements: {
    listOpen: (
      leaderId: string,
      directReportId: string,
      filter: { onOrBefore: Date; excludeSessionId: string },
    ) => Promise<OpenAgreementContext[]>;
  };
  // Lança AiNotConfiguredError quando falta chave ou modelo (da líder ou da instalação).
  getAiClient: (leaderId: string) => AiClient | Promise<AiClient>;
  // Prompt da líder, ou o padrão.
  prompts: { load: (leaderId: string) => Promise<string> };
  config: { maxTranscriptChars: number };
  // Como rodar a análise em segundo plano (testes executam na hora).
  schedule?: (job: () => Promise<void>) => void;
};

export type AnalysisDto = {
  id: string;
  sessionId: string;
  model: string | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  mapVersionUsed: number | null;
  isFinal: boolean;
  reviewedAt: string | null;
  createdAt: string;
};

const toDto = (record: AnalysisRecord): AnalysisDto => ({
  id: record.id,
  sessionId: record.sessionId,
  model: record.model,
  status: record.status,
  errorMessage: record.errorMessage,
  mapVersionUsed: record.mapVersionUsed,
  isFinal: record.reviewedAt !== null,
  reviewedAt: record.reviewedAt?.toISOString() ?? null,
  createdAt: record.createdAt.toISOString(),
});

const describeZodError = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'raiz'}: ${issue.message}`).join('; ');

// Converte o texto da IA em análise válida ou devolve o motivo (sem conteúdo da conversa).
const validateOutput = (
  text: string,
  openAgreementIds: Set<string>,
  validRefs: Set<string>,
): { ok: true; value: AnalysisOutput } | { ok: false; reason: string } => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'o texto não era um JSON válido' };
  }

  const parsed = analysisOutputSchema.safeParse(json);
  if (!parsed.success) return { ok: false, reason: describeZodError(parsed.error) };

  const unknownIds = parsed.data.previous_agreements
    .map((item) => item.id)
    .filter((id) => !openAgreementIds.has(id));
  if (unknownIds.length > 0) {
    return {
      ok: false,
      reason: `previous_agreements usa ids que não estão nos combinados em aberto: ${unknownIds.join(', ')}`,
    };
  }

  const signals = parsed.data.development_signals;
  if (signals.length > MAX_SIGNALS) {
    return { ok: false, reason: `development_signals tem mais de ${MAX_SIGNALS} itens` };
  }
  const badRefs = signals
    .map((item) => item.responsibility_ref.trim().toUpperCase())
    .filter((ref) => ref !== OUT_OF_SCOPE_REF && !validRefs.has(ref));
  if (badRefs.length > 0) {
    return {
      ok: false,
      reason: `development_signals usa referências que não estão na lista de responsabilidades: ${badRefs.join(', ')}. Use só ${[...validRefs].join(', ')} ou ${OUT_OF_SCOPE_REF}`,
    };
  }
  return { ok: true, value: parsed.data };
};

// Troca R1, R2… pelo id da responsabilidade (FORA vira nulo) para guardar.
const toStored = (value: AnalysisOutput, refToId: Map<string, string>): StoredAnalysis => ({
  ...value,
  development_signals: value.development_signals.map((item) => ({
    responsibility_id: refToId.get(item.responsibility_ref.trim().toUpperCase()) ?? null,
    observation: item.observation,
    kind: item.kind,
  })),
});

export const makeAnalysesService = (deps: Deps) => {
  const { repo, sessions, maps, responsibilities, agreements, prompts, config } = deps;
  const schedule =
    deps.schedule ??
    ((job: () => Promise<void>) => {
      void job();
    });

  const requireSession = async (user: CurrentUser, sessionId: string) => {
    const session = await sessions.findById(user.leaderId, sessionId);
    if (!session || !canViewSession(user, session)) {
      throw new NotFoundError('Encontro não encontrado', 'SESSION_NOT_FOUND');
    }
    return session;
  };

  const requireAnalysis = async (user: CurrentUser, id: string) => {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewAnalysis(user, record)) {
      throw new NotFoundError('Análise não encontrada', 'ANALYSIS_NOT_FOUND');
    }
    return record;
  };

  // Uma chamada à IA, com uma nova tentativa se a saída vier inválida. Devolve o motivo da falha.
  const callAi = async (
    ai: AiClient,
    system: string,
    userMessage: string,
    openAgreementIds: Set<string>,
    refToId: Map<string, string>,
  ) => {
    let message = userMessage;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await ai.generateStructured({
        system,
        user: message,
        outputSchema: analysisOutputSchema,
      });
      const checked = validateOutput(response.text, openAgreementIds, new Set(refToId.keys()));
      if (checked.ok) return { value: toStored(checked.value, refToId), response };
      message = `${userMessage}\n\nA resposta anterior foi inválida (${checked.reason}). Gere novamente a análise completa corrigindo isso.`;
    }
    return null;
  };

  return {
    async start(user: CurrentUser, sessionId: string) {
      const session = await requireSession(user, sessionId);
      const ai = await deps.getAiClient(user.leaderId);

      if (session.transcript.length > config.maxTranscriptChars) {
        throw new AppError(
          `A transcrição passa do limite de ${config.maxTranscriptChars} caracteres.`,
          422,
          'TRANSCRIPT_TOO_LONG',
        );
      }

      const system = await prompts.load(user.leaderId);
      const [map, allResponsibilities, history, openAgreements] = await Promise.all([
        maps.findCurrent(user.leaderId, session.directReportId),
        responsibilities.listAll(user.leaderId, session.directReportId),
        repo.lastReviewedSummaries(user.leaderId, session.directReportId, {
          onOrBefore: session.heldOn,
          excludeSessionId: session.id,
          limit: HISTORY_LIMIT,
        }),
        agreements.listOpen(user.leaderId, session.directReportId, {
          onOrBefore: session.heldOn,
          excludeSessionId: session.id,
        }),
      ]);

      // A IA recebe SEMPRE todas as responsabilidades preenchidas (3 a 10), numeradas na ordem do responsograma.
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
      const numbered = active.map((item, index) => ({
        ref: `R${index + 1}`,
        id: item.id,
        text: item.text,
      }));
      const refToId = new Map(numbered.map((item) => [item.ref, item.id]));

      const analysis = await repo.create(user.leaderId, session.id, {
        mapVersionUsed: map.version,
      });

      const userMessage = buildAnalysisInput({
        heldOn: session.heldOn.toISOString().slice(0, 10),
        transcript: session.transcript,
        map: {
          version: map.version,
          mission: map.mission,
          behaviors: map.behaviors,
          responsibilities: numbered.map(({ ref, text }) => ({ ref, text })),
        },
        history: history.map((item) => ({
          heldOn: item.heldOn.toISOString().slice(0, 10),
          summary: item.summary,
        })),
        openAgreements,
      });
      const openAgreementIds = new Set(openAgreements.map((item) => item.id));

      schedule(async () => {
        try {
          const result = await callAi(ai, system, userMessage, openAgreementIds, refToId);
          if (!result) {
            await repo.markFailed(analysis.id, FORMAT_FAILED_MESSAGE);
            return;
          }
          await repo.markCompleted(analysis.id, {
            rawJson: result.value,
            model: result.response.model,
            inputTokens: result.response.inputTokens,
            outputTokens: result.response.outputTokens,
          });
        } catch (error) {
          // Só o tipo do erro vai para o log: nunca conteúdo da conversa.
          logger.warn(
            { analysisId: analysis.id, errorName: (error as Error).name },
            'analysis failed',
          );
          const message = error instanceof AiResponseError ? error.message : AI_FAILED_MESSAGE;
          try {
            await repo.markFailed(analysis.id, message);
          } catch {
            logger.error({ analysisId: analysis.id }, 'could not mark analysis as failed');
          }
        }
      });

      return toDto(analysis);
    },

    async listBySession(user: CurrentUser, sessionId: string) {
      await requireSession(user, sessionId);
      return (await repo.listBySession(user.leaderId, sessionId)).map(toDto);
    },

    async getById(user: CurrentUser, id: string) {
      const record = await requireAnalysis(user, id);
      return { ...toDto(record), rawJson: record.rawJson, reviewedJson: record.reviewedJson };
    },

    async saveReview(
      user: CurrentUser,
      sessionId: string,
      input: { analysisId: string; reviewedJson: unknown },
    ) {
      const session = await requireSession(user, sessionId);
      const analysis = await requireAnalysis(user, input.analysisId);
      if (analysis.sessionId !== sessionId) {
        throw new NotFoundError('Análise não encontrada', 'ANALYSIS_NOT_FOUND');
      }
      if (analysis.status !== 'completed') {
        throw new ConflictError('Essa análise ainda não terminou.', 'ANALYSIS_NOT_READY');
      }

      const parsed = reviewedAnalysisSchema.safeParse(input.reviewedJson);
      if (!parsed.success) {
        throw new ValidationError(
          'A revisão não está no formato esperado.',
          parsed.error.issues.map((issue) => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        );
      }

      // Cada observação só pode apontar para uma responsabilidade DESTA pessoa (ou para nenhuma).
      const own = new Set(
        (await responsibilities.listAll(user.leaderId, session.directReportId)).map(
          (item) => item.id,
        ),
      );
      const foreign = parsed.data.development_signals.some(
        (item) => item.responsibility_id !== null && !own.has(item.responsibility_id),
      );
      if (foreign) {
        throw new AppError(
          'Uma observação aponta para uma responsabilidade que não é desta pessoa.',
          422,
          'INVALID_RESPONSIBILITY_REFERENCE',
        );
      }

      return toDto(
        await repo.saveFinal(user.leaderId, sessionId, analysis.id, parsed.data, new Date()),
      );
    },

    // Chamado ao iniciar a API: análises que ficaram em processamento viram falha.
    failStuckAnalyses() {
      return repo.failStuck(STUCK_MESSAGE);
    },
  };
};

export type AnalysesService = ReturnType<typeof makeAnalysesService>;
