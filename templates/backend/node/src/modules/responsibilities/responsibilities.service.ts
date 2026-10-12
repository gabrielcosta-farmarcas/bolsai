import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { canViewDirectReport, canViewResponsibility } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';

export type TitleSource = 'fallback' | 'ai' | 'leader';

export type ResponsibilityRecord = {
  id: string;
  leaderId: string;
  directReportId: string;
  position: number;
  title: string;
  titleSource: TitleSource;
  text: string;
  retired: boolean;
  createdAt: Date;
};

export type ResponsibilitiesRepository = {
  listByReport: (
    leaderId: string,
    directReportId: string,
    options: { includeRetired: boolean },
  ) => Promise<ResponsibilityRecord[]>;
  findById: (leaderId: string, id: string) => Promise<ResponsibilityRecord | null>;
  // Todas (ativas e aposentadas), para quem precisa conferir ou numerar (análise, linha do tempo).
  listAll: (leaderId: string, directReportId: string) => Promise<ResponsibilityRecord[]>;
  updateTitle: (leaderId: string, id: string, title: string) => Promise<ResponsibilityRecord>;
  setAiTitles: (leaderId: string, updates: Array<{ id: string; title: string }>) => Promise<void>;
};

type ReportsLookup = {
  findById: (leaderId: string, id: string) => Promise<{ id: string; leaderId: string } | null>;
};

export type ResponsibilityDto = {
  id: string;
  position: number;
  title: string;
  titleSource: TitleSource;
  text: string;
  retired: boolean;
};

export const toResponsibilityDto = (record: ResponsibilityRecord): ResponsibilityDto => ({
  id: record.id,
  position: record.position,
  title: record.title,
  titleSource: record.titleSource,
  text: record.text,
  retired: record.retired,
});

export const makeResponsibilitiesService = ({
  repo,
  reports,
}: {
  repo: ResponsibilitiesRepository;
  reports: ReportsLookup;
}) => ({
  async list(user: CurrentUser, directReportId: string, options: { includeRetired: boolean }) {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
    return (await repo.listByReport(user.leaderId, directReportId, options)).map(
      toResponsibilityDto,
    );
  },

  async updateTitle(user: CurrentUser, id: string, title: string) {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewResponsibility(user, record)) {
      throw new NotFoundError('Responsabilidade não encontrada', 'RESPONSIBILITY_NOT_FOUND');
    }
    return toResponsibilityDto(await repo.updateTitle(user.leaderId, id, title));
  },
});

export type ResponsibilitiesService = ReturnType<typeof makeResponsibilitiesService>;
