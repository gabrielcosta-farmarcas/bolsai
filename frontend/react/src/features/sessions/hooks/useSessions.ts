import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { NewSessionInput, Session, SessionDetail, SessionSummary } from '../types';

export const sessionKeys = {
  byReport: (directReportId: string) => ['sessions', 'by-report', directReportId] as const,
  detail: (id: string) => ['sessions', 'detail', id] as const,
};

export function useSessions(directReportId: string) {
  return useQuery({
    queryKey: sessionKeys.byReport(directReportId),
    queryFn: () => apiFetch<Session[]>(`/api/v1/direct-reports/${directReportId}/sessions`),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => apiFetch<SessionDetail>(`/api/v1/sessions/${id}`),
  });
}

export function useCreateSession(directReportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSessionInput) => {
      const url = `/api/v1/direct-reports/${directReportId}/sessions`;
      if (input.kind === 'file') {
        const body = new FormData();
        body.append('heldOn', input.heldOn);
        body.append('file', input.file);
        return apiFetch<SessionDetail>(url, { method: 'POST', body });
      }
      return apiFetch<SessionDetail>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heldOn: input.heldOn, transcript: input.transcript }),
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: sessionKeys.byReport(directReportId) }),
  });
}

// Texto do resumo (resumo, temas e combinados) pronto para copiar ou baixar.
// Também registra, no servidor, que o resumo foi exportado.
export function useSessionSummary(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<SessionSummary>(`/api/v1/sessions/${sessionId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) }),
  });
}

// Apaga o encontro e tudo que saiu dele (análises e combinados). Limpa o que a tela guardou dele.
export function useDeleteSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/v1/sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.removeQueries({ queryKey: ['analyses'] });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['agreements'] }),
        queryClient.invalidateQueries({ queryKey: ['timeline'] }),
      ]);
    },
  });
}
