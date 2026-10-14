import { NotFoundError } from '../../shared/errors/not-found-error.js';
import type { ExtractedText } from '../../shared/files/extract-text.js';
import {
  canViewDirectReport,
  canViewResponsibilityMap,
} from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import type { DirectReportRecord } from '../direct-reports/direct-reports.service.js';
import { checkResponsibilities } from '../responsibilities/responsibilities.schemas.js';
import type { CheckedResponsibility } from '../responsibilities/responsibilities.schemas.js';
import { splitProposal } from '../responsibilities/split-proposal.js';
import type { TitleSuggester } from '../responsibilities/titles.js';
import { composeMapText, composeResponsibilities } from './map-text.js';

export type MapRecord = {
  id: string;
  leaderId: string;
  directReportId: string;
  version: number;
  text: string;
  mission: string | null;
  behaviors: string | null;
  responsibilities: string | null;
  createdAt: Date;
};

export type NewMapVersion = {
  text: string;
  mission: string | null;
  behaviors: string | null;
  // Lista numerada das responsabilidades, para mostrar o conteúdo de cada versão.
  responsibilities: string;
  items: CheckedResponsibility[];
};

export type ResponsibilityMapsRepository = {
  // Cria a próxima versão E reconcilia as responsabilidades na mesma transação.
  createNextVersion: (
    leaderId: string,
    directReportId: string,
    data: NewMapVersion,
  ) => Promise<MapRecord>;
  listByReport: (leaderId: string, directReportId: string) => Promise<MapRecord[]>;
  // Só devolve versão cujo liderado é do líder e não foi excluído.
  findById: (leaderId: string, id: string) => Promise<MapRecord | null>;
  // Versão vigente (a de maior número) do liderado, ou null se não houver.
  findCurrent: (
    leaderId: string,
    directReportId: string,
  ) => Promise<{
    version: number;
    text: string;
    mission: string | null;
    behaviors: string | null;
  } | null>;
};

type ReportsLookup = {
  findById: (
    leaderId: string,
    id: string,
  ) => Promise<Pick<DirectReportRecord, 'id' | 'leaderId'> | null>;
};

export type MapInput = { mission?: string; behaviors?: string; responsibilities: string[] };

export type MapDto = {
  id: string;
  version: number;
  isCurrent: boolean;
  mission: string | null;
  behaviors: string | null;
  responsibilities: string | null;
  createdAt: string;
};

type Deps = {
  repo: ResponsibilityMapsRepository;
  reports: ReportsLookup;
  extract: (buffer: Buffer, fileName: string) => Promise<ExtractedText>;
  titles?: Pick<TitleSuggester, 'suggestForReport'>;
};

const toDto = (record: MapRecord, isCurrent: boolean): MapDto => ({
  id: record.id,
  version: record.version,
  isCurrent,
  mission: record.mission,
  behaviors: record.behaviors,
  responsibilities: record.responsibilities,
  createdAt: record.createdAt.toISOString(),
});

export const makeResponsibilityMapsService = ({ repo, reports, extract, titles }: Deps) => {
  const requireReport = async (user: CurrentUser, directReportId: string) => {
    const report = await reports.findById(user.leaderId, directReportId);
    if (!report || !canViewDirectReport(user, report)) {
      throw new NotFoundError('Pessoa não encontrada', 'DIRECT_REPORT_NOT_FOUND');
    }
  };

  const requireMap = async (user: CurrentUser, id: string) => {
    const record = await repo.findById(user.leaderId, id);
    if (!record || !canViewResponsibilityMap(user, record)) {
      throw new NotFoundError('Responsograma não encontrado', 'MAP_NOT_FOUND');
    }
    return record;
  };

  return {
    async createVersion(user: CurrentUser, directReportId: string, input: MapInput) {
      await requireReport(user, directReportId);

      const { items, duplicates } = checkResponsibilities(input.responsibilities);
      const mission = input.mission?.trim() || null;
      const behaviors = input.behaviors?.trim() || null;
      const created = await repo.createNextVersion(user.leaderId, directReportId, {
        text: composeMapText({
          mission,
          responsibilities: composeResponsibilities(items),
          behaviors,
        }),
        mission,
        behaviors,
        responsibilities: composeResponsibilities(items),
        items,
      });
      titles?.suggestForReport(user.leaderId, directReportId);
      return { ...toDto(created, true), duplicates };
    },

    // Lê o arquivo e devolve só uma PROPOSTA para preencher os campos. Nada é salvo e o arquivo não é guardado.
    // Não toca em dado guardado de ninguém: por isso não depende de uma pessoa (serve também no cadastro).
    async extractProposal(file: { fileName: string; buffer: Buffer }) {
      const { text } = await extract(file.buffer, file.fileName);
      return splitProposal(text);
    },

    async list(user: CurrentUser, directReportId: string) {
      await requireReport(user, directReportId);
      const records = await repo.listByReport(user.leaderId, directReportId);
      const current = Math.max(0, ...records.map((record) => record.version));
      return records.map((record) => toDto(record, record.version === current));
    },

    async getById(user: CurrentUser, id: string) {
      const record = await requireMap(user, id);
      return { ...toDto(record, false), text: record.text };
    },
  };
};

export type ResponsibilityMapsService = ReturnType<typeof makeResponsibilityMapsService>;
