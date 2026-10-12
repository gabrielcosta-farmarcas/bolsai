import { describe, expect, it, vi } from 'vitest';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeExportsService,
  type ExportableSession,
  type ExportsRepository,
} from './exports.service.js';
import { buildSummaryMarkdown } from './summary-markdown.js';

const user = { leaderId: FIXED_LEADER_ID };

const reviewedJson = {
  summary: 'Marina trouxe o plano do trimestre.',
  themes: [
    { title: 'Prioridades', detail: 'Foco em dois projetos.' },
    { title: 'Carreira', detail: '' },
  ],
  agreements: [
    {
      id: '0198a000-0000-7000-8000-000000000001',
      description: 'Enviar o plano revisado',
      owner: 'report',
      due_date: '2026-10-20',
      evidence_excerpt: 'TRECHO-DA-CONVERSA',
    },
    {
      description: 'Agendar conversa com o time de dados',
      owner: 'leader',
      due_date: null,
      evidence_excerpt: '',
    },
  ],
  previous_agreements: [{ id: 'x', suggested_status: 'done', evidence: 'EVIDENCIA-ANTIGA' }],
  development_signals: [
    { responsibility_id: null, observation: 'SINAL-DE-EVOLUCAO', kind: 'growth' },
  ],
  attention_points: ['PONTO-DE-ATENCAO'],
  next_questions: ['PERGUNTA-PROXIMA'],
  private_leader_notes: 'NOTA-PRIVADA-DA-LIDER',
  leader_feedback: { ...sampleLeaderFeedback, overall_note: 'FEEDBACK-PRIVADO' },
};

const session = (overrides: Partial<ExportableSession> = {}): ExportableSession => ({
  id: 's1',
  leaderId: FIXED_LEADER_ID,
  heldOn: new Date('2026-10-01T00:00:00.000Z'),
  reportName: 'Marina Álvares',
  reviewedJson,
  ...overrides,
});

const setup = (found: ExportableSession | null) => {
  const repo: ExportsRepository = {
    findExportable: vi.fn().mockResolvedValue(found),
    markExported: vi.fn().mockResolvedValue(undefined),
  };
  const now = new Date('2026-10-12T12:00:00.000Z');
  return { repo, service: makeExportsService({ repo, now: () => now }), now };
};

describe('buildSummaryMarkdown', () => {
  const markdown = buildSummaryMarkdown({
    reportName: 'Marina Álvares',
    heldOn: '2026-10-01',
    reviewedJson,
  });

  it('traz resumo, temas e combinados', () => {
    expect(markdown).toContain('# Resumo do 1:1 com Marina Álvares — 01/10/2026');
    expect(markdown).toContain('Marina trouxe o plano do trimestre.');
    expect(markdown).toContain('- **Prioridades**: Foco em dois projetos.');
    expect(markdown).toContain('- **Carreira**\n');
    expect(markdown).toContain('- Enviar o plano revisado (Liderado, prazo 20/10/2026)');
    expect(markdown).toContain('- Agendar conversa com o time de dados (Líder, sem prazo)');
  });

  it('nunca inclui notas privadas, feedback, sinais, perguntas nem trechos da conversa', () => {
    for (const secret of [
      'NOTA-PRIVADA-DA-LIDER',
      'FEEDBACK-PRIVADO',
      'SINAL-DE-EVOLUCAO',
      'PONTO-DE-ATENCAO',
      'PERGUNTA-PROXIMA',
      'TRECHO-DA-CONVERSA',
      'EVIDENCIA-ANTIGA',
    ]) {
      expect(markdown).not.toContain(secret);
    }
  });

  it('avisa quando não houve combinados', () => {
    const empty = buildSummaryMarkdown({
      reportName: 'Marina',
      heldOn: '2026-10-01',
      reviewedJson: { ...reviewedJson, agreements: [] },
    });
    expect(empty).toContain('Nenhum combinado neste encontro.');
  });
});

describe('exports service', () => {
  it('gera o resumo e registra a data da exportação', async () => {
    const { service, repo, now } = setup(session());

    const result = await service.summary(user, 's1');

    expect(result.fileName).toBe('resumo-1on1-marina-alvares-2026-10-01.md');
    expect(result.exportedAt).toBe(now.toISOString());
    expect(repo.markExported).toHaveBeenCalledWith(FIXED_LEADER_ID, 's1', now);
  });

  it('não oferece encontro sem versão final e não registra exportação', async () => {
    const { service, repo } = setup(session({ reviewedJson: null }));

    await expect(service.summary(user, 's1')).rejects.toMatchObject({
      code: 'SESSION_NOT_REVIEWED',
    });
    expect(repo.markExported).not.toHaveBeenCalled();
  });

  it('responde não encontrado para encontro inexistente ou de outra líder', async () => {
    await expect(setup(null).service.summary(user, 's1')).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
    const other = setup(session({ leaderId: '00000000-0000-7000-8000-0000000000ff' }));
    await expect(other.service.summary(user, 's1')).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
  });
});
