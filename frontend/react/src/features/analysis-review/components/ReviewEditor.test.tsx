import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewEditor } from './ReviewEditor';
import type { AnalysisContent } from '../types';

const content: AnalysisContent = {
  summary: 'Conversa sobre o projeto novo.',
  themes: [{ title: 'Projeto novo', detail: 'Quer participar do desenho.' }],
  agreements: [
    {
      description: 'Enviar a proposta',
      owner: 'report',
      due_date: null,
      evidence_excerpt: 'Eu te mando a proposta.',
    },
  ],
  previous_agreements: [],
  development_signals: [],
  attention_points: ['Carga alta'],
  next_questions: ['O que te motiva hoje?'],
  private_leader_notes: 'Nota',
};

const renderEditor = (
  props: Partial<Parameters<typeof ReviewEditor>[0]> = {},
  initial: AnalysisContent = content,
) => {
  const onSave = vi.fn();
  render(<ReviewEditor initial={initial} isSaving={false} onSave={onSave} {...props} />);
  return onSave;
};

const openTab = (name: RegExp | string) => userEvent.click(screen.getByRole('tab', { name }));

describe('ReviewEditor', () => {
  it('deve salvar o conteúdo com as edições feitas', async () => {
    const onSave = renderEditor();

    const summary = screen.getByLabelText('Resumo para compartilhar com a pessoa');
    await userEvent.clear(summary);
    await userEvent.type(summary, 'Resumo editado.');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      summary: 'Resumo editado.',
      agreements: [{ description: 'Enviar a proposta', due_date: null }],
    });
  });

  it('deve manter as edições ao trocar de aba', async () => {
    renderEditor();

    const summary = screen.getByLabelText('Resumo para compartilhar com a pessoa');
    await userEvent.clear(summary);
    await userEvent.type(summary, 'Texto novo');
    await openTab(/Combinados/);
    await openTab('Resumo');

    expect(screen.getByLabelText('Resumo para compartilhar com a pessoa')).toHaveValue(
      'Texto novo',
    );
  });

  it('deve impedir salvar combinado sem descrição', async () => {
    const onSave = renderEditor();

    await openTab(/Combinados/);
    await userEvent.clear(screen.getByLabelText('Combinado 1'));

    expect(screen.getByRole('alert')).toHaveTextContent('precisa de uma descrição');
    expect(screen.getByRole('button', { name: 'Salvar versão final' })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('deve permitir remover combinado e descartar perguntas vazias ao salvar', async () => {
    const onSave = renderEditor();

    await openTab(/Combinados/);
    await userEvent.click(screen.getByRole('button', { name: 'Remover combinado 1' }));
    await openTab(/Perguntas/);
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar pergunta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));

    const saved = onSave.mock.calls[0]?.[0] as AnalysisContent;
    expect(saved.agreements).toHaveLength(0);
    expect(saved.next_questions).toEqual(['O que te motiva hoje?']);
  });

  it('deve descartar as edições e voltar ao conteúdo original', async () => {
    renderEditor();
    const discard = screen.getByRole('button', { name: 'Descartar edições' });
    expect(discard).toBeDisabled();

    const summary = screen.getByLabelText('Resumo para compartilhar com a pessoa');
    await userEvent.type(summary, ' extra');
    expect(discard).toBeEnabled();
    await userEvent.click(discard);

    expect(screen.getByLabelText('Resumo para compartilhar com a pessoa')).toHaveValue(
      'Conversa sobre o projeto novo.',
    );
  });

  it('deve avisar qual trecho destacar ao focar um combinado', async () => {
    const onEvidenceChange = vi.fn();
    renderEditor({ onEvidenceChange });

    await openTab(/Combinados/);
    await userEvent.click(screen.getByLabelText('Combinado 1'));

    expect(onEvidenceChange).toHaveBeenCalledWith('n0');
  });

  it('deve aplicar a sugestão da IA ao aceitar e manter em aberto ao recusar', async () => {
    const withPrevious: AnalysisContent = {
      ...content,
      previous_agreements: [{ id: 'g1', suggested_status: 'done', evidence: 'Já publiquei.' }],
    };
    const onSave = renderEditor({ previousLabels: { g1: 'Revisar o painel' } }, withPrevious);

    await openTab(/Combinados/);
    expect(screen.getByText('Revisar o painel')).toBeInTheDocument();
    expect(screen.getByText('A IA sugere: concluído')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Manter em aberto' }));
    expect(screen.getByText('Continua em aberto')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));
    expect(
      (onSave.mock.calls[0]?.[0] as AnalysisContent).previous_agreements[0]?.suggested_status,
    ).toBe('in_progress');
  });

  it('deve mostrar o feedback do líder, permitir editar e salvar junto com a análise', async () => {
    const withFeedback: AnalysisContent = {
      ...content,
      leader_feedback: {
        overall: 'mixed',
        overall_note: 'Boa escuta, combinados vagos.',
        strengths: [{ point: 'Deu espaço para a pessoa falar.', evidence: 'Me conta mais.' }],
        opportunities: [
          { point: 'Compromisso sem prazo.', suggestion: 'Fechar prazo ao final.', evidence: '' },
        ],
      },
    };
    const onSave = renderEditor({}, withFeedback);

    await openTab('Seu feedback');
    expect(screen.getByText(/Só você vê/)).toBeInTheDocument();
    expect(screen.getAllByText('Em parte').length).toBeGreaterThan(0);
    expect(screen.getByText(/Me conta mais/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Como foi a condução'), 'went_well');
    await userEvent.click(screen.getByRole('button', { name: 'Remover ponto forte 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));

    const saved = onSave.mock.calls[0]?.[0] as AnalysisContent;
    expect(saved.leader_feedback?.overall).toBe('went_well');
    expect(saved.leader_feedback?.strengths).toHaveLength(0);
    expect(saved.leader_feedback?.opportunities).toHaveLength(1);
  });

  it('deve avisar quando a análise é antiga e não tem feedback, sem impedir o salvamento', async () => {
    const onSave = renderEditor();

    await openTab('Seu feedback');

    expect(screen.getByText(/feita antes do feedback existir/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  describe('sinais de evolução por responsabilidade', () => {
    const responsibilities = [
      { id: 'q1', title: 'Pontos de atrito', retired: false },
      { id: 'q2', title: 'Atendimento', retired: false },
      { id: 'q9', title: 'Antiga', retired: true },
    ];
    const withSignals = (...ids: Array<string | null>): AnalysisContent => ({
      ...content,
      development_signals: ids.map((id) => ({
        responsibility_id: id,
        observation: 'Fato observado.',
        kind: 'neutral',
      })),
    });

    it('deve oferecer as responsabilidades atuais e "Fora das responsabilidades" (sem as aposentadas)', async () => {
      renderEditor({ responsibilities }, withSignals('q1'));

      await openTab('Evolução');
      const select = screen.getByLabelText('Responsabilidade do sinal 1');

      expect(select).toHaveValue('q1');
      expect(
        Array.from((select as HTMLSelectElement).options).map((option) => option.textContent),
      ).toEqual(['Fora das responsabilidades', 'Pontos de atrito', 'Atendimento']);
    });

    it('deve trocar a responsabilidade de um sinal e salvar o id escolhido', async () => {
      const onSave = renderEditor({ responsibilities }, withSignals('q1', null));

      await openTab('Evolução');
      await userEvent.selectOptions(screen.getByLabelText('Responsabilidade do sinal 1'), 'q2');
      await userEvent.selectOptions(screen.getByLabelText('Responsabilidade do sinal 2'), 'q1');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));

      expect(
        onSave.mock.calls[0]?.[0].development_signals.map(
          (s: { responsibility_id: string | null }) => s.responsibility_id,
        ),
      ).toEqual(['q2', 'q1']);
    });

    it('deve permitir marcar um sinal como fora das responsabilidades (nulo)', async () => {
      const onSave = renderEditor({ responsibilities }, withSignals('q1'));

      await openTab('Evolução');
      await userEvent.selectOptions(screen.getByLabelText('Responsabilidade do sinal 1'), '');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));

      expect(onSave.mock.calls[0]?.[0].development_signals[0].responsibility_id).toBeNull();
    });

    it('deve manter a escolha de uma responsabilidade que saiu do responsograma, marcada como anterior', async () => {
      renderEditor({ responsibilities }, withSignals('q9'));

      await openTab('Evolução');
      const select = screen.getByLabelText('Responsabilidade do sinal 1');

      expect(select).toHaveValue('q9');
      expect(screen.getByRole('option', { name: 'Antiga (anterior)' })).toBeInTheDocument();
    });

    it('deve começar um sinal novo fora das responsabilidades e exigir só a observação', async () => {
      const onSave = renderEditor({ responsibilities }, withSignals());

      await openTab('Evolução');
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar sinal' }));
      expect(screen.getByLabelText('Responsabilidade do sinal 1')).toHaveValue('');
      expect(screen.getByRole('alert')).toHaveTextContent('precisa de uma observação');

      await userEvent.type(screen.getByLabelText('Observação 1'), 'Algo observado.');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar versão final' }));

      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });
});
