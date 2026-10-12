import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsibilityFileImport } from './ResponsibilityFileImport';

const file = () => new File(['conteúdo'], 'cargo.docx');

describe('ResponsibilityFileImport', () => {
  it('deve ler o arquivo, entregar a proposta e pedir para conferir', async () => {
    const proposal = { responsibilities: ['A', 'B', 'C'], leftOut: [] };
    const onExtract = vi.fn().mockResolvedValue(proposal);
    const onProposal = vi.fn();
    render(<ResponsibilityFileImport onExtract={onExtract} onProposal={onProposal} />);

    await userEvent.upload(screen.getByLabelText(/Preencher a partir de um arquivo/), file());

    expect(onExtract).toHaveBeenCalledOnce();
    expect(onProposal).toHaveBeenCalledWith(proposal);
    expect(await screen.findByText(/Confira e ajuste antes de salvar/)).toBeInTheDocument();
  });

  it('deve avisar quando parágrafos ficaram de fora', async () => {
    const onExtract = vi.fn().mockResolvedValue({ responsibilities: ['A'], leftOut: ['X', 'Y'] });
    render(<ResponsibilityFileImport onExtract={onExtract} onProposal={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText(/Preencher a partir de um arquivo/), file());

    expect(await screen.findByText(/2 parágrafos ficaram de fora/)).toBeInTheDocument();
  });

  it('deve mostrar o erro e não entregar proposta quando a leitura falha', async () => {
    const onExtract = vi.fn().mockRejectedValue(new Error('O arquivo não tem texto legível.'));
    const onProposal = vi.fn();
    render(<ResponsibilityFileImport onExtract={onExtract} onProposal={onProposal} />);

    await userEvent.upload(screen.getByLabelText(/Preencher a partir de um arquivo/), file());

    expect(await screen.findByRole('alert')).toHaveTextContent('O arquivo não tem texto legível.');
    expect(onProposal).not.toHaveBeenCalled();
  });

  it('deve avisar que o arquivo não é guardado', () => {
    render(<ResponsibilityFileImport onExtract={vi.fn()} onProposal={vi.fn()} />);

    expect(screen.getByText(/ele não é guardado/)).toBeInTheDocument();
  });
});
