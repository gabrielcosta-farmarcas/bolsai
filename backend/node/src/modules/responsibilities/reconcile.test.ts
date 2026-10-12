import { describe, expect, it } from 'vitest';
import { reconcile, type ExistingResponsibility } from './reconcile.js';

const existing = (
  id: string,
  key: string,
  position: number,
  retired = false,
): ExistingResponsibility => ({ id, key, position, retired });

const incoming = (...keys: string[]) => keys.map((key) => ({ key, text: key }));

describe('reconcile', () => {
  it('deve criar todas quando a pessoa ainda não tem nenhuma', () => {
    const plan = reconcile([], incoming('a', 'b', 'c'));

    expect(plan.create.map((item) => [item.key, item.position])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    expect(plan.keep).toEqual([]);
    expect(plan.retire).toEqual([]);
    expect(plan.reactivate).toEqual([]);
  });

  it('deve manter a mesma responsabilidade quando o texto é o mesmo', () => {
    const plan = reconcile(
      [existing('r1', 'a', 1), existing('r2', 'b', 2)],
      incoming('a', 'b', 'c'),
    );

    expect(plan.keep).toEqual([
      { id: 'r1', position: 1 },
      { id: 'r2', position: 2 },
    ]);
    expect(plan.create.map((item) => item.key)).toEqual(['c']);
  });

  it('deve manter o histórico quando só a posição muda', () => {
    const plan = reconcile(
      [existing('r1', 'a', 1), existing('r2', 'b', 2), existing('r3', 'c', 3)],
      incoming('c', 'a', 'b'),
    );

    expect(plan.keep).toEqual([
      { id: 'r3', position: 1 },
      { id: 'r1', position: 2 },
      { id: 'r2', position: 3 },
    ]);
    expect(plan.create).toEqual([]);
    expect(plan.retire).toEqual([]);
  });

  it('deve tratar texto editado como nova e aposentar a antiga', () => {
    const plan = reconcile(
      [existing('r1', 'a', 1), existing('r2', 'b', 2), existing('r3', 'c', 3)],
      incoming('a', 'b editado', 'c'),
    );

    expect(plan.create.map((item) => [item.key, item.position])).toEqual([['b editado', 2]]);
    expect(plan.retire).toEqual(['r2']);
    expect(plan.keep.map((item) => item.id)).toEqual(['r1', 'r3']);
  });

  it('deve aposentar a que deixou de vir', () => {
    const plan = reconcile(
      [
        existing('r1', 'a', 1),
        existing('r2', 'b', 2),
        existing('r3', 'c', 3),
        existing('r4', 'd', 4),
      ],
      incoming('a', 'b', 'c'),
    );

    expect(plan.retire).toEqual(['r4']);
  });

  it('deve reativar uma aposentada cujo texto voltou, com o histórico dela', () => {
    const plan = reconcile(
      [existing('r1', 'a', 1), existing('r9', 'velha', 9, true)],
      incoming('a', 'velha', 'c'),
    );

    expect(plan.reactivate).toEqual([{ id: 'r9', position: 2 }]);
    expect(plan.create.map((item) => item.key)).toEqual(['c']);
    expect(plan.retire).toEqual([]);
  });

  it('não deve aposentar de novo quem já estava aposentada', () => {
    const plan = reconcile(
      [existing('r1', 'a', 1), existing('r9', 'velha', 9, true)],
      incoming('a', 'b', 'c'),
    );

    expect(plan.retire).toEqual([]);
  });

  it('deve usar posições de 1 a N na ordem recebida, somando manter, reativar e criar', () => {
    const plan = reconcile(
      [existing('r1', 'a', 7), existing('r9', 'z', 3, true)],
      incoming('x', 'z', 'a'),
    );

    const positions = [
      ...plan.keep.map((item) => item.position),
      ...plan.reactivate.map((item) => item.position),
      ...plan.create.map((item) => item.position),
    ].sort((left, right) => left - right);
    expect(positions).toEqual([1, 2, 3]);
  });
});
