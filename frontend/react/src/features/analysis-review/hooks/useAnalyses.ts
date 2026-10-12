import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { AnalysisContent, AnalysisDetail, AnalysisSummary } from '../types';

const POLL_INTERVAL_MS = 3000;

export const analysisKeys = {
  bySession: (sessionId: string) => ['analyses', 'by-session', sessionId] as const,
  detail: (id: string) => ['analyses', 'detail', id] as const,
};

// Enquanto houver análise em processamento, consulta de tempos em tempos.
export function useAnalyses(sessionId: string) {
  return useQuery({
    queryKey: analysisKeys.bySession(sessionId),
    queryFn: () => apiFetch<AnalysisSummary[]>(`/api/v1/sessions/${sessionId}/analyses`),
    refetchInterval: (query) =>
      query.state.data?.some((item) => item.status === 'processing') ? POLL_INTERVAL_MS : false,
  });
}

export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: analysisKeys.detail(id ?? ''),
    queryFn: () => apiFetch<AnalysisDetail>(`/api/v1/analyses/${id}`),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? POLL_INTERVAL_MS : false,
  });
}

export function startAnalysis(sessionId: string) {
  return apiFetch<AnalysisSummary>(`/api/v1/sessions/${sessionId}/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}

export function useStartAnalysis(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startAnalysis(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: analysisKeys.bySession(sessionId) }),
  });
}

export function useSaveReview(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { analysisId: string; reviewedJson: AnalysisContent }) =>
      apiFetch<AnalysisSummary>(`/api/v1/sessions/${sessionId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['analyses'] }),
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
      ]),
  });
}
