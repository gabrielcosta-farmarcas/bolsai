import { cn } from './cn';

describe('cn', () => {
  it('deve juntar classes e resolver conflito do Tailwind', () => {
    expect(cn('px-2', undefined, 'px-4')).toBe('px-4');
  });
});
