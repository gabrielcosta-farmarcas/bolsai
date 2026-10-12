import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { isOverdue, toCalendarDate, todayInSaoPaulo } from '../../shared/dates.js';
import { canViewDirectReport } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import { reviewedAnalysisSchema } from '../analyses/analysis.schema.js';
import type { AgreementOwner, AgreementStatus } from '../agreements/agreements.schemas.js';

export type SignalKind = 'growth' | 'attention' | 'neutral';

export type TimelineSessionData = {
  id: string;
  heldOn: Date;
  status: 'draft' | 'analysed' | 'reviewed';
  // Análise a usar: a versão final (revisada) ou, na falta dela, a última concluída.
  analysis: { rawJson: unknown; reviewedJson: unknown; isFinal: boolean } | null;
};

export type TimelineAgreementData = {
  id: string;
  originSessionId: string | null;
  description: string;
  owner: AgreementOwner;
  dueDate: Date | null;
  status: AgreementStatus;
};

export type TimelineRepository = {
  // Só devolve dados de liderado do líder e não excluído; sessões em ordem cronológica.
  loadSessions: (leaderId: string, directReportId: string) => Promise<TimelineSessionData[]>;
  loadAgreements: (leaderId: string, directReportId: string) => Promise<TimelineAgreementData[]>;
  // Título de cada responsabilidade da pessoa (ativas e aposentadas), pelo id.
  loadResponsibilityTitles: (
    leaderId: string,
    directReportId: string,
  ) => Promise<Map<string, ResponsibilityLabel>>;
};

// Título curto e frase completa de uma responsabilidade (a tela mostra a frase ao passar o mouse).
export type ResponsibilityLabel = { title: string; text: string };

export type TimelineEntry = {
  sessionId: string;
  heldOn: string;
  isReviewed: boolean;
  summary: string | null;
  themes: Array<{ title: string; detail: string }>;
  signals: Array<{
    // Id da responsabilidade (nulo = fora das responsabilidades).
    responsibilityId: string | null;
    responsibility: string;
    observation: string;
    kind: SignalKind;
  }>;
  agreements: Array<{
    id: string;
    description: string;
    owner: AgreementOwner;
    dueDate: string | null;
    status: AgreementStatus;
    isOverdue: boolean;
  }>;
};

export type Timeline = {
  entries: TimelineEntry[];
  // Evolução por responsabilidade do responsograma, encontro a encontro.
  responsibilities: Array<{
    id: string | null;
    responsibility: string;
    // Frase completa da responsabilidade; nula para "fora das responsabilidades" ou removida.
    text: string | null;
    points: Array<{ sessionId: string; heldOn: string; kind: SignalKind }>;
  }>;
  totals: { agreements: number; done: number; open: number; cancelled: number; overdue: number };
};

export const OUT_OF_SCOPE_LABEL = 'Fora das responsabilidades';
const REMOVED_LABEL = 'Responsabilidade removida';

export const buildTimeline = (
  sessions: TimelineSessionData[],
  agreements: TimelineAgreementData[],
  today: string,
  titles: ReadonlyMap<string, ResponsibilityLabel> = new Map(),
): Timeline => {
  const agreementDtos = agreements.map((item) => {
    const dueDate = toCalendarDate(item.dueDate);
    return {
      id: item.id,
      originSessionId: item.originSessionId,
      description: item.description,
      owner: item.owner,
      dueDate,
      status: item.status,
      isOverdue: isOverdue(dueDate, item.status, today),
    };
  });

  const entries: TimelineEntry[] = [...sessions]
    .sort((a, b) => a.heldOn.getTime() - b.heldOn.getTime())
    .map((session) => {
      const raw = session.analysis
        ? (session.analysis.reviewedJson ?? session.analysis.rawJson)
        : null;
      const parsed = raw ? reviewedAnalysisSchema.safeParse(raw) : null;
      const content = parsed?.success ? parsed.data : null;
      return {
        sessionId: session.id,
        heldOn: toCalendarDate(session.heldOn) ?? '',
        isReviewed: session.status === 'reviewed',
        summary: content?.summary ?? null,
        themes: content?.themes ?? [],
        signals: (content?.development_signals ?? []).map((signal) => ({
          responsibilityId: signal.responsibility_id,
          responsibility:
            signal.responsibility_id === null
              ? OUT_OF_SCOPE_LABEL
              : (titles.get(signal.responsibility_id)?.title ?? REMOVED_LABEL),
          observation: signal.observation,
          kind: signal.kind,
        })),
        agreements: agreementDtos
          .filter((item) => item.originSessionId === session.id)
          .map(({ originSessionId: _origin, ...rest }) => rest),
      };
    });

  const groups = new Map<string, Timeline['responsibilities'][number]>();
  for (const entry of entries) {
    for (const signal of entry.signals) {
      // Agrupa pelo id: duas responsabilidades com o mesmo título continuam separadas.
      const key = signal.responsibilityId ?? 'fora';
      const group = groups.get(key) ?? {
        id: signal.responsibilityId,
        responsibility: signal.responsibility.trim(),
        text: signal.responsibilityId ? (titles.get(signal.responsibilityId)?.text ?? null) : null,
        points: [],
      };
      group.points.push({ sessionId: entry.sessionId, heldOn: entry.heldOn, kind: signal.kind });
      groups.set(key, group);
    }
  }

  return {
    entries,
    responsibilities: [...groups.values()],
    totals: {
      agreements: agreementDtos.length,
      done: agreementDtos.filter((item) => item.status === 'done').length,
      open: agreementDtos.filter((item) => item.status === 'open').length,
      cancelled: agreementDtos.filter((item) => item.status === 'cancelled').length,
      overdue: agreementDtos.filter((item) => item.isOverdue).length,
    },
  };
};

type Deps = {
  repo: TimelineRepository;
  reports: {
    findById: (leaderId: string, id: string) => Promise<{ id: string; leaderId: string } | null>;
  };
  now?: () => Date;
};

export const makeTimelineService = ({ repo, reports, now = () => new Date() }: Deps) => ({
  async get(user: CurrentUser, directReportId: string): Promise<Timeline> {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
    const [sessions, agreements, titles] = await Promise.all([
      repo.loadSessions(user.leaderId, directReportId),
      repo.loadAgreements(user.leaderId, directReportId),
      repo.loadResponsibilityTitles(user.leaderId, directReportId),
    ]);
    return buildTimeline(sessions, agreements, todayInSaoPaulo(now()), titles);
  },
});

export type TimelineService = ReturnType<typeof makeTimelineService>;
