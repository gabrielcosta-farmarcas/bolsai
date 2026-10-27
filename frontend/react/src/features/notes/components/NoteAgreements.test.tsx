import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { NoteAgreement } from '../types';
import { NoteAgreements } from './NoteAgreements';

const agreement = (overrides: Partial<NoteAgreement> = {}): NoteAgreement => ({
  id: 'g1',
  description: 'Conversar sobre o que travou',
  owner: 'leader',
  dueDate: null,
  status: 'open',
  isOverdue: false,
  ...overrides,
});

const setup = (agreements: NoteAgreement[]) => {
  const handlers = { onAdd: vi.fn(), onToggle: vi.fn(), onCancel: vi.fn() };
  render(<NoteAgreements agreements={agreements} isSaving={false} {...handlers} />);
  return handlers;
};

describe('NoteAgreements', () => {
  it('deve convidar a criar o primeiro combinado quando não há nenhum', () => {
    setup([]);
    expect(screen.getByText(/Ainda sem combinados/)).toBeInTheDocument();
  });

  it('deve mostrar prazo, responsável e atraso', () => {
    setup([
      agreement({ id: 'a', dueDate: '2026-10-01', owner: 'report', isOverdue: true }),
      agreement({ id: 'b', description: 'Já feito', status: 'done' }),
    ]);

    expect(screen.getByText('Até 01/10/2026 · A pessoa')).toBeInTheDocument();
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Já feito/ })).toBeChecked();
  });

  it('deve marcar como feito e cancelar', async () => {
    const handlers = setup([agreement()]);

    await userEvent.click(screen.getByRole('checkbox', { name: /Conversar sobre/ }));
    expect(handlers.onToggle).toHaveBeenCalledWith('g1', true);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar combinado' }));
    expect(handlers.onCancel).toHaveBeenCalledWith('g1');
  });

  it('deve adicionar um combinado com prazo e responsável', async () => {
    const handlers = setup([]);
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar combinado' }));
    await userEvent.type(screen.getByLabelText('Combinado'), 'Combinar novo prazo');
    await userEvent.selectOptions(screen.getByLabelText('Responsável'), 'report');
    await userEvent.click(screen.getAllByRole('button', { name: 'Adicionar combinado' })[0]!);

    expect(handlers.onAdd).toHaveBeenCalledWith(
      { description: 'Combinar novo prazo', dueDate: null, owner: 'report' },
      expect.any(Function),
    );
  });

  it('deve avisar quando o combinado está vazio', async () => {
    const handlers = setup([]);
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar combinado' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Adicionar combinado' })[0]!);

    expect(screen.getByRole('alert')).toHaveTextContent('Descreva o combinado');
    expect(handlers.onAdd).not.toHaveBeenCalled();
  });
});
