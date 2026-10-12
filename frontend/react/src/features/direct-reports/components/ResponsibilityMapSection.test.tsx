import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Responsibility } from '@/features/responsibilities';
import { ResponsibilityMapSection } from './ResponsibilityMapSection';
import type { ResponsibilityMap } from '../types';

const map = (overrides: Partial<ResponsibilityMap> = {}): ResponsibilityMap => ({
  id: 'm1',
  version: 1,
  isCurrent: true,
  mission: 'Garantir o sucesso do cliente',
  responsibilities: '1. Atender os clientes\n2. Registrar no CRM\n3. Validar as entregas',
  createdAt: '2026-10-01T15:00:00.000Z',
  ...overrides,
});

const item = (
  id: string,
  position: number,
  text: string,
  overrides: Partial<Responsibility> = {},
): Responsibility => ({
  id,
  position,
  title: `Título ${position}`,
  titleSource: 'ai',
  text,
  retired: false,
  ...overrides,
});

const current = [
  item('q1', 1, 'Atender os clientes'),
  item('q2', 2, 'Registrar no CRM'),
  item('q3', 3, 'Validar as entregas'),
];

const renderSection = (overrides: Partial<Parameters<typeof ResponsibilityMapSection>[0]> = {}) => {
  const handlers = { onSave: vi.fn(), onRename: vi.fn(), onExtract: vi.fn() };
  render(
    <ResponsibilityMapSection
      maps={[map()]}
      responsibilities={current}
      isLoading={false}
      isSaving={false}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
};

describe('ResponsibilityMapSection', () => {
  it('deve partir das responsabilidades atuais e enviar a lista editada como nova versão', async () => {
    const { onSave } = renderSection();

    expect(screen.getByLabelText('Responsabilidade 2')).toHaveValue('Registrar no CRM');
    expect(screen.getByLabelText('Responsabilidade 4')).toHaveValue('');
    await userEvent.type(
      screen.getByLabelText('Responsabilidade 4'),
      'Acompanhar as implementações',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova versão' }));

    expect(onSave).toHaveBeenCalledWith({
      mission: 'Garantir o sucesso do cliente',
      responsibilities: [
        'Atender os clientes',
        'Registrar no CRM',
        'Validar as entregas',
        'Acompanhar as implementações',
      ],
    });
  });

  it('não deve salvar com menos de 3 e deve dizer quantas faltam', async () => {
    const { onSave } = renderSection();
    await userEvent.clear(screen.getByLabelText('Responsabilidade 2'));
    await userEvent.clear(screen.getByLabelText('Responsabilidade 3'));

    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova versão' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Faltam 2');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('deve listar as responsabilidades atuais com título e frase completa e permitir renomear', async () => {
    const { onRename } = renderSection();
    expect(screen.getByRole('heading', { name: 'Responsabilidades atuais' })).toBeInTheDocument();
    expect(screen.getByText('Título 1')).toBeInTheDocument();
    expect(screen.getAllByText('Atender os clientes').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: /Editar o título "Título 2"/ }));
    await userEvent.type(screen.getByLabelText('Título da responsabilidade'), ' novo{Enter}');

    expect(onRename).toHaveBeenCalledWith('q2', 'Título 2 novo');
  });

  it('não deve mostrar as aposentadas entre as atuais', () => {
    renderSection({
      responsibilities: [...current, item('q9', 4, 'Antiga que saiu', { retired: true })],
    });

    expect(screen.queryByText('Antiga que saiu')).not.toBeInTheDocument();
  });

  it('deve mostrar o conteúdo de cada versão e a marca de vigente', () => {
    renderSection();

    expect(screen.getByText('Vigente')).toBeInTheDocument();
    const versions = screen.getAllByRole('list').at(-1);
    expect(
      within(versions as HTMLElement).getByText(/1\. Atender os clientes/),
    ).toBeInTheDocument();
  });

  it('deve começar vazio quando ainda não há responsabilidades', () => {
    renderSection({ maps: [], responsibilities: [] });

    expect(screen.getByText(/Ainda não há responsograma/)).toBeInTheDocument();
    expect(screen.getByLabelText('Responsabilidade 1')).toHaveValue('');
  });

  it('deve preencher os campos a partir de um arquivo', async () => {
    const onExtract = vi.fn().mockResolvedValue({
      responsibilities: ['Do arquivo um', 'Do arquivo dois', 'Do arquivo três'],
      leftOut: [],
    });
    renderSection({ onExtract });

    await userEvent.upload(
      screen.getByLabelText(/Preencher a partir de um arquivo/),
      new File(['x'], 'cargo.pdf'),
    );

    expect(await screen.findByDisplayValue('Do arquivo dois')).toBeInTheDocument();
  });
});
