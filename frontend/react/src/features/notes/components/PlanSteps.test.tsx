import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Note, NoteStep } from '../types';
import { PlanSteps } from './PlanSteps';

const step = (overrides: Partial<NoteStep> = {}): NoteStep => ({
  id: 's1',
  position: 1,
  text: 'Conversar sobre o que travou',
  dueDate: null,
  owner: 'leader',
  done: false,
  doneAt: null,
  isOverdue: false,
  agreementId: null,
  ...overrides,
});

const note = (steps: NoteStep[]): Note => ({
  id: 'n1',
  directReportId: 'r1',
  kind: 'agreement_missed',
  description: 'Relatório não entregue',
  notedAt: '2026-10-26',
  status: steps.length > 0 ? 'in_progress' : 'no_plan',
  bringToNextSession: false,
  resolvedAt: null,
  createdAt: '2026-10-26T12:00:00.000Z',
  steps,
  progress: { done: steps.filter((s) => s.done).length, total: steps.length },
});

const setup = (steps: NoteStep[]) => {
  const handlers = {
    onAdd: vi.fn(),
    onChange: vi.fn(),
    onRemove: vi.fn(),
    onPromote: vi.fn(),
  };
  render(<PlanSteps note={note(steps)} isSaving={false} {...handlers} />);
  return handlers;
};

describe('PlanSteps', () => {
  it('deve convidar a montar o plano quando não há passos', () => {
    setup([]);
    expect(screen.getByText(/Ainda sem passos/)).toBeInTheDocument();
  });

  it('deve mostrar o progresso, o atraso e a etiqueta de combinado', () => {
    setup([
      step({ id: 'a', done: true, doneAt: '2026-10-27T10:00:00.000Z' }),
      step({ id: 'b', text: 'Revisar prazo', dueDate: '2026-10-01', isOverdue: true }),
      step({ id: 'c', text: 'Já combinado', agreementId: 'g1' }),
    ]);

    expect(screen.getByText('1 de 3 feitos')).toBeInTheDocument();
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
    expect(screen.getByText('Combinado')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Virar combinado' })).toHaveLength(2);
    expect(screen.getByText(/Feito em 27\/10\/2026/)).toBeInTheDocument();
  });

  it('deve marcar como feito, promover e remover', async () => {
    const handlers = setup([step()]);

    await userEvent.click(screen.getByRole('checkbox', { name: /Conversar sobre/ }));
    expect(handlers.onChange).toHaveBeenCalledWith('s1', { done: true });

    await userEvent.click(screen.getByRole('button', { name: 'Virar combinado' }));
    expect(handlers.onPromote).toHaveBeenCalledWith('s1');

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(handlers.onRemove).toHaveBeenCalledWith('s1');
  });

  it('deve adicionar um passo com prazo e responsável', async () => {
    const handlers = setup([]);
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
    await userEvent.type(screen.getByLabelText('Passo'), 'Combinar novo prazo');
    await userEvent.selectOptions(screen.getByLabelText('Responsável'), 'report');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));

    expect(handlers.onAdd).toHaveBeenCalledWith(
      { text: 'Combinar novo prazo', dueDate: null, owner: 'report' },
      expect.any(Function),
    );
  });

  it('deve avisar quando o passo está vazio', async () => {
    const handlers = setup([]);
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Descreva o passo');
    expect(handlers.onAdd).not.toHaveBeenCalled();
  });
});
