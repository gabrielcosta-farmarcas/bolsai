import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('deve ter o nome acessível Bonsai e escrever o logotipo com ı sem pingo', () => {
    render(<Logo />);

    const logo = screen.getByRole('img', { name: 'Bonsai' });
    expect(logo).toHaveTextContent('bonsaı');
  });

  it('deve desenhar o símbolo com as três copas e o tronco', () => {
    const { container } = render(<Logo variant="simbolo" size={40} />);

    expect(container.querySelectorAll('rect')).toHaveLength(4);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '6 5 36 39');
  });

  it('não deve mostrar palavra na variante só símbolo', () => {
    render(<Logo variant="simbolo" />);

    expect(screen.getByRole('img', { name: 'Bonsai' })).not.toHaveTextContent('bonsa');
  });

  it('deve empilhar símbolo e logotipo na variante vertical', () => {
    render(<Logo variant="vertical" size={48} />);

    expect(screen.getByRole('img', { name: 'Bonsai' })).toHaveClass('flex-col');
  });

  it('deve respeitar o tamanho mínimo do símbolo (16 px)', () => {
    const { container } = render(<Logo variant="simbolo" size={8} />);

    expect(container.querySelector('svg')).toHaveAttribute('height', '16');
  });

  it('deve usar as cores fixas nas versões monocromáticas', () => {
    const { rerender } = render(<Logo tone="black" />);
    expect(screen.getByRole('img', { name: 'Bonsai' })).toHaveClass('text-brand-black');

    rerender(<Logo tone="white" />);
    expect(screen.getByRole('img', { name: 'Bonsai' })).toHaveClass('text-brand-white');
  });
});
