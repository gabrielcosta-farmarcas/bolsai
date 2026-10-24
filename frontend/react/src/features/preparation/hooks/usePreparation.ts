import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Preparation } from '../types';

const POLL_INTERVAL_MS = 3000;

export const preparationKey = (directReportId: string) =>
  ['preparations', 'latest', directReportId] as const;

// O último roteiro da pessoa (nulo se nunca houve). Enquanto estiver sendo gerado, consulta de tempos em tempos.
export function usePreparation(directReportId: string) {
  return useQuery({
    queryKey: preparationKey(directReportId),
    queryFn: () =>
      apiFetch<Preparation | null>(`/api/v1/direct-reports/${directReportId}/preparations/latest`),
    enabled: directReportId.length > 0,
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? POLL_INTERVAL_MS : false,
  });
}

export function useStartPreparation(directReportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<Preparation>(`/api/v1/direct-reports/${directReportId}/preparations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    onSuccess: (started) => {
      queryClient.setQueryData(preparationKey(directReportId), started);
    },
  });
}
