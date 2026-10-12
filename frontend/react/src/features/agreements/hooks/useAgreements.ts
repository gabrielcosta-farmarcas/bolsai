import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Page } from '@/lib/types';
import type { Agreement, AgreementPatch, AgreementStatusFilter, NewAgreementInput } from '../types';

const OVERVIEW_PAGE_SIZE = 100;

export const agreementKeys = {
  all: ['agreements'] as const,
  overview: (status: AgreementStatusFilter, directReportId: string) =>
    ['agreements', 'overview', status, directReportId] as const,
  byReport: (directReportId: string) => ['agreements', 'by-report', directReportId] as const,
  bySession: (sessionId: string) => ['agreements', 'by-session', sessionId] as const,
};

// Visão geral: todas as pessoas, com filtro de situação e de pessoa.
export function useAgreementsOverview(status: AgreementStatusFilter, directReportId: string) {
  return useQuery({
    queryKey: agreementKeys.overview(status, directReportId),
    queryFn: () => {
      const query = new URLSearchParams({ pageSize: String(OVERVIEW_PAGE_SIZE) });
      if (status !== 'all') query.set('status', status);
      if (directReportId) query.set('directReportId', directReportId);
      return apiFetch<Page<Agreement>>(`/api/v1/agreements?${query.toString()}`);
    },
  });
}

export function useReportAgreements(directReportId: string) {
  return useQuery({
    queryKey: agreementKeys.byReport(directReportId),
    queryFn: () => apiFetch<Agreement[]>(`/api/v1/direct-reports/${directReportId}/agreements`),
    enabled: directReportId.length > 0,
  });
}

export function useSessionAgreements(sessionId: string) {
  return useQuery({
    queryKey: agreementKeys.bySession(sessionId),
    queryFn: () => apiFetch<Agreement[]>(`/api/v1/sessions/${sessionId}/agreements`),
    enabled: sessionId.length > 0,
  });
}

// Mudar um combinado afeta listas e linha do tempo.
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: agreementKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['timeline'] }),
    ]);
}

export function useUpdateAgreement() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AgreementPatch }) =>
      apiFetch<Agreement>(`/api/v1/agreements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }),
    onSuccess: refresh,
  });
}

export function useCreateAgreement(directReportId: string) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (input: NewAgreementInput) =>
      apiFetch<Agreement>(`/api/v1/direct-reports/${directReportId}/agreements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: refresh,
  });
}
