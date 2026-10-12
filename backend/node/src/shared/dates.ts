const SAO_PAULO = 'America/Sao_Paulo';

// Dia de hoje (AAAA-MM-DD) no calendário do líder. Instantes ficam em UTC; "atrasado" usa este dia.
export const todayInSaoPaulo = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: SAO_PAULO }).format(now);

export const toCalendarDate = (value: Date | null): string | null =>
  value ? value.toISOString().slice(0, 10) : null;

export const fromCalendarDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

// Atrasado = aberto e com prazo anterior a hoje. Calculado, nunca guardado.
export const isOverdue = (dueDate: string | null, status: string, today: string): boolean =>
  status === 'open' && dueDate !== null && dueDate < today;
