import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { normalizePage, toPage } from '../../shared/pagination.js';
import { composeMapText, composeResponsibilities } from '../responsibility-maps/map-text.js';
import { checkResponsibilities } from '../responsibilities/responsibilities.schemas.js';
import type { CheckedResponsibility } from '../responsibilities/responsibilities.schemas.js';
import type { TitleSuggester } from '../responsibilities/titles.js';
import { canViewDirectReport } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import type {
  CreateDirectReportInput,
  DirectReportStatus,
  UpdateDirectReportInput,
} from './direct-reports.schemas.js';

const NOT_FOUND = 'Pessoa não encontrada';
const NOT_FOUND_CODE = 'DIRECT_REPORT_NOT_FOUND';

export type DirectReportRecord = {
  id: string;
  leaderId: string;
  name: string;
  role: string;
  startedAt: Date;
  status: DirectReportStatus;
  createdAt: Date;
  updatedAt: Date;
  // Resumo para a lista: data do último encontro e quantos combinados estão em aberto.
  lastSessionOn: Date | null;
  openAgreements: number;
};

export type NewDirectReport = {
  name: string;
  role: string;
  startedAt: string;
  status: DirectReportStatus;
  // Versão 1 do responsograma e as responsabilidades, criadas junto com a pessoa (sempre de 3 a 10).
  initialMap: {
    mission: string | null;
    responsibilities: string;
    text: string;
    items: CheckedResponsibility[];
  };
};

export type DirectReportsRepository = {
  list: (
    leaderId: string,
    filter: { status: DirectReportStatus | undefined },
    page: { skip: number; take: number },
  ) => Promise<{ data: DirectReportRecord[]; total: number }>;
  // Só devolve liderado do líder e não excluído.
  findById: (leaderId: string, id: string) => Promise<DirectReportRecord | null>;
  create: (leaderId: string, input: NewDirectReport) => Promise<DirectReportRecord>;
  update: (
    leaderId: string,
    id: string,
    input: UpdateDirectReportInput,
  ) => Promise<DirectReportRecord>;
  softDelete: (leaderId: string, id: string) => Promise<void>;
};

export type DirectReportDto = {
  id: string;
  name: string;
  role: string;
  startedAt: string;
  status: DirectReportStatus;
  createdAt: string;
  updatedAt: string;
  lastSessionOn: string | null;
  openAgreements: number;
};

const toDto = (record: DirectReportRecord): DirectReportDto => ({
  id: record.id,
  name: record.name,
  role: record.role,
  startedAt: record.startedAt.toISOString().slice(0, 10),
  status: record.status,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  lastSessionOn: record.lastSessionOn?.toISOString().slice(0, 10) ?? null,
  openAgreements: record.openAgreements,
});

export const makeDirectReportsService = (
  repo: DirectReportsRepository,
  titles?: Pick<TitleSuggester, 'suggestForReport'>,
) => {
  const findVisible = async (user: CurrentUser, id: string) => {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewDirectReport(user, record)) {
      throw new NotFoundError(NOT_FOUND, NOT_FOUND_CODE);
    }
    return record;
  };

  return {
    async list(
      user: CurrentUser,
      query: { page?: number; pageSize?: number; status?: DirectReportStatus },
    ) {
      const { page, pageSize, skip, take } = normalizePage(query.page, query.pageSize);
      const { data, total } = await repo.list(
        user.leaderId,
        { status: query.status },
        { skip, take },
      );
      return toPage(data.map(toDto), total, page, pageSize);
    },

    async getById(user: CurrentUser, id: string) {
      return toDto(await findVisible(user, id));
    },

    async create(user: CurrentUser, input: CreateDirectReportInput) {
      const { mission, responsibilities, ...person } = input;
      const { items } = checkResponsibilities(responsibilities);
      const responsibilitiesText = composeResponsibilities(items);
      const record = await repo.create(user.leaderId, {
        ...person,
        status: person.status ?? 'active',
        initialMap: {
          mission: mission?.trim() || null,
          responsibilities: responsibilitiesText,
          text: composeMapText({ mission, responsibilities: responsibilitiesText }),
          items,
        },
      });
      titles?.suggestForReport(user.leaderId, record.id);
      return toDto(record);
    },

    async update(user: CurrentUser, id: string, input: UpdateDirectReportInput) {
      await findVisible(user, id);
      return toDto(await repo.update(user.leaderId, id, input));
    },

    // Exclusão lógica: some de toda leitura, pois tudo do liderado é lido passando por ele.
    async remove(user: CurrentUser, id: string) {
      await findVisible(user, id);
      await repo.softDelete(user.leaderId, id);
    },
  };
};

export type DirectReportsService = ReturnType<typeof makeDirectReportsService>;
