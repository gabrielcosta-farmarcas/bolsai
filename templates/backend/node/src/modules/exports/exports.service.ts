import { AppError } from '../../shared/errors/app-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { canViewSession } from '../../shared/security/authorization.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import { buildSummaryMarkdown } from './summary-markdown.js';

export type ExportableSession = {
  id: string;
  leaderId: string;
  heldOn: Date;
  reportName: string;
  // Texto revisado da versão final; nulo enquanto a líder não salvou a versão final.
  reviewedJson: unknown;
};

export type ExportsRepository = {
  findExportable: (leaderId: string, sessionId: string) => Promise<ExportableSession | null>;
  markExported: (leaderId: string, sessionId: string, at: Date) => Promise<void>;
};

type Deps = { repo: ExportsRepository; now?: () => Date };

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const makeExportsService = ({ repo, now = () => new Date() }: Deps) => ({
  async summary(user: CurrentUser, sessionId: string) {
    const session = await repo.findExportable(user.leaderId, sessionId);
    if (!session || !canViewSession(user, session)) {
      throw new NotFoundError('Encontro não encontrado', 'SESSION_NOT_FOUND');
    }
    if (session.reviewedJson === null || session.reviewedJson === undefined) {
      throw new AppError(
        'Salve a versão final da análise antes de copiar o resumo.',
        409,
        'SESSION_NOT_REVIEWED',
      );
    }

    const heldOn = session.heldOn.toISOString().slice(0, 10);
    const markdown = buildSummaryMarkdown({
      reportName: session.reportName,
      heldOn,
      reviewedJson: session.reviewedJson,
    });
    const exportedAt = now();
    await repo.markExported(user.leaderId, sessionId, exportedAt);

    return {
      markdown,
      fileName: `resumo-1on1-${slug(session.reportName)}-${heldOn}.md`,
      exportedAt: exportedAt.toISOString(),
    };
  },
});

export type ExportsService = ReturnType<typeof makeExportsService>;
