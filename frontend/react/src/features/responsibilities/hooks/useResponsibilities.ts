import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Proposal, Responsibility } from '../types';

export const responsibilityKeys = {
  // Prefixo: invalida as duas variantes (com e sem aposentadas) de uma vez.
  list: (directReportId: string) => ['responsibilities', directReportId] as const,
  variant: (directReportId: string, includeRetired: boolean) =>
    ['responsibilities', directReportId, includeRetired] as const,
};

// Por padrão só as ativas; com `includeRetired`, também as que saíram do responsograma (histórico).
export function useResponsibilities(
  directReportId: string,
  { includeRetired = false }: { includeRetired?: boolean } = {},
) {
  return useQuery({
    queryKey: responsibilityKeys.variant(directReportId, includeRetired),
    queryFn: () =>
      apiFetch<Responsibility[]>(
        `/api/v1/direct-reports/${directReportId}/responsibilities${includeRetired ? '?retired=true' : ''}`,
      ),
    enabled: directReportId.length > 0,
  });
}

export function useRenameResponsibility(directReportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiFetch<Responsibility>(`/api/v1/responsibilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: responsibilityKeys.list(directReportId) }),
  });
}

// Lê um arquivo e devolve só uma proposta para os campos; nada é salvo no servidor.
export function useExtractProposal() {
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return apiFetch<Proposal>('/api/v1/responsibility-maps/extract', { method: 'POST', body });
    },
  });
}
