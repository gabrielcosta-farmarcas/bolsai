// Modelos que a líder pode escolher em Configurações. Quando sair um modelo novo, ele entra aqui.
export const AI_MODELS = [
  {
    id: 'claude-opus-5-5',
    label: 'Claude Opus 5.5',
    description: 'O mais capaz: análises mais profundas, um pouco mais lento e mais caro.',
  },
  {
    id: 'claude-sonnet-5-5',
    label: 'Claude Sonnet 5.5',
    description: 'Equilibrado entre qualidade, velocidade e custo.',
  },
  {
    id: 'claude-haiku-5-5',
    label: 'Claude Haiku 5.5',
    description: 'O mais rápido e barato, para análises mais simples.',
  },
  {
    id: 'claude-fable-5-1',
    label: 'Claude Fable 5.1',
    description: 'Modelo mais recente da família Claude 5.',
  },
] as const;

export const isKnownModel = (id: string) => AI_MODELS.some((model) => model.id === id);
