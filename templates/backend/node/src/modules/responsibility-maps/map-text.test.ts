import { describe, expect, it } from 'vitest';
import { composeMapText, composeResponsibilities } from './map-text.js';

describe('composeResponsibilities', () => {
  it('deve numerar uma por linha', () => {
    expect(composeResponsibilities([{ text: 'Onboarding' }, { text: 'Suporte' }])).toBe(
      '1. Onboarding\n2. Suporte',
    );
  });
});

describe('composeMapText', () => {
  it('deve juntar as duas seções com os títulos do cargo', () => {
    expect(
      composeMapText({
        mission: ' Garantir o sucesso do cliente. ',
        responsibilities: '1. Onboarding\n2. Suporte',
      }),
    ).toBe(
      'MISSÃO / FINALIDADE DO CARGO\nGarantir o sucesso do cliente.\n\nRESPONSABILIDADES\n1. Onboarding\n2. Suporte',
    );
  });

  it('deve incluir só a seção preenchida', () => {
    expect(composeMapText({ responsibilities: 'Atender clientes' })).toBe(
      'RESPONSABILIDADES\nAtender clientes',
    );
    expect(composeMapText({ mission: '  ', responsibilities: null })).toBe('');
  });
});
