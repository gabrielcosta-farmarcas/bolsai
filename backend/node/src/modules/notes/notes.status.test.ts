import { describe, expect, it } from 'vitest';
import { computeNoteStatus, isStepOverdue } from './notes.status.js';

describe('computeNoteStatus', () => {
  it('sem passos e sem resolver: sem plano', () => {
    expect(computeNoteStatus({ resolvedAt: null, stepCount: 0 })).toBe('no_plan');
  });

  it('com passos: plano em andamento', () => {
    expect(computeNoteStatus({ resolvedAt: null, stepCount: 2 })).toBe('in_progress');
  });

  it('resolvida vale mais que os passos', () => {
    expect(computeNoteStatus({ resolvedAt: new Date(), stepCount: 3 })).toBe('resolved');
    expect(computeNoteStatus({ resolvedAt: new Date(), stepCount: 0 })).toBe('resolved');
  });
});

describe('isStepOverdue', () => {
  it('só atrasa se não foi feito e o prazo já passou', () => {
    expect(isStepOverdue({ dueDate: '2026-10-01', done: false }, '2026-10-05')).toBe(true);
    expect(isStepOverdue({ dueDate: '2026-10-01', done: true }, '2026-10-05')).toBe(false);
    expect(isStepOverdue({ dueDate: '2026-10-05', done: false }, '2026-10-05')).toBe(false);
    expect(isStepOverdue({ dueDate: null, done: false }, '2026-10-05')).toBe(false);
  });
});
