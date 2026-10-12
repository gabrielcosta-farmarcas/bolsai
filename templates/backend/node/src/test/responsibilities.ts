// Responsabilidades fictícias de exemplo (mínimo de 3 exigido) para os testes.
export const sampleResponsibilities = [
  'Mapear e atuar na resolução de pontos de atrito identificados na jornada do cliente.',
  'Prestar atendimento e suporte técnico-operacional aos clientes pelos canais da empresa.',
  'Acompanhar a implementação de soluções e ajustes voltados aos clientes.',
  'Registrar e controlar o fluxo de demandas e ocorrências via sistema de CRM.',
];

// Corpo de cadastro de pessoa pronto para os testes de API.
export const newPersonBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ana Souza',
  role: 'Analista',
  startedAt: '2025-03-10',
  responsibilities: sampleResponsibilities,
  ...overrides,
});
