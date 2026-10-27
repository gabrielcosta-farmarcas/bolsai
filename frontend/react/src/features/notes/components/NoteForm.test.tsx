import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NoteForm } from './NoteForm';

const setup = (props: Partial<Parameters<typeof NoteForm>[0]> = {}) => {
  const onSubmit = vi.fn();
  render(
    <NoteForm
      title="Nova anotação"
      submitLabel="Salvar anotação"
      isSaving={false}
      onSubmit={onSubmit}
      onCancel={() => {}}
      {...props}
    />,
  );
  return { onSubmit };
};

describe('NoteForm', () => {
  it('deve avisar quando falta descrever e não salvar', async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Conte o que aconteceu');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('deve avisar quanto passou do limite', async () => {
    const { onSubmit } = setup({
      initialValues: { kind: 'attention', description: 'a'.repeat(2005), notedAt: '2026-10-26' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }));

    expect(screen.getByRole('alert')).toHaveTextContent('5 caracteres');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('deve enviar tipo, data e descrição aparada', async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText('O que aconteceu'), '  Esqueceu o relatório  ');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'agreement_missed');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'agreement_missed', description: 'Esqueceu o relatório' }),
    );
  });
});
