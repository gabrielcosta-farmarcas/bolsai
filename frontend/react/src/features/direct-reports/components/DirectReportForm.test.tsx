import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { emptyFields } from '@/features/responsibilities';
import { DirectReportForm } from './DirectReportForm';

const empty = { name: '', role: '', startedAt: '', status: 'active' } as const;
const withFields = {
  ...empty,
  startedAt: '2025-03-10',
  mission: '',
  responsibilities: emptyFields(),
};

describe('DirectReportForm', () => {
  it('deve mostrar os erros e não enviar quando faltam campos', async () => {
    const onSubmit = vi.fn();
    render(
      <DirectReportForm
        initialValues={empty}
        submitLabel="Salvar"
        isSubmitting={false}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getAllByText('Preencha este campo.')).toHaveLength(3);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('deve enviar os valores sem espaços sobrando (na edição, sem responsabilidades)', async () => {
    const onSubmit = vi.fn();
    render(
      <DirectReportForm
        initialValues={{ ...empty, startedAt: '2025-03-10' }}
        submitLabel="Salvar"
        isSubmitting={false}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.queryByLabelText('Responsabilidade 1')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Nome'), '  Ana Souza ');
    await userEvent.type(screen.getByLabelText('Cargo'), 'Analista');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana Souza',
      role: 'Analista',
      startedAt: '2025-03-10',
      status: 'active',
    });
  });

  describe('cadastro com responsabilidades', () => {
    const setup = (onSubmit = vi.fn()) => {
      render(
        <DirectReportForm
          initialValues={withFields}
          submitLabel="Salvar"
          isSubmitting={false}
          showResponsibilityMap
          onSubmit={onSubmit}
        />,
      );
      return onSubmit;
    };

    it('deve mostrar a missão e os 10 campos de responsabilidade', () => {
      setup();

      expect(screen.getByLabelText(/Missão \/ finalidade do cargo/)).toBeInTheDocument();
      expect(screen.getAllByLabelText(/^Responsabilidade \d+$/)).toHaveLength(10);
    });

    it('não deve enviar com menos de 3 responsabilidades e deve dizer quantas faltam', async () => {
      const onSubmit = setup();
      await userEvent.type(screen.getByLabelText('Nome'), 'Ana');
      await userEvent.type(screen.getByLabelText('Cargo'), 'Analista');
      await userEvent.type(screen.getByLabelText('Responsabilidade 1'), 'Atender os clientes');
      await userEvent.type(screen.getByLabelText('Responsabilidade 2'), 'Registrar no CRM');

      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Preencha pelo menos 3 responsabilidades. Falta 1.',
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('deve enviar só as responsabilidades preenchidas, sem espaços sobrando, e a missão', async () => {
      const onSubmit = setup();
      await userEvent.type(screen.getByLabelText('Nome'), 'Ana');
      await userEvent.type(screen.getByLabelText('Cargo'), 'Analista');
      await userEvent.type(screen.getByLabelText(/Missão/), 'Apoiar clientes');
      await userEvent.type(screen.getByLabelText('Responsabilidade 1'), '  Atender os clientes ');
      await userEvent.type(screen.getByLabelText('Responsabilidade 3'), 'Registrar no CRM');
      await userEvent.type(screen.getByLabelText('Responsabilidade 7'), 'Validar as entregas');

      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          mission: 'Apoiar clientes',
          responsibilities: ['Atender os clientes', 'Registrar no CRM', 'Validar as entregas'],
        }),
      );
    });

    it('deve enviar os comportamentos desejados aparados e recusar acima de 3.000 caracteres', async () => {
      const onSubmit = setup();
      await userEvent.type(screen.getByLabelText('Nome'), 'Ana');
      await userEvent.type(screen.getByLabelText('Cargo'), 'Analista');
      await userEvent.type(screen.getByLabelText('Responsabilidade 1'), 'Atender os clientes');
      await userEvent.type(screen.getByLabelText('Responsabilidade 2'), 'Registrar no CRM');
      await userEvent.type(screen.getByLabelText('Responsabilidade 3'), 'Validar as entregas');
      const field = screen.getByLabelText('Comportamentos desejados (opcional)');

      fireEvent.change(field, { target: { value: 'a'.repeat(3002) } });
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      expect(screen.getByText('Passou 2 caracteres do limite de 3000.')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();

      fireEvent.change(field, { target: { value: '  Empatia\nCuriosidade ' } });
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ behaviors: 'Empatia\nCuriosidade' }),
      );
    });

    it('deve preencher os campos a partir de um arquivo, para conferir antes de salvar', async () => {
      const onExtract = vi.fn().mockResolvedValue({
        mission: 'Missão do arquivo',
        responsibilities: ['Primeira do arquivo', 'Segunda do arquivo', 'Terceira do arquivo'],
        leftOut: [],
      });
      render(
        <DirectReportForm
          initialValues={withFields}
          submitLabel="Salvar"
          isSubmitting={false}
          showResponsibilityMap
          onExtract={onExtract}
          onSubmit={vi.fn()}
        />,
      );

      await userEvent.upload(
        screen.getByLabelText(/Preencher a partir de um arquivo/),
        new File(['x'], 'cargo.docx'),
      );

      expect(await screen.findByDisplayValue('Segunda do arquivo')).toBeInTheDocument();
      expect(screen.getByLabelText(/Missão/)).toHaveValue('Missão do arquivo');
      expect(screen.getByLabelText('Responsabilidade 4')).toHaveValue('');
    });
  });
});
