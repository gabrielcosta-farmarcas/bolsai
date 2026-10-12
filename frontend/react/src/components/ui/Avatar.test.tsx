import { initialsOf } from './Avatar';

describe('initialsOf', () => {
  it('deve usar a primeira e a última palavra do nome', () => {
    expect(initialsOf('Ana Beatriz Moura')).toBe('AM');
    expect(initialsOf('marina tavares')).toBe('MT');
  });

  it('deve funcionar com uma palavra só ou nome vazio', () => {
    expect(initialsOf('Carlos')).toBe('C');
    expect(initialsOf('   ')).toBe('');
  });
});
