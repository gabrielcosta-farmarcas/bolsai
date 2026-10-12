// Datas de calendário chegam como AAAA-MM-DD; formatamos sem passar por Date (evita erro de fuso).
export function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(isoInstant: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(isoInstant));
}

// "quinta-feira, 1 de outubro de 2026". A data de calendário é lida em UTC para não mudar de dia.
export function formatLongDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)),
  );
}

// Primeiro nome de "Gabriel Costa" (com a inicial maiúscula); vazio se não houver nome.
export function firstName(fullName: string | null | undefined): string {
  const first = fullName?.trim().split(/\s+/)[0] ?? '';
  return first.length > 0 ? first.charAt(0).toLocaleUpperCase('pt-BR') + first.slice(1) : '';
}
