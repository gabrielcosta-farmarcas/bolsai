import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewSessionForm } from './NewSessionForm';

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <NewSessionForm
      initialDate="2026-10-01"
      isSubmitting={false}
      onSubmit={onSubmit}
      onCancel={() => {}}
    />,
  );
  return onSubmit;
};

describe('NewSessionForm', () => {
  it('deve pedir a transcrição quando nada foi informado', async () => {
    const onSubmit = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar e analisar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Cole a transcrição');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('deve enviar a data e a transcrição colada', async () => {
    const onSubmit = renderForm();

    await userEvent.type(screen.getByLabelText('Ou cole a transcrição'), 'Marina: Oi!');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar e analisar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'text',
      heldOn: '2026-10-01',
      transcript: 'Marina: Oi!',
    });
  });
});
